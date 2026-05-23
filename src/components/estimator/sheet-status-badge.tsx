'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Archive, FileEdit, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { updateEstimationSheet } from '@/app/dashboard/estimator/actions';

type Status = 'Brouillon' | 'Validé' | 'Archivé';

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
  dot: string;
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
  Brouillon: {
    label: 'Brouillon',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    icon: FileEdit,
    dot: 'bg-amber-400',
  },
  Validé: {
    label: 'Validé',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    icon: CheckCircle2,
    dot: 'bg-emerald-400',
  },
  Archivé: {
    label: 'Archivé',
    color: 'text-zinc-500',
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
    icon: Archive,
    dot: 'bg-zinc-500',
  },
};

interface SheetStatusBadgeProps {
  sheetId: string;
  status: Status;
  isAdmin: boolean;
}

export function SheetStatusBadge({ sheetId, status, isAdmin }: SheetStatusBadgeProps) {
  const [current, setCurrent] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();

  const cfg = STATUS_CONFIG[current];
  const Icon = cfg.icon;

  const handleChange = (newStatus: Status) => {
    if (newStatus === current) return;
    startTransition(async () => {
      try {
        await updateEstimationSheet(sheetId, { status: newStatus });
        setCurrent(newStatus);
        toast.success(`Statut mis à jour : ${newStatus}`);
      } catch (err: any) {
        toast.error(err.message ?? 'Erreur lors de la mise à jour du statut');
      }
    });
  };

  if (!isAdmin) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
          cfg.color, cfg.bg, cfg.border
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
        {cfg.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 border font-bold text-xs h-8 px-3 transition-all',
            cfg.color, cfg.bg, cfg.border,
            'hover:opacity-80'
          )}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
          {cfg.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      } />

      <DropdownMenuContent
        align="end"
        className="bg-zinc-900 border-zinc-800 min-w-[150px]"
      >
        {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
          const c = STATUS_CONFIG[s];
          const SIcon = c.icon;
          return (
            <DropdownMenuItem
              key={s}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                s === current
                  ? 'text-white bg-zinc-800'
                  : 'text-zinc-400 focus:bg-zinc-800 focus:text-white'
              )}
              onClick={() => handleChange(s)}
            >
              <SIcon className={cn('h-4 w-4', c.color)} />
              {c.label}
              {s === current && (
                <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-brand-cyan" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
