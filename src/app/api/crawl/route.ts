import { NextRequest, NextResponse } from 'next/server';
import { crawlWebsite, CrawlConfig } from '@/lib/services/crawler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseUrl, maxPages, excludePatterns, forceRecrawl } = body;

    // Validation
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Base URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate max pages
    const parsedMaxPages = parseInt(maxPages) || 1000;
    if (parsedMaxPages < 1 || parsedMaxPages > 5000) {
      return NextResponse.json(
        { error: 'Max pages must be between 1 and 5000' },
        { status: 400 }
      );
    }

    // Process exclude patterns
    let processedExcludePatterns: string[] = [];
    if (excludePatterns && typeof excludePatterns === 'string') {
      processedExcludePatterns = excludePatterns
        .split(',')
        .map(pattern => pattern.trim())
        .filter(pattern => pattern.length > 0);
    }

    const config: CrawlConfig = {
      baseUrl: baseUrl.trim(),
      maxPages: parsedMaxPages,
      excludePatterns: processedExcludePatterns.length > 0 ? processedExcludePatterns : undefined,
      forceRecrawl: forceRecrawl || false
    };

    console.log('Starting crawl with config:', config);

    // Start the crawling process
    const jobId = await crawlWebsite(config);

    return NextResponse.json({
      success: true,
      jobId,
      message: `Crawl started for ${baseUrl} (max ${parsedMaxPages} pages)`
    });

  } catch (error) {
    console.error('Crawl API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start crawl',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get crawl status/statistics
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Return specific job status
      const { supabase } = await import('@/lib/db/client');
      
      const { data, error } = await supabase
        .from('crawl_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        job: data
      });
    } else {
      // Return general crawl statistics
      const { supabase } = await import('@/lib/db/client');
      
      // Get total pages indexed
      const { data: pagesData, error: pagesError } = await supabase
        .from('pages')
        .select('id', { count: 'exact' });

      if (pagesError) {
        throw pagesError;
      }

      // Get latest crawl jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('crawl_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) {
        throw jobsError;
      }

      return NextResponse.json({
        success: true,
        stats: {
          totalPages: pagesData?.length || 0,
          recentJobs: jobsData || []
        }
      });
    }

  } catch (error) {
    console.error('Crawl GET API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get crawl information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}