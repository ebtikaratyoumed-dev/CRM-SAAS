'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Plus } from 'lucide-react';

interface ProjectTabsProps {
  isAdmin: boolean;
}

export function ProjectTabs({ isAdmin }: ProjectTabsProps) {
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
        <TabsTrigger value="list" className="data-active:bg-blue-600 data-active:text-white gap-2 px-6 py-2">
          <LayoutGrid className="h-4 w-4" />
          Liste des Projets
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="create" className="data-active:bg-purple-600 data-active:text-white gap-2 px-6 py-2">
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
