import { createClient } from '@/lib/supabase/server';

export async function validateAdminAccess() {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Admin validation - Auth user:', user?.id, 'Error:', userError);

    if (userError || !user) {
      console.log('Admin validation - No user found');
      return {
        success: false,
        error: 'Unauthorized - No user found',
        status: 401
      };
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    console.log('Admin validation - Profile:', profile, 'Error:', profileError);

    if (profileError || !profile) {
      console.log('Admin validation - Profile not found');
      return {
        success: false,
        error: 'Profile not found',
        status: 404
      };
    }

    if (profile.role !== 'admin') {
      console.log('Admin validation - Not admin role:', profile.role);
      return {
        success: false,
        error: 'Forbidden - Admin access required',
        status: 403
      };
    }

    console.log('Admin validation - Success for admin:', profile.email);
    return {
      success: true,
      user,
      profile
    };
  } catch (error) {
    console.error('Admin validation error:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500
    };
  }
}