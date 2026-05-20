'use server';

import { createClient } from '@/lib/supabase/server';

export async function getCompanyFinancials() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Fetch all projects for estimated profitability
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, estimated_cost, estimated_profit');

  if (projectsError) throw new Error('Erreur lors de la récupération des projets');

  // Fetch all outgoing invoices (client payments / revenue)
  const { data: outgoingInvoices, error: outgoingError } = await supabase
    .from('invoices_outgoing')
    .select('id, total, tax_amount, project_id')
    .eq('status', 'Payée'); // Only count invoices marked "payé" (status = 'Payée') and not "sent" or draft.

  if (outgoingError) throw new Error('Erreur lors de la récupération des factures clients');

  // Fetch all incoming invoices (supplier payments / spends)
  const { data: incomingInvoices, error: incomingError } = await supabase
    .from('invoices')
    .select('id, total_amount, tax, project_id');

  if (incomingError) throw new Error('Erreur lors de la récupération des factures fournisseurs');

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

  const projectActuals: Record<string, { revenue: number; spend: number; name: string; tvaCollected: number; tvaPaid: number }> = {};
  
  projects.forEach((p) => {
    projectActuals[p.id] = { revenue: 0, spend: 0, name: p.name, tvaCollected: 0, tvaPaid: 0 };
    if (Number(p.estimated_profit || 0) > highestEstimatedProfit) {
      highestEstimatedProfit = Number(p.estimated_profit || 0);
      bestEstimatedProject = p;
    }
  });

  outgoingInvoices.forEach((inv) => {
    if (inv.project_id && projectActuals[inv.project_id]) {
      projectActuals[inv.project_id].revenue += Number(inv.total || 0);
      projectActuals[inv.project_id].tvaCollected += Number(inv.tax_amount || 0);
    }
  });

  incomingInvoices.forEach((inv) => {
    if (inv.project_id && projectActuals[inv.project_id]) {
      projectActuals[inv.project_id].spend += Number(inv.total_amount || 0);
      projectActuals[inv.project_id].tvaPaid += Number(inv.tax || 0);
    }
  });

  Object.entries(projectActuals).forEach(([id, data]) => {
    const actualProfit = data.revenue - data.spend;
    if (actualProfit > highestActualProfit) {
      highestActualProfit = actualProfit;
      bestActualProject = { id, name: data.name, actualProfit };
    }
  });

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
    projectDetails: projects.map(p => ({
      ...p,
      actualRevenue: projectActuals[p.id]?.revenue || 0,
      actualSpend: projectActuals[p.id]?.spend || 0,
      actualProfit: (projectActuals[p.id]?.revenue || 0) - (projectActuals[p.id]?.spend || 0),
      tvaCollected: projectActuals[p.id]?.tvaCollected || 0,
      tvaPaid: projectActuals[p.id]?.tvaPaid || 0,
      netTva: (projectActuals[p.id]?.tvaCollected || 0) - (projectActuals[p.id]?.tvaPaid || 0)
    }))
  };
}

export async function getProjectFinancials(projectId: string) {
  const supabase = await createClient();

  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('estimated_cost, estimated_profit')
    .eq('id', projectId)
    .single();

  if (pError) throw new Error('Erreur lors de la récupération du projet');

  const { data: outgoing } = await supabase
    .from('invoices_outgoing')
    .select('total, tax_amount')
    .eq('project_id', projectId)
    .eq('status', 'Payée');

  const { data: incoming } = await supabase
    .from('invoices')
    .select('total_amount, tax')
    .eq('project_id', projectId);

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
