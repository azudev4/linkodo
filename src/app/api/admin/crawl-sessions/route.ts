import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const client = searchParams.get('client');

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (client) {
      query = query.eq('client', client);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching crawl sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch crawl sessions' },
        { status: 500 }
      );
    }

    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const { data: pageStats } = await supabase
          .from('raw_pages')
          .select('id, status_code')
          .eq('session_id', session.id);

        const totalPages = pageStats?.length || 0;
        const successfulPages = pageStats?.filter(p => p.status_code === 200)?.length || 0;

        const { data: processedPages } = await supabase
          .from('pages')
          .select('id')
          .eq('session_id', session.id);

        const includedPages = processedPages?.length || 0;

        return {
          ...session,
          total_pages: totalPages,
          included_pages: includedPages,
          excluded_pages: totalPages - includedPages,
          success_rate: totalPages > 0 ? Math.round((successfulPages / totalPages) * 100) : 0
        };
      })
    );

    return NextResponse.json(sessionsWithStats);
  } catch (error) {
    console.error('Error in crawl sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const { domain, client } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const sessionData = {
      domain,
      client,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: session, error } = await supabase
      .from('crawl_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating crawl session:', error);
      return NextResponse.json(
        { error: 'Failed to create crawl session' },
        { status: 500 }
      );
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error in crawl sessions POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}