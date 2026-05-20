import { Sidebar } from '@/components/sidebar/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error("DashboardLayout user fetch error:", userError)
  }

  let userRole = 'worker'
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (error) {
      console.error("DashboardLayout profile fetch error:", error)
    } else {
      console.log("DashboardLayout fetched profile:", profile)
      userRole = profile?.role || 'worker'
    }
  } else {
    console.warn("DashboardLayout: No user found in session")
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-blue selection:text-white">
      <Sidebar userRole={userRole} />
      <main className="flex-1 lg:ml-64 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {children}
        </div>
      </main>
      <Toaster theme="dark" closeButton richColors />
    </div>
  )
}
