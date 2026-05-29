'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Plus, UserPlus } from 'lucide-react';

interface DashboardTabsProps {
  isAdmin: boolean;
}

export function DashboardTabs({ isAdmin }: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-8">
        <TabsTrigger value="overview" className="data-active:bg-blue-600 data-active:text-white gap-2 px-6 py-2">
          <LayoutDashboard className="h-4 w-4" />
          Vue d'ensemble
        </TabsTrigger>
        {isAdmin && (
          <>
            <TabsTrigger value="create-project" className="data-active:bg-purple-600 data-active:text-white gap-2 px-6 py-2">
              <Plus className="h-4 w-4" />
              Nouveau Projet
            </TabsTrigger>
            <TabsTrigger value="create-user" className="data-active:bg-emerald-600 data-active:text-white gap-2 px-6 py-2">
              <UserPlus className="h-4 w-4" />
              Nouvel Utilisateur
            </TabsTrigger>
          </>
        )}
      </TabsList>
    </Tabs>
  );
}
