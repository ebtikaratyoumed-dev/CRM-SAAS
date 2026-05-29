import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { user: null, profile: null }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, admin_owner_id')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error("getAuthUser profile fetch error:", profileError)
  }

  return { user, profile }
})
