'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  fetchProjects: (force?: boolean) => Promise<void>;
  fetchTasks: (force?: boolean) => Promise<void>;
  fetchIncomingInvoices: (force?: boolean) => Promise<void>;
  fetchOutgoingInvoices: (force?: boolean) => Promise<void>;
  fetchStockItems: (force?: boolean) => Promise<void>;
  fetchUsers: (force?: boolean) => Promise<void>;
}

const DashboardCacheContext = createContext<DashboardCacheContextType | undefined>(undefined);

export function DashboardCacheProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<any[] | null>(null);
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [incomingInvoices, setIncomingInvoices] = useState<any[] | null>(null);
  const [outgoingInvoices, setOutgoingInvoices] = useState<any[] | null>(null);
  const [stockItems, setStockItems] = useState<any[] | null>(null);
  const [users, setUsers] = useState<any[] | null>(null);
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingIncomingInvoices, setLoadingIncomingInvoices] = useState(false);
  const [loadingOutgoingInvoices, setLoadingOutgoingInvoices] = useState(false);
  const [loadingStockItems, setLoadingStockItems] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const supabase = createClient();

  // Refs for checking current values without triggering hook updates
  const projectsRef = useRef<any[] | null>(null);
  const tasksRef = useRef<any[] | null>(null);
  const incomingInvoicesRef = useRef<any[] | null>(null);
  const outgoingInvoicesRef = useRef<any[] | null>(null);
  const stockItemsRef = useRef<any[] | null>(null);
  const usersRef = useRef<any[] | null>(null);
  const userRef = useRef<any>(null);
  const profileRef = useRef<any>(null);

  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { incomingInvoicesRef.current = incomingInvoices; }, [incomingInvoices]);
  useEffect(() => { outgoingInvoicesRef.current = outgoingInvoices; }, [outgoingInvoices]);
  useEffect(() => { stockItemsRef.current = stockItems; }, [stockItems]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  // Load user profile on mount
  useEffect(() => {
    async function initUser() {
      try {
        setLoadingProfile(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          setUser(null);
          setProfile(null);
          return;
        }
        setUser(currentUser);

        const { data: currentProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('admin_owner_id, role')
          .eq('id', currentUser.id)
          .single();

        if (profileErr) throw profileErr;
        setProfile(currentProfile);
      } catch (err) {
        console.error('Error initializing user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    initUser();
  }, [supabase]);

  // Lazy loaders
  const fetchProjects = useCallback(async (force = false) => {
    if (projectsRef.current !== null && !force) return;
    setLoadingProjects(true);
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('id, name, status, client_name, location, start_date, deadline, estimated_cost, estimated_profit, created_at')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err);
    } finally {
      setLoadingProjects(false);
    }
  }, [supabase]);

  const fetchTasks = useCallback(async (force = false) => {
    if (tasksRef.current !== null && !force) return;
    setLoadingTasks(true);
    try {
      let currentUser = userRef.current;
      let currentProfile = profileRef.current;
      if (!currentUser) {
        const { data } = await supabase.auth.getUser();
        currentUser = data.user;
        if (!currentUser) return;
        setUser(currentUser);
        userRef.current = currentUser;
      }
      if (!currentProfile) {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('admin_owner_id, role')
          .eq('id', currentUser.id)
          .single();
        if (err) throw err;
        currentProfile = data;
        setProfile(currentProfile);
        profileRef.current = currentProfile;
      }

      const isAdmin = currentProfile?.role === 'admin';

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

      const { data, error: err } = await tasksQuery;
      if (err) throw err;
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [supabase]);

  const fetchIncomingInvoices = useCallback(async (force = false) => {
    if (incomingInvoicesRef.current !== null && !force) return;
    setLoadingIncomingInvoices(true);
    try {
      const { data, error: err } = await supabase
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
        .order('invoice_date', { ascending: false });
      if (err) throw err;
      setIncomingInvoices(data);
    } catch (err) {
      console.error('Error fetching incoming invoices:', err);
      setError(err);
    } finally {
      setLoadingIncomingInvoices(false);
    }
  }, [supabase]);

  const fetchOutgoingInvoices = useCallback(async (force = false) => {
    if (outgoingInvoicesRef.current !== null && !force) return;
    setLoadingOutgoingInvoices(true);
    try {
      const { data, error: err } = await supabase
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
        .order('created_at', { ascending: false });
      if (err) throw err;
      setOutgoingInvoices(data);
    } catch (err) {
      console.error('Error fetching outgoing invoices:', err);
      setError(err);
    } finally {
      setLoadingOutgoingInvoices(false);
    }
  }, [supabase]);

  const fetchStockItems = useCallback(async (force = false) => {
    if (stockItemsRef.current !== null && !force) return;
    setLoadingStockItems(true);
    try {
      const { data, error: err } = await supabase
        .from('stock_items')
        .select('id, name, description, quantity, unit, alert_threshold, created_at, project_id, invoice_id, project:projects(id, name), invoice:invoices(invoice_number, vendor_name)')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setStockItems(data);
    } catch (err) {
      console.error('Error fetching stock items:', err);
      setError(err);
    } finally {
      setLoadingStockItems(false);
    }
  }, [supabase]);

  const fetchUsers = useCallback(async (force = false) => {
    if (usersRef.current !== null && !force) return;
    setLoadingUsers(true);
    try {
      let currentUser = userRef.current;
      let currentProfile = profileRef.current;
      if (!currentUser) {
        const { data } = await supabase.auth.getUser();
        currentUser = data.user;
        if (!currentUser) return;
        setUser(currentUser);
        userRef.current = currentUser;
      }
      if (!currentProfile) {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('admin_owner_id, role')
          .eq('id', currentUser.id)
          .single();
        if (err) throw err;
        currentProfile = data;
        setProfile(currentProfile);
        profileRef.current = currentProfile;
      }

      const adminOwnerId = currentProfile?.admin_owner_id ?? currentUser.id;
      const isAdmin = currentProfile?.role === 'admin';

      if (isAdmin) {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('*')
          .eq('admin_owner_id', adminOwnerId)
          .order('created_at', { ascending: false });
        if (err) throw err;
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err);
    } finally {
      setLoadingUsers(false);
    }
  }, [supabase]);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const promises = [];
      if (projectsRef.current !== null) promises.push(fetchProjects(true));
      if (tasksRef.current !== null) promises.push(fetchTasks(true));
      if (incomingInvoicesRef.current !== null) promises.push(fetchIncomingInvoices(true));
      if (outgoingInvoicesRef.current !== null) promises.push(fetchOutgoingInvoices(true));
      if (stockItemsRef.current !== null) promises.push(fetchStockItems(true));
      if (usersRef.current !== null) promises.push(fetchUsers(true));
      
      await Promise.all(promises);
    } catch (err) {
      console.error('Error refreshing active dashboard cache:', err);
      setError(err);
    }
  }, [fetchProjects, fetchTasks, fetchIncomingInvoices, fetchOutgoingInvoices, fetchStockItems, fetchUsers]);

  const loading = loadingProfile || loadingProjects || loadingTasks || loadingIncomingInvoices || loadingOutgoingInvoices || loadingStockItems || loadingUsers;

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
        profile,
        fetchProjects,
        fetchTasks,
        fetchIncomingInvoices,
        fetchOutgoingInvoices,
        fetchStockItems,
        fetchUsers,
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
