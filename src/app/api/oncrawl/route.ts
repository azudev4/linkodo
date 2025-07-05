// src/app/api/oncrawl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient } from '@/lib/services/oncrawl/client';
import { syncPagesFromOnCrawl } from '@/lib/services/oncrawl/processor';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';

function generateCSV(pages: any[]): string {
  const headers = ['URL', 'Title', 'Status Code', 'Word Count', 'H1', 'Meta Description', 'Excluded', 'Exclusion Reason'];
  
  const rows = pages.map(page => {
    const shouldExclude = shouldExcludeUrl(page.url) || (page.status_code && page.status_code !== 200);
    const exclusionReason = shouldExclude ? 
      (getExclusionReason(page.url) || `Status code: ${page.status_code}`) : 
      '';
    
    return [
      page.url || '',
      (page.title || '').replace(/"/g, '""'),
      page.status_code?.toString() || '',
      page.word_count?.toString() || '',
      (page.h1 || '').replace(/"/g, '""'),
      (page.meta_description || '').replace(/"/g, '""'),
      shouldExclude ? 'YES' : 'NO',
      exclusionReason.replace(/"/g, '""')
    ].map(field => `"${field}"`).join(',');
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
      const csvContent = generateCSV(pages);
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="oncrawl-pages-${crawlId}.csv"`
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