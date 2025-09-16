import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/auth/admin';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Validate admin access
    const validation = await validateAdminAccess(request);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const supabase = createServiceRoleClient();
    const { id } = await params;

    // Get user profile
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Admin user GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // Validate admin access
    const validation = await validateAdminAccess(request);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const supabase = createServiceRoleClient();
    const { id } = await params;
    const updates = await request.json();

    // Validate allowed fields
    const allowedFields = ['full_name', 'company_name', 'role', 'email'];
    const updateData: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Prevent admin from removing their own admin role
    if (updateData.role && validation.user?.id === id && updateData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    // Update profile
    const { data: user, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // If email was updated, also update in auth
    if (updateData.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: updateData.email
      });

      if (authError) {
        console.error('Error updating auth email:', authError);
        // Revert profile email change
        await supabase
          .from('profiles')
          .update({ email: user.email })
          .eq('id', id);

        return NextResponse.json(
          { error: 'Failed to update user email' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Admin user PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // Validate admin access
    const validation = await validateAdminAccess(request);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const supabase = createServiceRoleClient();
    const { id } = await params;

    // Prevent admin from deleting themselves
    if (validation.user?.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user to check if they exist
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user from auth (this will cascade to profile via trigger)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Also explicitly delete from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      // Don't return error as auth deletion already happened
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}