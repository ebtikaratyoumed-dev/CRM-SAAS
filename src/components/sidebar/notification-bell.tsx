'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Package, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function getNotifIcon(type: string, entityType: string) {
  if (entityType === 'stock') return <Package className="h-3.5 w-3.5" />;
  if (entityType === 'task') return <ClipboardList className="h-3.5 w-3.5" />;
  if (type === 'success') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (type === 'warning') return <AlertTriangle className="h-3.5 w-3.5" />;
  return <Info className="h-3.5 w-3.5" />;
}

function getNotifColor(type: string) {
  switch (type) {
    case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
    default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
}

function getEntityLabel(entityType: string) {
  switch (entityType) {
    case 'task': return 'Tâche';
    case 'stock': return 'Stock';
    default: return null;
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    let channel: any;
    let active = true;

    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && active) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }

      if (!active) return;

      // Realtime subscription
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!active) return;
            setNotifications(prev => [payload.new, ...prev].slice(0, 15));
            setUnreadCount(c => c + 1);
            toast.info(payload.new.title, {
              description: payload.new.message,
              duration: 5000, // 5 seconds
            });
          }
        )
        .subscribe();
    }

    fetchNotifications();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markOneAsRead = async (notifId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);

    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handleNotifClick = (n: any) => {
    if (!n.read) {
      markOneAsRead(n.id);
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger nativeButton={false} render={
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-zinc-800">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
          )}
        </Button>
      } />
      <PopoverContent className="w-80 p-0 bg-slate-950 border-slate-800 shadow-2xl" align="end">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
           <h3 className="font-bold">Notifications</h3>
           {unreadCount > 0 && (
             <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] text-blue-400 font-bold uppercase hover:bg-blue-500/10">
               Tout lire
             </Button>
           )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
               Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={cn(
                  "p-4 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors relative cursor-pointer",
                  !n.read && "bg-blue-500/5 border-l-2 border-l-blue-500"
                )}
              >
                <div className="flex gap-3">
                   <div className={cn(
                     "mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border",
                     getNotifColor(n.type || 'info')
                   )}>
                     {getNotifIcon(n.type || 'info', n.entity_type || '')}
                   </div>
                   <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold leading-none truncate">{n.title}</p>
                        {n.entity_type && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            {getEntityLabel(n.entity_type)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed truncate">{n.message}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                         {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </p>
                   </div>
                   {!n.read && (
                     <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5 animate-pulse" />
                   )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-slate-800 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-500 text-[10px] uppercase font-bold tracking-widest hover:text-white"
              onClick={() => {
                setOpen(false);
                router.push('/dashboard/notifications');
              }}
            >
                Voir toutes les alertes
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
