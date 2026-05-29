import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Briefcase, 
  CheckCircle2, 
  FileText, 
  Users,
  LayoutGrid,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import { ProjectForm } from '@/components/dashboard/projects/project-form'
import { UserForm } from '@/components/dashboard/users/user-form'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { tab?: string }
}) {
  const currentTab = (await searchParams).tab || 'overview'
  const supabase = await createClient()
  const { user, profile } = await getAuthUser()

  if (!user) return null

  const isAdmin = profile?.role === 'admin'

  // Fetch all stats and recent data in parallel
  const [
    projectsCountRes,
    tasksCountRes,
    invoicesCountRes,
    membersCountRes,
    recentProjectsRes,
    recentTasksRes
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'Terminé'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('projects')
      .select('id, name, location, deadline, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('tasks')
      .select('id, title, priority, due_date, status, project:projects(name)')
      .eq('assigned_to', user.id)
      .neq('status', 'Terminé')
      .order('due_date', { ascending: true })
      .limit(4)
  ])

  const projectsCount = projectsCountRes.count
  const tasksCount = tasksCountRes.count
  const invoicesCount = invoicesCountRes.count
  const membersCount = membersCountRes.count
  const recentProjects = (recentProjectsRes.data || []).map((p: any) => ({
    ...p,
    end_date: p.deadline
  }))
  const recentTasks = recentTasksRes.data as any[] | null

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-white flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-brand-cyan">
             {isAdmin ? 'Tableau de Bord Admin' : 'Mon Espace'}
          </span>
          <div className="ml-4 h-2 w-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </h1>
        <p className="text-zinc-400 font-medium tracking-wide">
          Bienvenue, <span className="text-zinc-200 font-bold">{profile?.full_name}</span>. Voici l'état de vos chantiers aujourd'hui.
        </p>
      </div>

      {isAdmin && <DashboardTabs isAdmin={isAdmin} />}

      {currentTab === 'overview' ? (
        <>
          {/* ADMIN: Full stats grid */}
          {isAdmin ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Projets Actifs" 
                  value={projectsCount || 0} 
                  icon={Briefcase} 
                  trend="Total des chantiers"
                  color="text-brand-blue"
                  bg="bg-brand-blue/10"
                />
                <StatCard 
                  title="Tâches en Cours" 
                  value={tasksCount || 0} 
                  icon={CheckCircle2} 
                  trend="Interventions à finir"
                  color="text-brand-cyan"
                  bg="bg-brand-cyan/10"
                />
                <StatCard 
                  title="Factures Scannées" 
                  value={invoicesCount || 0} 
                  icon={FileText} 
                  trend="Documents fournisseurs"
                  color="text-brand-purple"
                  bg="bg-brand-purple/10"
                />
                <StatCard 
                  title="Membres Équipe" 
                  value={membersCount || 0} 
                  icon={Users} 
                  trend="Professionnels actifs"
                  color="text-brand-magenta"
                  bg="bg-brand-magenta/10"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Projects */}
                <div className="lg:col-span-2 space-y-6">
                  <SectionHeader title="Derniers Projets" action="Voir tout" link="/dashboard/projects" />
                  <div className="grid grid-cols-1 gap-4">
                    {recentProjects?.map((project) => (
                      <div key={project.id} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-brand-blue/40 transition-all duration-300 group cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-bold text-white group-hover:text-brand-cyan transition-colors">{project.name}</h3>
                            <p className="text-sm text-zinc-500">{project.location || 'Tunis'} — Deadline: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <Badge variant="outline" className="bg-brand-blue/10 text-brand-cyan text-[10px] font-black uppercase tracking-widest border border-brand-blue/20">
                            {project.status || 'En Cours'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(!recentProjects || recentProjects.length === 0) && (
                      <div className="p-8 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-500">
                        Aucun projet actif pour le moment.
                      </div>
                    )}
                  </div>
                </div>

                {/* My Tasks (admin) */}
                <div className="space-y-6">
                  <SectionHeader title="Mes Tâches" action="Voir tout" link="/dashboard/tasks" />
                  <TaskList tasks={recentTasks} />
                </div>
              </div>
            </>
          ) : (
            /* WORKER / ENGINEER: Tasks only */
            <div className="space-y-8">
              {/* Tasks stat card only */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md">
                <StatCard 
                  title="Tâches en Cours" 
                  value={tasksCount || 0} 
                  icon={CheckCircle2} 
                  trend="Interventions à finir"
                  color="text-brand-cyan"
                  bg="bg-brand-cyan/10"
                />
              </div>

              {/* Tasks list */}
              <div className="space-y-6 max-w-2xl">
                <SectionHeader title="Mes Tâches" action="Voir tout" link="/dashboard/tasks" />
                <TaskList tasks={recentTasks} />
              </div>
            </div>
          )}
        </>
      ) : currentTab === 'create-project' ? (
        <Card className="max-w-2xl mx-auto bg-zinc-900/40 border-zinc-800 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-white italic lowercase tracking-tighter">Nouveau Projet</CardTitle>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Initialisation de chantier</p>
          </CardHeader>
          <CardContent>
            <ProjectForm />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-xl mx-auto bg-zinc-900/40 border-zinc-800 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-white italic lowercase tracking-tighter">Nouvel Utilisateur</CardTitle>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Création de compte ouvrier</p>
          </CardHeader>
          <CardContent>
            <UserForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color, bg }: any) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-800/40 transition-all duration-500 group overflow-hidden relative">
      <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4", color)}>
        <Icon className="h-24 w-24" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white mb-1 tracking-tighter">{value}</div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{trend}</p>
      </CardContent>
    </Card>
  )
}

function SectionHeader({ title, action, link }: { title: string, action: string, link: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-black tracking-tight text-white uppercase italic flex items-center gap-2">
        <div className="h-1 w-4 bg-brand-cyan rounded-full" />
        {title}
      </h2>
      <Link href={link} className="text-[10px] font-black text-brand-cyan hover:text-white transition-all uppercase tracking-widest flex items-center group">
        {action} 
        <ArrowRight className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

function TaskList({ tasks }: { tasks: any[] | null }) {
  return (
    <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-6 space-y-6">
      {tasks?.map((task) => (
        <div key={task.id} className="flex items-start space-x-4 group">
          <div className={cn(
            "h-2 w-2 mt-2 rounded-full shrink-0 animate-pulse",
            task.priority === 'haute' ? 'bg-red-500' : 'bg-brand-cyan'
          )} />
          <div className="space-y-1">
            <p className="font-bold text-sm text-white group-hover:text-brand-cyan transition-colors">{task.title}</p>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-3 w-3 text-zinc-600" />
              <p className="text-[11px] text-zinc-500">{task.project?.name}</p>
            </div>
          </div>
        </div>
      ))}
      {(!tasks || tasks.length === 0) && (
        <div className="py-4 text-center text-zinc-600 text-sm">
          Toutes vos tâches sont terminées !
        </div>
      )}
    </div>
  )
}

