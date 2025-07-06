// src/app/api/oncrawl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient } from '@/lib/services/oncrawl/client';
import { syncPagesFromOnCrawl } from '@/lib/services/oncrawl/processor';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';
import * as XLSX from 'xlsx';

function generateExcel(pages: any[]): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel with ALL available fields (CORRECTED)
  const excelData = pages.map(page => {
    const url = page.url || '';
    const title = page.title || '';
    const statusCode = page.status_code || '';
    const wordCount = page.word_count || '';
    const h1 = page.h1 || '';
    const metaDescription = page.meta_description || '';
    
    // SEO metrics with CORRECTED field names
    const depth = page.depth || '';
    const inrankDecimal = page.inrank_decimal || '';           // CORRECTED
    const internalOutlinks = page.internal_outlinks || '';     // CORRECTED
    const nbInlinks = page.nb_inlinks || '';
    
    // Determine if page should be excluded - now with meta description
    const shouldExclude = shouldExcludeUrl(url, metaDescription) || (statusCode && parseInt(statusCode) !== 200);
    const exclusionReason = shouldExclude ? 
      (getExclusionReason(url, metaDescription) || `Status code: ${statusCode}`) : 
      '';
    
    return {
      'URL': url,
      'Title': title,
      'Status Code': statusCode,
      'Word Count': wordCount,
      'H1': h1,
      'Meta Description': metaDescription,
      
      // SEO metrics for internal linking
      'Depth': depth,
      'Internal Rank (Decimal)': inrankDecimal,
      'Internal Outlinks': internalOutlinks,
      'Inlinks Count': nbInlinks,
      
      'Excluded': shouldExclude ? 'YES' : 'NO',
      'Exclusion Reason': exclusionReason
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Update column widths to include new columns
  const columnWidths = [
    { wch: 60 }, // URL
    { wch: 40 }, // Title
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

function generateCSV(pages: any[]): string {
  const headers = [
    'URL', 'Title', 'Status Code', 'Word Count', 'H1', 'Meta Description',
    'Depth', 'Internal Rank (Decimal)', 'Internal Outlinks', 'Inlinks Count',
    'Excluded', 'Exclusion Reason'
  ];
  
  const rows = pages.map((page) => {
    const url = page.url || '';
    const title = page.title || '';
    const statusCode = page.status_code || '';
    const wordCount = page.word_count || '';
    const h1 = page.h1 || '';
    const metaDescription = page.meta_description || '';
    
    // SEO metrics with CORRECTED field names
    const depth = page.depth || '';
    const inrankDecimal = page.inrank_decimal || '';           // CORRECTED
    const internalOutlinks = page.internal_outlinks || '';     // CORRECTED
    const nbInlinks = page.nb_inlinks || '';
    
    // Updated to include meta description in exclusion checks
    const shouldExclude = shouldExcludeUrl(url, metaDescription) || (statusCode && parseInt(statusCode) !== 200);
    const exclusionReason = shouldExclude ? 
      (getExclusionReason(url, metaDescription) || `Status code: ${statusCode}`) : 
      '';
    
    const fields = [
      url,
      title.replace(/"/g, '""'),
      statusCode,
      wordCount,
      h1.replace(/"/g, '""'),
      metaDescription.replace(/"/g, '""'),
      depth,
      inrankDecimal,
      internalOutlinks,
      nbInlinks,
      shouldExclude ? 'YES' : 'NO',
      exclusionReason.replace(/"/g, '""')
    ];
    
    return fields.map(field => `"${field}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  if (!process.env.ONCRAWL_API_TOKEN) {
    return NextResponse.json({ error: 'OnCrawl API token not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN);
    
    if (action === 'projects') {
      const projects = await client.getProjects();
      return NextResponse.json({ success: true, projects });
    }

    if (action === 'crawls') {
      const projectId = searchParams.get('projectId');
      if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
      }
      
      const crawls = await client.getCrawls(projectId);
      const crawlsWithStatus = await Promise.all(
        crawls.map(async (crawl) => ({
          ...crawl,
          isAccessible: await client.isCrawlAccessible(crawl.id).catch(() => false)
        }))
      );
      
      return NextResponse.json({ success: true, crawls: crawlsWithStatus });
    }
    
    if (action === 'download') {
      const crawlId = searchParams.get('crawlId');
      
      if (!crawlId) {
        return NextResponse.json({ error: 'crawlId required' }, { status: 400 });
      }
      
      const isAccessible = await client.isCrawlAccessible(crawlId);
      if (!isAccessible) {
        return NextResponse.json(
          { error: 'Crawl is not accessible. The crawl must be in a "live" state to download data.' },
          { status: 409 }
        );
      }

      const pages = await client.getAllPages(crawlId);
      const excelBuffer = generateExcel(pages);
      
      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="oncrawl-pages-${crawlId}.xlsx"`,
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('OnCrawl API error:', error);
    
    if (error.message?.includes('must be live')) {
      return NextResponse.json(
        { error: 'Crawl is not accessible. The crawl must be in a "live" state to access its data.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.ONCRAWL_API_TOKEN) {
    return NextResponse.json({ error: 'OnCrawl API token not configured' }, { status: 500 });
  }

  try {
    const { crawlId } = await request.json();
    
    if (!crawlId) {
      return NextResponse.json({ error: 'crawlId required' }, { status: 400 });
    }
    
    const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN);
    const isAccessible = await client.isCrawlAccessible(crawlId);
    
    if (!isAccessible) {
      return NextResponse.json(
        { error: 'Crawl is not accessible. The crawl must be in a "live" state to sync data.' },
        { status: 409 }
      );
    }

    const result = await syncPagesFromOnCrawl(crawlId);
    
    return NextResponse.json({
      success: true,
      ...result,
      message: `Synced ${result.processed} pages from OnCrawl`
    });
    
  } catch (error: any) {
    console.error('OnCrawl sync error:', error);
    
    if (error.message?.includes('must be live')) {
      return NextResponse.json(
        { error: 'Crawl is not accessible. The crawl must be in a "live" state to access its data.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}