import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const BATCH_SIZE = 1000;

export async function POST() {
  try {
    const supabase = createServiceRoleClient();
    let totalReset = 0;
    let hasMore = true;

    while (hasMore) {
      // Get next batch of pages with embeddings
      const { data: pages, error: fetchError } = await supabase
        .from('pages')
        .select('id')
        .not('embedding', 'is', null)
        .limit(BATCH_SIZE);

      if (fetchError) throw fetchError;
      
      // Stop if no more pages to process
      if (!pages || pages.length === 0) {
        hasMore = false;
        break;
      }

      // Reset embeddings for this batch
      const { error: updateError } = await supabase
        .from('pages')
        .update({ embedding: null })
        .in('id', pages.map(p => p.id));

      if (updateError) throw updateError;

      totalReset += pages.length;
    }

    return NextResponse.json({ 
      success: true,
      totalReset 
    });
  } catch (error) {
    console.error('Error resetting embeddings:', error);
    return NextResponse.json(
      { error: 'Failed to reset embeddings' },
      { status: 500 }
    );
  }
} 