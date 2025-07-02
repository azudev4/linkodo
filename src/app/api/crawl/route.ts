import { NextRequest, NextResponse } from 'next/server';
import { crawlWebsite, CrawlConfig } from '@/lib/services/crawler';

export async function POST(request: NextRequest) {
  console.log('Crawl API: POST request received');
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Crawl API: Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('Crawl API: Request body:', body);
    
    const { baseUrl, maxPages, excludePatterns, forceRecrawl } = body;

    // Enhanced validation
    if (!baseUrl || typeof baseUrl !== 'string') {
      console.error('Crawl API: Missing or invalid baseUrl:', baseUrl);
      return NextResponse.json(
        { error: 'Base URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Clean up the URL
    const cleanUrl = baseUrl.trim();
    if (!cleanUrl) {
      return NextResponse.json(
        { error: 'Base URL cannot be empty' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(cleanUrl);
      
      // Ensure it's HTTP or HTTPS
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }
    } catch (urlError) {
      console.error('Crawl API: Invalid URL format:', cleanUrl, urlError);
      return NextResponse.json(
        { error: 'Invalid URL format. Please include http:// or https://' },
        { status: 400 }
      );
    }

    // Validate max pages
    let parsedMaxPages = 10; // Default
    if (maxPages !== undefined) {
      if (typeof maxPages === 'number') {
        parsedMaxPages = maxPages;
      } else if (typeof maxPages === 'string') {
        parsedMaxPages = parseInt(maxPages, 10);
        if (isNaN(parsedMaxPages)) {
          return NextResponse.json(
            { error: 'Max pages must be a valid number' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Max pages must be a number' },
          { status: 400 }
        );
      }
    }

    if (parsedMaxPages < 1 || parsedMaxPages > 1000) {
      return NextResponse.json(
        { error: 'Max pages must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Process exclude patterns
    let processedExcludePatterns: string[] | undefined = undefined;
    if (excludePatterns) {
      if (typeof excludePatterns === 'string') {
        processedExcludePatterns = excludePatterns
          .split(',')
          .map(pattern => pattern.trim())
          .filter(pattern => pattern.length > 0);
        
        if (processedExcludePatterns.length === 0) {
          processedExcludePatterns = undefined;
        }
      } else if (Array.isArray(excludePatterns)) {
        processedExcludePatterns = excludePatterns
          .filter(pattern => typeof pattern === 'string' && pattern.trim().length > 0)
          .map(pattern => pattern.trim());
        
        if (processedExcludePatterns.length === 0) {
          processedExcludePatterns = undefined;
        }
      } else {
        return NextResponse.json(
          { error: 'Exclude patterns must be a string or array' },
          { status: 400 }
        );
      }
    }

    // Validate environment variables
    if (!process.env.FIRECRAWL_API_KEY) {
      console.error('Crawl API: FIRECRAWL_API_KEY not configured');
      return NextResponse.json(
        { error: 'Crawl service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('Crawl API: OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    const config: CrawlConfig = {
      baseUrl: validatedUrl.toString(),
      maxPages: parsedMaxPages,
      excludePatterns: processedExcludePatterns,
      forceRecrawl: Boolean(forceRecrawl)
    };

    console.log('Crawl API: Starting crawl with validated config:', config);

    // Start the crawling process
    const jobId = await crawlWebsite(config);

    console.log('Crawl API: Crawl started successfully with job ID:', jobId);

    return NextResponse.json({
      success: true,
      jobId,
      message: `Crawl started for ${config.baseUrl} (max ${parsedMaxPages} pages)`,
      config: {
        baseUrl: config.baseUrl,
        maxPages: config.maxPages,
        excludePatterns: config.excludePatterns,
        forceRecrawl: config.forceRecrawl
      }
    });

  } catch (error) {
    console.error('Crawl API: Unexpected error:', error);
    
    // Determine error type and appropriate response
    let statusCode = 500;
    let errorMessage = 'Failed to start crawl';
    let errorDetails = 'Unknown error';

    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Check for specific error types
      if (error.message.includes('Firecrawl')) {
        errorMessage = 'Crawl service error';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('OpenAI')) {
        errorMessage = 'AI service error';
        statusCode = 503;
      } else if (error.message.includes('database') || error.message.includes('Supabase')) {
        errorMessage = 'Database error';
        statusCode = 503;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('Crawl API: GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      console.log('Crawl API: Fetching job status for:', jobId);
      
      // Validate jobId format (basic UUID check)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
        return NextResponse.json(
          { error: 'Invalid job ID format' },
          { status: 400 }
        );
      }

      const { supabase } = await import('@/lib/db/client');
      
      const { data, error } = await supabase
        .from('crawl_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Crawl API: Database error fetching job:', error);
        return NextResponse.json(
          { error: 'Job not found or database error' },
          { status: 404 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      console.log('Crawl API: Job status retrieved:', data.status);

      return NextResponse.json({
        success: true,
        job: data
      });

    } else {
      console.log('Crawl API: Fetching general crawl statistics');
      
      const { supabase } = await import('@/lib/db/client');
      
      // Get total pages indexed with better error handling
      const { data: pagesData, error: pagesError, count: pagesCount } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true });

      if (pagesError) {
        console.error('Crawl API: Error fetching pages count:', pagesError);
        throw new Error(`Failed to fetch pages count: ${pagesError.message}`);
      }

      // Get latest crawl jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('crawl_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) {
        console.error('Crawl API: Error fetching recent jobs:', jobsError);
        throw new Error(`Failed to fetch recent jobs: ${jobsError.message}`);
      }

      const stats = {
        totalPages: pagesCount || 0,
        recentJobs: jobsData || []
      };

      console.log('Crawl API: Statistics retrieved:', { totalPages: stats.totalPages, recentJobsCount: stats.recentJobs.length });

      return NextResponse.json({
        success: true,
        stats
      });
    }

  } catch (error) {
    console.error('Crawl API GET: Unexpected error:', error);
    
    let errorMessage = 'Failed to get crawl information';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('Supabase')) {
        errorMessage = 'Database error';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}