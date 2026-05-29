'use server';

import { createClient } from '@/lib/supabase/server';

export async function getCompanyFinancials() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Fetch all data in parallel
  const [projectsRes, outgoingInvoicesRes, incomingInvoicesRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, estimated_cost, estimated_profit'),
    supabase
      .from('invoices_outgoing')
      .select('id, total, tax_amount, project_id')
      .eq('status', 'Payée'),
    supabase
      .from('invoices')
      .select('id, total_amount, tax, project_id')
  ]);

  if (projectsRes.error) throw new Error('Erreur lors de la récupération des projets');
  if (outgoingInvoicesRes.error) throw new Error('Erreur lors de la récupération des factures clients');
  if (incomingInvoicesRes.error) throw new Error('Erreur lors de la récupération des factures fournisseurs');

  const projects = projectsRes.data;
  const outgoingInvoices = outgoingInvoicesRes.data;
  const incomingInvoices = incomingInvoicesRes.data;

  // Calculate totals
  let totalEstimatedCost = 0;
  let totalEstimatedProfit = 0;

  projects.forEach((p) => {
    totalEstimatedCost += Number(p.estimated_cost || 0);
    totalEstimatedProfit += Number(p.estimated_profit || 0);
  });

  let totalActualRevenue = 0;
  let totalTvaCollected = 0;
  outgoingInvoices.forEach((inv) => {
    totalActualRevenue += Number(inv.total || 0);
    totalTvaCollected += Number(inv.tax_amount || 0);
  });

  let totalActualSpend = 0;
  let totalTvaPaid = 0;
  incomingInvoices.forEach((inv) => {
    totalActualSpend += Number(inv.total_amount || 0);
    totalTvaPaid += Number(inv.tax || 0);
  });

  const totalActualProfit = totalActualRevenue - totalActualSpend;
  const netTva = totalTvaCollected - totalTvaPaid;

  // Best projects calculation
  let bestEstimatedProject = null;
  let highestEstimatedProfit = -Infinity;

  let bestActualProject = null;
  let highestActualProfit = -Infinity;

  const projectActuals = new Map<string, { revenue: number; spend: number; name: string; tvaCollected: number; tvaPaid: number }>();
  
  projects.forEach((p) => {
    projectActuals.set(p.id, { revenue: 0, spend: 0, name: p.name, tvaCollected: 0, tvaPaid: 0 });
    if (Number(p.estimated_profit || 0) > highestEstimatedProfit) {
      highestEstimatedProfit = Number(p.estimated_profit || 0);
      bestEstimatedProject = p;
    }
  });

  outgoingInvoices.forEach((inv) => {
    if (inv.project_id) {
      const actual = projectActuals.get(inv.project_id);
      if (actual) {
        actual.revenue += Number(inv.total || 0);
        actual.tvaCollected += Number(inv.tax_amount || 0);
      }
    }
  });

  incomingInvoices.forEach((inv) => {
    if (inv.project_id) {
      const actual = projectActuals.get(inv.project_id);
      if (actual) {
        actual.spend += Number(inv.total_amount || 0);
        actual.tvaPaid += Number(inv.tax || 0);
      }
    }
  });

  for (const [id, data] of projectActuals.entries()) {
    const actualProfit = data.revenue - data.spend;
    if (actualProfit > highestActualProfit) {
      highestActualProfit = actualProfit;
      bestActualProject = { id, name: data.name, actualProfit };
    }
  }

  return {
    totalEstimatedCost,
    totalEstimatedProfit,
    totalActualRevenue,
    totalActualSpend,
    totalActualProfit,
    totalTvaCollected,
    totalTvaPaid,
    netTva,
    bestEstimatedProject,
    bestActualProject,
    projectDetails: projects.map(p => {
      const actual = projectActuals.get(p.id);
      return {
        ...p,
        actualRevenue: actual?.revenue || 0,
        actualSpend: actual?.spend || 0,
        actualProfit: (actual?.revenue || 0) - (actual?.spend || 0),
        tvaCollected: actual?.tvaCollected || 0,
        tvaPaid: actual?.tvaPaid || 0,
        netTva: (actual?.tvaCollected || 0) - (actual?.tvaPaid || 0)
      };
    })
  };
}

export async function getProjectFinancials(projectId: string) {
  const supabase = await createClient();

  const [projectRes, outgoingRes, incomingRes] = await Promise.all([
    supabase
      .from('projects')
      .select('estimated_cost, estimated_profit')
      .eq('id', projectId)
      .single(),
    supabase
      .from('invoices_outgoing')
      .select('total, tax_amount')
      .eq('project_id', projectId)
      .eq('status', 'Payée'),
    supabase
      .from('invoices')
      .select('total_amount, tax')
      .eq('project_id', projectId)
  ]);

  if (projectRes.error) throw new Error('Erreur lors de la récupération du projet');

  const project = projectRes.data;
  const outgoing = outgoingRes.data;
  const incoming = incomingRes.data;

  let actualRevenue = 0;
  let tvaCollected = 0;
  outgoing?.forEach(i => {
    actualRevenue += Number(i.total || 0);
    tvaCollected += Number(i.tax_amount || 0);
  });

  let actualSpend = 0;
  let tvaPaid = 0;
  incoming?.forEach(i => {
    actualSpend += Number(i.total_amount || 0);
    tvaPaid += Number(i.tax || 0);
  });

  return {
    estimatedCost: Number(project.estimated_cost || 0),
    estimatedProfit: Number(project.estimated_profit || 0),
    actualRevenue,
    actualSpend,
    actualProfit: actualRevenue - actualSpend,
    tvaCollected,
    tvaPaid,
    netTva: tvaCollected - tvaPaid,
  };
}
