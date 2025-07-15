// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';

export async function GET() {
  try {
    // Get database statistics
    const { error: pagesError, count: totalPagesCount } = await supabase
      .from('pages')
      .select('id', { count: 'exact', head: true });

    if (pagesError) {
      throw new Error(`Failed to fetch pages count: ${pagesError.message}`);
    }

    const { error: embeddingsError, count: embeddingsCount } = await supabase
      .from('pages')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    if (embeddingsError) {
      throw new Error(`Failed to fetch embeddings count: ${embeddingsError.message}`);
    }

    // Get recent sync history from sync_history table
    const { data: recentSyncs } = await supabase
      .from('sync_history')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1);

    const stats = {
      totalPages: totalPagesCount || 0,
      pagesWithEmbeddings: embeddingsCount || 0,
      pagesWithoutEmbeddings: (totalPagesCount || 0) - (embeddingsCount || 0),
      embeddingProgress: totalPagesCount ? Math.round((embeddingsCount || 0) / totalPagesCount * 100) : 0,
      lastSync: recentSyncs && recentSyncs.length > 0 ? recentSyncs[0].synced_at : null
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