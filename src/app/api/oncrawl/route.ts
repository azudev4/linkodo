// src/app/api/oncrawl/route.ts - OPTIMIZED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient } from '@/lib/services/oncrawl/client';
import { OnCrawlPage, SyncMode } from '@/lib/services/oncrawl/types';
import { syncPagesFromOnCrawlOptimized } from '@/lib/services/oncrawl/processor';
import { determinePageCategory } from '@/lib/services/oncrawl/processing/page-normalizer';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/services/oncrawl/processing/filtering/linkfilter';
import * as XLSX from 'xlsx';

// Cache for category determinations
const categoryCache = new Map<string, string>();

// Batch size for processing pages
const BATCH_SIZE = 1000;

/**
 * Generate Excel file from OnCrawl pages data
 */
function generateExcel(pages: OnCrawlPage[]): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Process pages in batches to reduce memory pressure
  const processPageBatch = (batch: OnCrawlPage[]) => batch.map(page => {
    const url = page.url || '';
    
    // Only process category if URL is valid and not in cache
    let category = '';
    if (url) {
      category = categoryCache.get(url) || '';
      if (!category) {
        category = determinePageCategory(url);
        categoryCache.set(url, category);
      }
    }

    // Quick exclusion check without unnecessary string operations
    const statusCode = page.status_code ? parseInt(page.status_code) : 0;
    const shouldExclude = !url || shouldExcludeUrl(
      url, 
      page.title || undefined, 
      page.meta_description || undefined,
      page.h1 || undefined,
      statusCode || undefined
    );

    // Only get exclusion reason if actually excluded
    const exclusionReason = shouldExclude ? 
      (!url ? 'No URL' : getExclusionReason(
        url, 
        page.title || undefined, 
        page.meta_description || undefined,
        page.h1 || undefined,
        statusCode || undefined
      )) : '';
    
    // Return minimal object with only necessary transformations
    return {
      'URL': url,
      'Title': page.title || '',
      'Category': category,
      'Status Code': page.status_code || '',
      'Word Count': page.word_count || '',
      'H1': page.h1 || '',
      'Meta Description': page.meta_description || '',
      'Depth': page.depth || '',
      'Internal Rank (Decimal)': page.inrank_decimal || '',
      'Internal Outlinks': page.internal_outlinks || '',
      'Inlinks Count': page.nb_inlinks || '',
      'Excluded': shouldExclude ? 'YES' : 'NO',
      'Exclusion Reason': exclusionReason
    };
  });

  // Process pages in batches
  const excelData = [];
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    excelData.push(...processPageBatch(batch));
  }
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const columnWidths = [
    { wch: 60 }, // URL
    { wch: 40 }, // Title
    { wch: 15 }, // Category
    { wch: 12 }, // Status Code
    { wch: 12 }, // Word Count
    { wch: 30 }, // H1
    { wch: 50 }, // Meta Description
    { wch: 8 },  // Depth
    { wch: 15 }, // Internal Rank (Decimal)
    { wch: 12 }, // Internal Outlinks
    { wch: 12 }, // Inlinks Count
    { wch: 10 }, // Excluded
    { wch: 30 }  // Exclusion Reason
  ];
  worksheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'OnCrawl Pages');
  
  // Use compression to reduce file size
  return Buffer.from(XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  }));
}

/**
 * Handle GET requests - Projects, Crawls, and Downloads
 */
export async function GET(request: NextRequest) {
  if (!process.env.ONCRAWL_API_TOKEN) {
    return NextResponse.json({ error: 'OnCrawl API token not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const projectId = searchParams.get('projectId');
    
    // Get all projects from both tokens
    if (action === 'projects') {
      const client1 = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN);
      const allProjects = [];
      
      try {
        const projects1 = await client1.getProjects();
        // Add token identifier to each project
        const projectsWithToken1 = projects1.map(project => ({
          ...project,
          tokenSource: 'token1'
        }));
        allProjects.push(...projectsWithToken1);
      } catch (error) {
        console.error('Error fetching projects from token 1:', error);
      }
      
      // If second token exists, fetch projects from it too
      if (process.env.ONCRAWL_API_TOKEN_2) {
        const client2 = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN_2);
        try {
          const projects2 = await client2.getProjects();
          // Add token identifier to each project
          const projectsWithToken2 = projects2.map(project => ({
            ...project,
            tokenSource: 'token2'
          }));
          allProjects.push(...projectsWithToken2);
        } catch (error) {
          console.error('Error fetching projects from token 2:', error);
        }
      }
      
      return NextResponse.json({ success: true, projects: allProjects });
    }
    
    // For other actions, we need to determine which token to use
    const getClientForProject = async (projectId: string) => {
      if (!projectId) return new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
      
      // First try to find the project in token 1
      const client1 = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
      try {
        const projects1 = await client1.getProjects();
        if (projects1.find(p => p.id === projectId)) {
          return client1;
        }
      } catch (error) {
        console.error('Error checking token 1 for project:', error);
      }
      
      // If not found and token 2 exists, try token 2
      if (process.env.ONCRAWL_API_TOKEN_2) {
        const client2 = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN_2);
        try {
          const projects2 = await client2.getProjects();
          if (projects2.find(p => p.id === projectId)) {
            return client2;
          }
        } catch (error) {
          console.error('Error checking token 2 for project:', error);
        }
      }
      
      // Default to token 1 if not found
      return client1;
    };
    
    const client = await getClientForProject(projectId || '');
    
    // Download Excel file with latest accessible crawl data
    if (action === 'download') {
      
      if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
      }
      
      try {
        const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
        const excelBuffer = generateExcel(pages);
        
        // Handle undefined crawl name
        const safeCrawlName = (crawl.name || 'crawl').replace(/[^a-zA-Z0-9]/g, '_');
        
        return new Response(excelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="oncrawl-${safeCrawlName}-${crawl.id}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        });
      } catch (error: unknown) {
        console.error('Download error:', error);
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'Failed to download data from latest accessible crawl' 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: unknown) {
    console.error('OnCrawl API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process request' 
    }, { status: 500 });
  }
}

/**
 * Handle POST requests - OPTIMIZED Sync data with sync modes
 */
export async function POST(request: NextRequest) {
  if (!process.env.ONCRAWL_API_TOKEN) {
    return NextResponse.json({ error: 'OnCrawl API token not configured' }, { status: 500 });
  }

  try {
    const { projectId, syncMode } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    
    // Determine which token to use for this project
    const getTokenForProject = async (projectId: string) => {
      // First try to find the project in token 1
      const client1 = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
      try {
        const projects1 = await client1.getProjects();
        if (projects1.find(p => p.id === projectId)) {
          return process.env.ONCRAWL_API_TOKEN;
        }
      } catch (error) {
        console.error('Error checking token 1 for project:', error);
      }
      
      // If not found and token 2 exists, try token 2
      if (process.env.ONCRAWL_API_TOKEN_2) {
        const client2 = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN_2);
        try {
          const projects2 = await client2.getProjects();
          if (projects2.find(p => p.id === projectId)) {
            return process.env.ONCRAWL_API_TOKEN_2;
          }
        } catch (error) {
          console.error('Error checking token 2 for project:', error);
        }
      }
      
      // Default to token 1 if not found
      return process.env.ONCRAWL_API_TOKEN;
    };
    
    const token = await getTokenForProject(projectId);
    
    // Validate sync mode
    const validSyncMode = syncMode && Object.values(SyncMode).includes(syncMode) 
      ? syncMode as SyncMode 
      : SyncMode.FULL;
    
    const syncModeLabel = validSyncMode === SyncMode.URL_ONLY ? 'URL-ONLY' : 
                         validSyncMode === SyncMode.CONTENT ? 'CONTENT' : 'FULL';
    console.log(`🚀 Starting ${syncModeLabel} sync for project: ${projectId} using ${token === process.env.ONCRAWL_API_TOKEN ? 'token 1' : 'token 2'}`);
    const startTime = Date.now();
    
    // Use the sync function with the specified mode and token
    const result = await syncPagesFromOnCrawlOptimized(projectId, validSyncMode, token);
    
    const duration = Date.now() - startTime;
    const rate = duration > 0 ? Math.round(result.processed / (duration / 1000)) : 0;
    const speedNote = validSyncMode === SyncMode.URL_ONLY ? ' (⚡ URL-only mode)' : '';
    
    console.log(`✅ ${syncModeLabel} sync completed in ${duration}ms${speedNote}:
      📥 Added: ${result.added} pages
      🔄 Updated: ${result.updated} pages
      ⚪ Unchanged: ${result.unchanged} pages
      🗑️  Removed: ${result.removed} pages
      ❌ Failed: ${result.failed} pages
      📊 Rate: ${rate} pages/sec
    `);
    
    return NextResponse.json({ 
      success: true, 
      syncMode: validSyncMode,
      duration_ms: duration,
      rate,
      processed: result.processed,
      added: result.added,
      updated: result.updated,
      unchanged: result.unchanged,
      removed: result.removed,
      failed: result.failed
    });
    
  } catch (error: unknown) {
    console.error('OnCrawl sync error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync data' 
    }, { status: 500 });
  }
}