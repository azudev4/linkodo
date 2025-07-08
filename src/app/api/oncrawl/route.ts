// src/app/api/oncrawl/route.ts - OPTIMIZED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient } from '@/lib/services/oncrawl/client';
import { OnCrawlPage, SyncMode } from '@/lib/services/oncrawl/types';
import { syncPagesFromOnCrawlOptimized } from '@/lib/services/oncrawl/processor';
import { determinePageCategory } from '@/lib/services/oncrawl/processing/page-normalizer';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';
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
    const shouldExclude = !url || 
      (statusCode && statusCode !== 200) || 
      shouldExcludeUrl(url, page.title || undefined, page.meta_description || undefined);

    // Only get exclusion reason if actually excluded
    const exclusionReason = shouldExclude ? 
      (!url ? 'No URL' : 
        (statusCode && statusCode !== 200) ? `Status code: ${statusCode}` : 
        getExclusionReason(url, page.title || undefined, page.meta_description || undefined)
      ) : '';
    
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
    const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN);
    
    // Get all projects
    if (action === 'projects') {
      const projects = await client.getProjects();
      return NextResponse.json({ success: true, projects });
    }
    
    // Download Excel file with latest accessible crawl data
    if (action === 'download') {
      const projectId = searchParams.get('projectId');
      
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
      } catch (error: any) {
        console.error('Download error:', error);
        return NextResponse.json({ 
          error: error.message || 'Failed to download data from latest accessible crawl' 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('OnCrawl API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process request' 
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
    
    // Validate sync mode
    const validSyncMode = syncMode && Object.values(SyncMode).includes(syncMode) 
      ? syncMode as SyncMode 
      : SyncMode.FULL;
    
    const syncModeLabel = validSyncMode === SyncMode.URL_ONLY ? 'URL-ONLY' : 'FULL';
    console.log(`🚀 Starting ${syncModeLabel} sync for project: ${projectId}`);
    const startTime = Date.now();
    
    // Use the sync function with the specified mode
    const result = await syncPagesFromOnCrawlOptimized(projectId, validSyncMode);
    
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
      processed: result.processed,
      added: result.added,
      updated: result.updated,
      unchanged: result.unchanged,
      removed: result.removed,
      failed: result.failed,
      duration_ms: duration,
      syncMode: validSyncMode,
      message: `Successfully completed ${syncModeLabel} sync: ${result.processed} pages processed in ${duration}ms${speedNote}`
    });
    
  } catch (error: any) {
    console.error('OnCrawl sync error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to sync data from latest accessible crawl' 
    }, { status: 500 });
  }
}