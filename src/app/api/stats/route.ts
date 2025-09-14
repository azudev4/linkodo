// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    let totalPagesCount = 0;
    let embeddingsCount = 0;
    let lastSync = null;

    // Try to get pages count - handle if table doesn't exist
    try {
      const { error: pagesError, count } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true });

      if (!pagesError) {
        totalPagesCount = count || 0;
      }
    } catch {
      console.log('Pages table not found or accessible');
    }

    // Try to get embeddings count - handle if table/column doesn't exist
    try {
      const { error: embeddingsError, count } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      if (!embeddingsError) {
        embeddingsCount = count || 0;
      }
    } catch {
      console.log('Embeddings column not found or accessible');
    }

    // Try to get recent sync history - handle if table doesn't exist
    try {
      const { data: recentSyncs } = await supabase
        .from('sync_history')
        .select('synced_at')
        .order('synced_at', { ascending: false })
        .limit(1);

      if (recentSyncs && recentSyncs.length > 0) {
        lastSync = recentSyncs[0].synced_at;
      }
    } catch {
      console.log('Sync history table not found or accessible');
    }

    const stats = {
      totalPages: totalPagesCount,
      pagesWithEmbeddings: embeddingsCount,
      pagesWithoutEmbeddings: totalPagesCount - embeddingsCount,
      embeddingProgress: totalPagesCount ? Math.round(embeddingsCount / totalPagesCount * 100) : 0,
      lastSync: lastSync
    };

    return NextResponse.json({ success: true, stats });
    
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}