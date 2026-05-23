'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  FileSearch, 
  FileUp, 
  Bell, 
  LogOut,
  Menu,
  X,
  Shield,
  CircleDollarSign,
  Package,
  Calculator
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const navItems = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Finance', href: '/dashboard/finance', icon: CircleDollarSign },
  { label: 'Projets', href: '/dashboard/projects', icon: Briefcase },
  { label: 'Stock', href: '/dashboard/stock', icon: Package },
  { label: 'Estimateur', href: '/dashboard/estimator', icon: Calculator, adminOnly: true },
  { label: 'Tâches', href: '/dashboard/tasks', icon: CheckSquare },
  { label: 'Factures reçues', href: '/dashboard/invoices', icon: FileSearch },
  { label: 'Utilisateurs', href: '/dashboard/users', icon: Shield },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

export function Sidebar({ userRole = 'worker' }: { userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = React.useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnexion réussie')
    router.push('/auth/login')
    router.refresh()
  }

  // Admin sees everything; workers & engineers only see Tasks and Notifications
  const workerAllowedHrefs = [
    '/dashboard/tasks',
    '/dashboard/notifications',
  ]

  const filteredNavItems = navItems.filter(item => {
    if (userRole !== 'admin' && !workerAllowedHrefs.includes(item.href)) return false
    if ((item as any).adminOnly && userRole !== 'admin') return false
    return true
  })

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        className="lg:hidden fixed top-4 left-4 z-50 text-white hover:bg-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Branding */}
        <div className="p-6 flex justify-center">
          <Link href="/dashboard" onClick={() => setIsOpen(false)}>
            <Image 
              src="/corex.png" 
              alt="Corex Logo" 
              width={160} 
              height={160} 
              className="object-contain hover:scale-105 transition-transform cursor-pointer"
              priority
            />
          </Link>
        </div>

        <Separator className="bg-zinc-800 mx-6 w-auto" />

        {/* Quick Actions */}
        {userRole === 'admin' && (
          <div className="px-4 py-4">
            <Link href="/dashboard/projects" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-zinc-950 font-bold justify-start space-x-2">
                <Briefcase className="h-4 w-4 shrink-0" />
                <span className="truncate">Gérer les projets</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive 
                    ? "bg-brand-blue/10 text-brand-cyan shadow-[inset_0px_0px_10px_rgba(0,191,255,0.05)] border border-brand-blue/20" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-brand-cyan" : "group-hover:text-white"
                )} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_rgba(0,191,255,0.8)]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 mt-auto">
          <Separator className="bg-zinc-800 mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 px-4 py-6 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
