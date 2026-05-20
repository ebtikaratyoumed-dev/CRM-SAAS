import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, CheckCircle2 } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-brand-cyan">
            Notifications
          </span>
          <div className="h-2 w-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-zinc-400 font-medium tracking-wide">
          Vos alertes et mises à jour en temps réel.
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center">
          <Bell className="h-8 w-8 text-brand-cyan" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Aucune notification</h2>
          <p className="text-zinc-500 text-sm max-w-xs">
            Vous êtes à jour ! Les nouvelles tâches et alertes apparaîtront ici.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600 font-bold uppercase tracking-widest">
          <CheckCircle2 className="h-3 w-3 text-brand-cyan" />
          Tout est à jour
        </div>
      </div>
    </div>
  )
}
