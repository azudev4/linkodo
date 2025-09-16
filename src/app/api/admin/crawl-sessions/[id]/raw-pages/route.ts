import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceRoleClient();
    const { id } = await params;

    const { data: rawPages, error } = await supabase
      .from('raw_pages')
      .select('*')
      .eq('session_id', id)
      .order('crawled_at', { ascending: false });

    if (error) {
      console.error('Error fetching raw pages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch raw pages' },
        { status: 500 }
      );
    }

    return NextResponse.json(rawPages || []);
  } catch (error) {
    console.error('Error in raw pages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}