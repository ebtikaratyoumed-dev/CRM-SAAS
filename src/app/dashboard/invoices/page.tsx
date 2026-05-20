import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink,
  MoreVertical,
  Download
} from 'lucide-react';
import { OutgoingInvoiceActions } from '@/components/dashboard/invoices/outgoing-invoice-actions';
import { IncomingInvoiceActions } from '@/components/dashboard/invoices/incoming-invoice-actions';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export default async function InvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 1. Fetch Incoming Invoices (Fournisseurs)
  const { data: incomingInvoices } = await supabase
    .from('invoices')
    .select(`
      *,
      project:projects(name),
      stock_items(id)
    `)
    .order('invoice_date', { ascending: false });

  // 2. Fetch Outgoing Invoices (Clients)
  const { data: outgoingInvoices } = await supabase
    .from('invoices_outgoing')
    .select(`
      *,
      project:projects(name)
    `)
    .order('created_at', { ascending: false });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestion des Factures
          </h1>
          <p className="text-slate-400 mt-1">
            Centralisez vos flux financiers entrants et sortants.
          </p>
        </div>

        <div className="flex gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" nativeButton={false} render={<Link href="/dashboard/invoices/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Saisie Fournisseur
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" nativeButton={false} render={<Link href="/dashboard/invoices-outgoing/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Facture Client
          </Button>
        </div>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6">
          <TabsTrigger value="incoming" className="data-[state=active]:bg-slate-800 flex gap-2">
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            Factures Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="data-[state=active]:bg-slate-800 flex gap-2">
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
            Factures Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-0 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-slate-800">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingInvoices?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      Aucune facture fournisseur trouvée. Commencez par en saisir une.
                    </TableCell>
                  </TableRow>
                )}
                {incomingInvoices?.map((invoice) => (
                  <TableRow key={invoice.id} className="border-slate-800 hover:bg-slate-900/40 transition-colors">
                    <TableCell className="font-medium text-slate-200">{invoice.invoice_number}</TableCell>
                    <TableCell className="text-slate-300 font-semibold">{invoice.vendor_name}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{invoice.project?.name || 'Non assigné'}</TableCell>
                    <TableCell className="text-slate-400">
                      {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      {invoice.stock_items && invoice.stock_items.length > 0 ? (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                          {invoice.stock_items.length} article(s)
                        </Badge>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 capitalize">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {invoice.file_url ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" title="Voir le document original" nativeButton={false} render={<a href={invoice.file_url} target="_blank" rel="noopener noreferrer" />}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-400" title="Télécharger PDF" nativeButton={false} render={<a href={`/api/invoice-incoming-pdf/${invoice.id}`} download />}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <IncomingInvoiceActions invoiceId={invoice.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="outgoing" className="mt-0 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-slate-800">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Date Création</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outgoingInvoices?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Aucune facture client trouvée.
                    </TableCell>
                  </TableRow>
                )}
                {outgoingInvoices?.map((invoice) => (
                  <TableRow key={invoice.id} className="border-slate-800 hover:bg-slate-900/40 transition-colors">
                    <TableCell className="font-medium text-slate-200">{invoice.invoice_number}</TableCell>
                    <TableCell className="text-slate-300 font-semibold">{invoice.client_name}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{invoice.project?.name}</TableCell>
                    <TableCell className="text-slate-400">
                      {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-400">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 capitalize">
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-400" title="Télécharger PDF" nativeButton={false} render={<a href={`/api/invoice-pdf/${invoice.id}`} download />}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <OutgoingInvoiceActions invoice={{ id: invoice.id, invoice_number: invoice.invoice_number, status: invoice.status }} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
