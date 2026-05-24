'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTransition, useEffect, useState } from 'react';

export function TaskSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get('search') ?? '');

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [value, searchParams, router]);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
      <input
        type="text"
        placeholder="Chercher une tâche..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-slate-950 border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 border transition-all text-white"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
      )}
    </div>
  );
}
