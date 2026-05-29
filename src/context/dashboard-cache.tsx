'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DashboardCacheContextType {
  projects: any[] | null;
  tasks: any[] | null;
  incomingInvoices: any[] | null;
  outgoingInvoices: any[] | null;
  stockItems: any[] | null;
  users: any[] | null;
  loading: boolean;
  error: any;
  refreshData: () => Promise<void>;
  user: any;
  profile: any;
}

const DashboardCacheContext = createContext<DashboardCacheContextType | undefined>(undefined);

export function DashboardCacheProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<any[] | null>(null);
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [incomingInvoices, setIncomingInvoices] = useState<any[] | null>(null);
  const [outgoingInvoices, setOutgoingInvoices] = useState<any[] | null>(null);
  const [stockItems, setStockItems] = useState<any[] | null>(null);
  const [users, setUsers] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const supabase = createClient();

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Get profile
      const { data: currentProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('admin_owner_id, role')
        .eq('id', currentUser.id)
        .single();

      if (profileErr) throw profileErr;
      setProfile(currentProfile);

      const adminOwnerId = currentProfile?.admin_owner_id ?? currentUser.id;
      const isAdmin = currentProfile?.role === 'admin';

      // Build tasks query base
      let tasksQuery = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          priority,
          due_date,
          status,
          assigned_to,
          project:projects(name),
          assignee:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .order('due_date', { ascending: true });

      if (!isAdmin) {
        tasksQuery = tasksQuery.eq('assigned_to', currentUser.id);
      }

      // Fetch other data in parallel
      const [
        projectsRes,
        tasksRes,
        incomingRes,
        outgoingRes,
        stockRes,
        usersRes
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, status, client_name, location, start_date, deadline, created_at')
          .order('created_at', { ascending: false }),
        tasksQuery,
        supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            vendor_name,
            project_id,
            invoice_date,
            total_amount,
            status,
            file_url,
            project:projects(name),
            stock_items(id)
          `)
          .order('invoice_date', { ascending: false }),
        supabase
          .from('invoices_outgoing')
          .select(`
            id,
            invoice_number,
            client_name,
            project_id,
            created_at,
            total,
            status,
            project:projects(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('stock_items')
          .select('id, name, description, quantity, unit, created_at, project_id, invoice_id, project:projects(id, name), invoice:invoices(invoice_number, vendor_name)')
          .order('created_at', { ascending: false }),
        isAdmin 
          ? supabase
              .from('profiles')
              .select('*')
              .eq('admin_owner_id', adminOwnerId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: null, error: null })
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (incomingRes.error) throw incomingRes.error;
      if (outgoingRes.error) throw outgoingRes.error;
      if (stockRes.error) throw stockRes.error;
      if (usersRes.error) throw usersRes.error;

      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setIncomingInvoices(incomingRes.data);
      setOutgoingInvoices(outgoingRes.data);
      setStockItems(stockRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      console.error('Error refreshing dashboard cache:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <DashboardCacheContext.Provider
      value={{
        projects,
        tasks,
        incomingInvoices,
        outgoingInvoices,
        stockItems,
        users,
        loading,
        error,
        refreshData,
        user,
        profile
      }}
    >
      {children}
    </DashboardCacheContext.Provider>
  );
}

export function useDashboardCache() {
  const context = useContext(DashboardCacheContext);
  if (context === undefined) {
    throw new Error('useDashboardCache must be used within a DashboardCacheProvider');
  }
  return context;
}
