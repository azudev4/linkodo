import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/auth/admin';

// PATCH /api/admin/raw-pages/:id - Update individual page
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: pageId } = await params;
    const body = await request.json();

    console.log('Updating page:', pageId, 'with data:', body);

    // Update the page's excluded status
    const { data, error } = await supabase
      .from('raw_pages')
      .update({ excluded: body.excluded })
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update page exclusion' },
        { status: 500 }
      );
    }

    console.log('Page updated successfully:', data);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error updating page exclusion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}