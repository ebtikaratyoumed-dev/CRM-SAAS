'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';

/**
 * Diagnostic action: compares what an admin sees (via RLS) vs what exists (via service role).
 * This helps identify projects hidden by RLS policies due to NULL created_by.
 */
export async function diagnoseProjects() {
  const supabase = await createClient();
  const { user, profile } = await getAuthUser();

  if (!user || profile?.role !== 'admin') {
    return { error: 'Not authenticated or not admin' };
  }

  // What the user sees through RLS
  const { data: visibleProjects, error: rlsError } = await supabase
    .from('projects')
    .select('id, name, created_by');

  // What actually exists (bypass RLS via service role)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return {
      error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
      visibleCount: visibleProjects?.length ?? 0,
      rlsError: rlsError?.message,
    };
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: allProjects, error: adminError } = await adminSupabase
    .from('projects')
    .select('id, name, created_by');

  const nullCreatedBy = allProjects?.filter(p => !p.created_by) ?? [];
  const withCreatedBy = allProjects?.filter(p => p.created_by) ?? [];

  return {
    currentUserId: user.id,
    currentAdminOwnerId: profile?.admin_owner_id,
    visibleViaRLS: visibleProjects?.length ?? 0,
    totalInDatabase: allProjects?.length ?? 0,
    projectsWithNullCreatedBy: nullCreatedBy.length,
    projectsWithCreatedBy: withCreatedBy.length,
    nullProjects: nullCreatedBy.map(p => ({ id: p.id, name: p.name })),
    rlsError: rlsError?.message ?? null,
    adminError: adminError?.message ?? null,
  };
}

/**
 * Fix action: backfills created_by for all projects that have NULL created_by.
 * Sets them to the current admin user's ID so they become visible through RLS.
 */
export async function fixProjectsCreatedBy() {
  const supabase = await createClient();
  const { user, profile } = await getAuthUser();

  if (!user || profile?.role !== 'admin') {
    return { error: 'Not authenticated or not admin' };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' };
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Backfill: set created_by = current admin for all projects where it's NULL
  const { data, error } = await adminSupabase
    .from('projects')
    .update({ created_by: user.id })
    .is('created_by', null)
    .select('id, name');

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    fixedCount: data?.length ?? 0,
    fixedProjects: data?.map(p => ({ id: p.id, name: p.name })) ?? [],
  };
}
