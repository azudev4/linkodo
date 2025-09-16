import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/auth/admin';

// GET /api/admin/raw-pages?session_id=X - Get pages by session
export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const validation = await validateAdminAccess();
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    console.log('GET /api/admin/raw-pages - session_id:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }

    const { data: rawPages, error } = await supabase
      .from('raw_pages')
      .select('*')
      .eq('session_id', sessionId)
      .order('crawled_at', { ascending: false });

    if (error) {
      console.error('Error fetching raw pages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch raw pages', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${rawPages?.length || 0} raw pages for session ${sessionId}`);
    return NextResponse.json(rawPages || []);
  } catch (error) {
    console.error('Error in raw pages API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/raw-pages - Bulk update pages
export async function PATCH(request: NextRequest) {
  try {
    // Validate admin access
    const validation = await validateAdminAccess();
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const supabase = createServiceRoleClient();
    const body = await request.json();

    // Extract page updates from request body
    const { pageUpdates } = body;
    if (!Array.isArray(pageUpdates)) {
      return NextResponse.json(
        { error: 'pageUpdates must be an array' },
        { status: 400 }
      );
    }

    console.log(`Bulk updating ${pageUpdates.length} pages`);

    // Update each page's excluded status in the database
    const updatePromises = pageUpdates.map(async (update: { id: string; excluded: boolean }) => {
      const { error } = await supabase
        .from('raw_pages')
        .update({ excluded: update.excluded })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating page ${update.id}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    console.log(`Successfully bulk updated ${pageUpdates.length} pages`);

    return NextResponse.json({
      success: true,
      message: `Updated ${pageUpdates.length} pages successfully`,
      updatedCount: pageUpdates.length
    });

  } catch (error) {
    console.error('Error in bulk page update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}