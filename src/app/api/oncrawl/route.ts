// src/app/api/oncrawl/route.ts - OPTIMIZED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient, OnCrawlPage } from '@/lib/services/oncrawl/client';
import { syncPagesFromOnCrawlOptimized, determinePageCategory } from '@/lib/services/oncrawl/processor';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';
import * as XLSX from 'xlsx';

/**
 * Generate Excel file from OnCrawl pages data
 */
function generateExcel(pages: OnCrawlPage[]): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel with all available fields
  const excelData = pages.map(page => {
    const url = page.url || '';
    const title = page.title || '';
    const statusCode = page.status_code || '';
    const wordCount = page.word_count || '';
    const h1 = page.h1 || '';
    const metaDescription = page.meta_description || '';
    
    // SEO metrics
    const depth = page.depth || '';
    const inrankDecimal = page.inrank_decimal || '';
    const internalOutlinks = page.internal_outlinks || '';
    const nbInlinks = page.nb_inlinks || '';
    
    // Determine page category and exclusion status
    const category = determinePageCategory(url);
    const shouldExclude = !url || shouldExcludeUrl(url, metaDescription || undefined) || (statusCode && parseInt(statusCode) !== 200);
    const exclusionReason = shouldExclude ? 
      (!url ? 'No URL' : 
        statusCode && parseInt(statusCode) !== 200 ? `Status code: ${statusCode}` : 
        getExclusionReason(url, metaDescription || undefined) || 'Unknown reason'
      ) : '';
    
    return {
      'URL': url,
      'Title': title,
      'Category': category,
      'Status Code': statusCode,
      'Word Count': wordCount,
      'H1': h1,
      'Meta Description': metaDescription,
      'Depth': depth,
      'Internal Rank (Decimal)': inrankDecimal,
      'Internal Outlinks': internalOutlinks,
      'Inlinks Count': nbInlinks,
      'Excluded': shouldExclude ? 'YES' : 'NO',
      'Exclusion Reason': exclusionReason
    };
  });
  
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
  
  const excelBuffer = XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  });
  
  return Buffer.from(excelBuffer);
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
 * Handle POST requests - OPTIMIZED Sync data from latest accessible crawl
 */
export async function POST(request: NextRequest) {
  if (!process.env.ONCRAWL_API_TOKEN) {
    return NextResponse.json({ error: 'OnCrawl API token not configured' }, { status: 500 });
  }

  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    
    console.log(`🚀 Starting OPTIMIZED sync for project: ${projectId}`);
    const startTime = Date.now();
    
    // Use the new optimized sync function
    const result = await syncPagesFromOnCrawlOptimized(projectId);
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Optimized sync completed in ${duration}ms:
      📥 Processed: ${result.processed} pages
      ❌ Failed: ${result.failed} pages
    `);
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      duration_ms: duration,
      message: `Successfully synced ${result.processed} pages from latest accessible crawl in ${duration}ms`
    });
    
  } catch (error: any) {
    console.error('OnCrawl optimized sync error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to sync data from latest accessible crawl' 
    }, { status: 500 });
  }
}