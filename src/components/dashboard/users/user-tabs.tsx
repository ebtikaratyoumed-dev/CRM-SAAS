'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus } from 'lucide-react';

export function UserTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'list';

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-8">
        <TabsTrigger value="list" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2 px-6 py-2">
          <Users className="h-4 w-4" />
          Liste des Utilisateurs
        </TabsTrigger>
        <TabsTrigger value="create" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-2 px-6 py-2">
          <UserPlus className="h-4 w-4" />
          Créer un Compte
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
