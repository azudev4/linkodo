// src/app/api/oncrawl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient } from '@/lib/services/oncrawl/client';
import { syncPagesFromOnCrawl } from '@/lib/services/oncrawl/processor';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';
import * as XLSX from 'xlsx';

function generateExcel(pages: any[]): Buffer {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for Excel
  const excelData = pages.map(page => {
    const url = page.url || '';
    const title = page.title || '';
    const statusCode = page.status_code || '';
    const wordCount = page.word_count || '';
    const h1 = page.h1 || '';
    const metaDescription = page.meta_description || '';
    
    // Determine if page should be excluded
    const shouldExclude = shouldExcludeUrl(url) || (statusCode && parseInt(statusCode) !== 200);
    const exclusionReason = shouldExclude ? 
      (getExclusionReason(url) || `Status code: ${statusCode}`) : 
      '';
    
    return {
      'URL': url,
      'Title': title,
      'Status Code': statusCode,
      'Word Count': wordCount,
      'H1': h1,
      'Meta Description': metaDescription,
      'Excluded': shouldExclude ? 'YES' : 'NO',
      'Exclusion Reason': exclusionReason
    };
  });
  
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 60 }, // URL
    { wch: 40 }, // Title
    { wch: 12 }, // Status Code
    { wch: 12 }, // Word Count
    { wch: 30 }, // H1
    { wch: 50 }, // Meta Description
    { wch: 10 }, // Excluded
    { wch: 30 }  // Exclusion Reason
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'OnCrawl Pages');
  
  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  });
  
  return Buffer.from(excelBuffer);
}

function generateCSV(pages: any[]): string {
  const headers = ['URL', 'Title', 'Status Code', 'Word Count', 'H1', 'Meta Description', 'Excluded', 'Exclusion Reason'];
  
  const rows = pages.map((page, index) => {
    const url = page.url || '';
    const title = page.title || '';
    const statusCode = page.status_code || '';
    const wordCount = page.word_count || '';
    const h1 = page.h1 || '';
    const metaDescription = page.meta_description || '';
    
    // Determine if page should be excluded
    const shouldExclude = shouldExcludeUrl(url) || (statusCode && parseInt(statusCode) !== 200);
    const exclusionReason = shouldExclude ? 
      (getExclusionReason(url) || `Status code: ${statusCode}`) : 
      '';
    
    const fields = [
      url,
      title.replace(/"/g, '""'),
      statusCode,
      wordCount,
      h1.replace(/"/g, '""'),
      metaDescription.replace(/"/g, '""'),
      shouldExclude ? 'YES' : 'NO',
      exclusionReason.replace(/"/g, '""')
    ];
    
    // Debug problematic URLs
    if (url.includes(',')) {
      console.log('🔍 DEBUG: URL with comma found:', url);
      console.log('🔍 DEBUG: Raw fields:', fields);
      const csvRow = fields.map(field => `"${field}"`).join(',');
      console.log('🔍 DEBUG: Generated CSV row:', csvRow);
    }
    
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
      const format = searchParams.get('format') || 'excel'; // Default to Excel
      
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
      
      if (format === 'excel') {
        const excelBuffer = generateExcel(pages);
        
        return new Response(excelBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="oncrawl-pages-${crawlId}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        });
      } else {
        // CSV format (legacy)
        const csvContent = generateCSV(pages);
        console.log('🔍 DEBUG: First 200 chars of generated CSV:', csvContent.substring(0, 200));
        
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="oncrawl-pages-${crawlId}.csv"`,
            'Cache-Control': 'no-cache',
            'Content-Encoding': 'identity'
          }
        });
      }
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