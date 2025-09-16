import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { id } = params;

    const { data: session, error } = await supabase
      .from('crawl_sessions')
      .select(`
        *,
        client_profile:profiles!client(
          id,
          full_name,
          email,
          company_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Crawl session not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching crawl session:', error);
      return NextResponse.json(
        { error: 'Failed to fetch crawl session' },
        { status: 500 }
      );
    }

    const { data: pageStats } = await supabase
      .from('raw_pages')
      .select('id, status_code, url')
      .eq('session_id', id);

    const totalPages = pageStats?.length || 0;
    const successfulPages = pageStats?.filter(p => p.status_code === 200)?.length || 0;

    const { data: processedPages } = await supabase
      .from('pages')
      .select('id, url')
      .eq('session_id', id);

    const includedPages = processedPages?.length || 0;

    const sessionWithStats = {
      ...session,
      total_pages: totalPages,
      included_pages: includedPages,
      excluded_pages: totalPages - includedPages,
      success_rate: totalPages > 0 ? Math.round((successfulPages / totalPages) * 100) : 0
    };

    return NextResponse.json(sessionWithStats);
  } catch (error) {
    console.error('Error in crawl session GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { id } = params;
    const body = await request.json();

    const allowedUpdates = ['status', 'client', 'domain', 'review_progress'];
    const updates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('crawl_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Crawl session not found' },
          { status: 404 }
        );
      }
      console.error('Error updating crawl session:', error);
      return NextResponse.json(
        { error: 'Failed to update crawl session' },
        { status: 500 }
      );
    }

    // If client assignment was updated, also update all related pages
    if ('client' in updates) {
      const clientId = updates.client;

      // Update raw_pages
      const { error: rawPagesError } = await supabase
        .from('raw_pages')
        .update({ client: clientId })
        .eq('session_id', id);

      if (rawPagesError) {
        console.error('Error updating raw_pages client assignment:', rawPagesError);
        // Don't fail the request, but log the error
      }

      // Update pages (processed pages)
      const { error: pagesError } = await supabase
        .from('pages')
        .update({ client: clientId })
        .eq('session_id', id);

      if (pagesError) {
        console.error('Error updating pages client assignment:', pagesError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error in crawl session PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceRoleClient();
    const { id } = params;

    const { error } = await supabase
      .from('crawl_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting crawl session:', error);
      return NextResponse.json(
        { error: 'Failed to delete crawl session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Crawl session deleted successfully' });
  } catch (error) {
    console.error('Error in crawl session DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}