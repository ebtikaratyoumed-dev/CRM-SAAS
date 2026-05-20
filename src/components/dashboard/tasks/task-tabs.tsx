'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { List, Plus } from 'lucide-react';

interface TaskTabsProps {
  isAdmin: boolean;
}

export function TaskTabs({ isAdmin }: TaskTabsProps) {
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
          <List className="h-4 w-4" />
          Liste des Tâches
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="create" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white gap-2 px-6 py-2">
            <Plus className="h-4 w-4" />
            Nouvelle Tâche
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
