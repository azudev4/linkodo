// src/app/api/indexing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OnCrawlClient } from '@/lib/services/oncrawl/client';
import { syncPagesFromOnCrawl } from '@/lib/services/oncrawl/processor';
import { batchGenerateEmbeddings } from '@/lib/services/embeding/embeddings';
import { supabase } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      // Get database statistics
      const { data: totalPages, error: pagesError, count: totalPagesCount } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true });

      if (pagesError) {
        throw new Error(`Failed to fetch pages count: ${pagesError.message}`);
      }

      const { data: pagesWithEmbeddings, error: embeddingsError, count: embeddingsCount } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      if (embeddingsError) {
        throw new Error(`Failed to fetch embeddings count: ${embeddingsError.message}`);
      }

      // Get recent sync history
      const { data: recentSyncs, error: syncsError } = await supabase
        .from('pages')
        .select('last_crawled')
        .order('last_crawled', { ascending: false })
        .limit(1);

      const stats = {
        totalPages: totalPagesCount || 0,
        pagesWithEmbeddings: embeddingsCount || 0,
        pagesWithoutEmbeddings: (totalPagesCount || 0) - (embeddingsCount || 0),
        embeddingProgress: totalPagesCount ? Math.round((embeddingsCount || 0) / totalPagesCount * 100) : 0,
        lastSync: recentSyncs && recentSyncs.length > 0 ? recentSyncs[0].last_crawled : null
      };

      return NextResponse.json({ success: true, stats });
    }
    
    if (!process.env.ONCRAWL_API_TOKEN) {
      return NextResponse.json(
        { error: 'OnCrawl API token not configured' },
        { status: 500 }
      );
    }
    
    const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN);
    
    if (action === 'projects') {
      const projects = await client.getProjects();
      return NextResponse.json({ success: true, projects });
    }
    
    if (action === 'crawls') {
      const workspaceId = searchParams.get('workspaceId');
      if (!workspaceId) {
        return NextResponse.json(
          { error: 'workspaceId required' },
          { status: 400 }
        );
      }
      
      const crawls = await client.getCrawls(workspaceId);
      return NextResponse.json({ success: true, crawls });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Indexing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, crawlId } = await request.json();
    
    if (action === 'sync') {
      if (!process.env.ONCRAWL_API_TOKEN) {
        return NextResponse.json(
          { error: 'OnCrawl API token not configured' },
          { status: 500 }
        );
      }
      
      if (!crawlId) {
        return NextResponse.json(
          { error: 'crawlId required' },
          { status: 400 }
        );
      }
      
      console.log(`Starting OnCrawl sync for crawl: ${crawlId}`);
      
      const result = await syncPagesFromOnCrawl(crawlId);
      
      return NextResponse.json({
        success: true,
        ...result,
        message: `Synced ${result.processed} pages from OnCrawl`
      });
    }
    
    if (action === 'generate-embeddings') {
      console.log('Starting batch embedding generation...');
      
      const result = await batchGenerateEmbeddings();
      
      return NextResponse.json({
        success: true,
        ...result,
        message: `Generated embeddings for ${result.processed} pages`
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Indexing operation error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}