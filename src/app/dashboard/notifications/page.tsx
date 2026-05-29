'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Package, ClipboardList, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function getNotifIcon(type: string, entityType: string) {
  if (entityType === 'stock') return <Package className="h-4 w-4" />;
  if (entityType === 'task') return <ClipboardList className="h-4 w-4" />;
  if (type === 'success') return <CheckCircle2 className="h-4 w-4" />;
  if (type === 'warning') return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
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
    default: return 'Système';
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const supabase = createClient();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    let channel: any;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('notifications-page')
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
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchNotifications]);

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneAsRead = async (notifId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);

    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
  };

  const handleNotifClick = (n: any) => {
    if (!n.read) markOneAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.entity_type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const taskCount = notifications.filter(n => n.entity_type === 'task').length;
  const stockCount = notifications.filter(n => n.entity_type === 'stock').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-brand-cyan">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs font-black">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </h1>
          <p className="text-zinc-400 font-medium tracking-wide">
            Vos alertes et mises à jour en temps réel.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="gap-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
          <TabsTrigger value="all" className="data-active:bg-slate-800 gap-2">
            <Bell className="h-3.5 w-3.5" />
            Toutes
            <span className="text-[10px] text-slate-500 font-mono">({notifications.length})</span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="data-active:bg-slate-800 gap-2">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            Non lues
            <span className="text-[10px] text-slate-500 font-mono">({unreadCount})</span>
          </TabsTrigger>
          <TabsTrigger value="task" className="data-active:bg-slate-800 gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-cyan-400" />
            Tâches
            <span className="text-[10px] text-slate-500 font-mono">({taskCount})</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-active:bg-slate-800 gap-2">
            <Package className="h-3.5 w-3.5 text-amber-400" />
            Stock
            <span className="text-[10px] text-slate-500 font-mono">({stockCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-900/30 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center">
            <Inbox className="h-8 w-8 text-brand-cyan" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">
              {filter === 'all' ? 'Aucune notification' : filter === 'unread' ? 'Tout est lu !' : `Aucune notification ${getEntityLabel(filter).toLowerCase()}`}
            </h2>
            <p className="text-zinc-500 text-sm max-w-xs">
              {filter === 'unread'
                ? 'Vous êtes à jour. Les nouvelles alertes apparaîtront ici.'
                : 'Les nouvelles tâches et alertes apparaîtront ici.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600 font-bold uppercase tracking-widest">
            <CheckCircle2 className="h-3 w-3 text-brand-cyan" />
            Tout est à jour
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotifClick(n)}
              className={cn(
                "group p-5 rounded-xl border transition-all duration-200 cursor-pointer",
                !n.read
                  ? "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30"
                  : "bg-slate-900/30 border-slate-800 hover:bg-slate-900/50 hover:border-slate-700"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                  getNotifColor(n.type || 'info')
                )}>
                  {getNotifIcon(n.type || 'info', n.entity_type || '')}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white leading-none">{n.title}</p>
                    {n.entity_type && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        n.entity_type === 'task' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                        n.entity_type === 'stock' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        'text-slate-400 bg-slate-500/10 border-slate-500/20'
                      )}>
                        {getEntityLabel(n.entity_type)}
                      </span>
                    )}
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>

                {/* Action hint */}
                {n.link && (
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                    Voir →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
