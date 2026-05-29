import { Sidebar } from '@/components/sidebar/sidebar'
import { getAuthUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await getAuthUser()
  const userRole = profile?.role || 'worker'

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-blue selection:text-white">
      <Sidebar userRole={userRole} />
      <main className="flex-1 lg:ml-64 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {children}
        </div>
      </main>
    </div>
  )
}
