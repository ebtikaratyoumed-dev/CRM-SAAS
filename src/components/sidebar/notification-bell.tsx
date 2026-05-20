'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle } from 'lucide-react';
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }

      // Realtime subscription
      const channel = supabase
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
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(c => c + 1);
            toast.info(payload.new.title, {
              description: payload.new.message,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    fetchNotifications();
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

  return (
    <Popover>
      <PopoverTrigger nativeButton={false} render={
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-zinc-800">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-zinc-950" />
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
              <div key={n.id} className={cn(
                "p-4 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors relative",
                !n.read && "bg-blue-500/5 border-l-2 border-l-blue-500"
              )}>
                <div className="flex gap-3">
                   <div className="mt-1 h-2 w-2 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                      <div className="h-1 w-1 rounded-full bg-blue-500" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-sm font-semibold leading-none">{n.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                         {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </p>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-slate-800 text-center">
            <Button variant="ghost" size="sm" className="w-full text-slate-500 text-[10px] uppercase font-bold tracking-widest hover:text-white">
                Voir toutes les alertes
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
