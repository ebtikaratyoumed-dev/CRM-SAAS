'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Calculator, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createOutgoingInvoice } from '@/app/dashboard/invoices-outgoing/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const itemSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Le numéro est requis"),
  project_id: z.string().min(1, "Le projet est requis"),
  client_name: z.string().min(1, "Le client est requis"),
  client_address: z.string().optional(),
  client_email: z.string().email().optional(),
  line_items: z.array(itemSchema).min(1, "Au moins un article est requis"),
  tax_percentage: z.coerce.number().min(0).max(100).default(19),
  notes: z.string().optional(),
  due_date: z.string().min(1, "La date est requise"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function OutgoingInvoiceForm({ projects }: { projects: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      invoice_number: `FACT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      line_items: [{ description: '', quantity: 1, unit_price: 0 }],
      tax_percentage: 19,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  const watchItems = form.watch("line_items");
  const watchTax = form.watch("tax_percentage");

  useEffect(() => {
    const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const tax = (subtotal * watchTax) / 100;
    const total = subtotal + tax;
    setTotals({ subtotal, tax, total });
  }, [watchItems, watchTax]);

  async function onSubmit(values: InvoiceFormValues) {
    setLoading(true);
    try {
      await createOutgoingInvoice({
        ...values,
        ...totals,
        tax_amount: totals.tax,
        client_address: values.client_address || '',
        client_email: values.client_email || '',
        notes: values.notes || '',
      });
      toast.success('Facture créée avec succès.');
      router.push('/dashboard/invoices-outgoing');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-slate-900/40 border-slate-800">
             <CardHeader><CardTitle className="text-lg">Informations Générales</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <FormField control={form.control} name="invoice_number" render={({ field }) => (
                  <FormItem><FormLabel>Numéro de Facture</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="project_id" render={({ field }) => (
                  <FormItem><FormLabel>Projet Associé</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger></FormControl>
                      <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="due_date" render={({ field }) => (
                  <FormItem><FormLabel>Date d'échéance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800">
             <CardHeader><CardTitle className="text-lg">Client</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <FormField control={form.control} name="client_name" render={({ field }) => (
                  <FormItem><FormLabel>Nom du Client / Entreprise</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client_address" render={({ field }) => (
                  <FormItem><FormLabel>Adresse de Facturation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client_email" render={({ field }) => (
                  <FormItem><FormLabel>Email (Optionnel)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Détails des Prestations</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter une ligne
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                <div className="col-span-12 md:col-span-6">
                  <FormField control={form.control} name={`line_items.${index}.description`} render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="ex: Travaux de gros oeuvre" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <FormField control={form.control} name={`line_items.${index}.quantity`} render={({ field }) => (
                    <FormItem><FormLabel>Quantité</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-5 md:col-span-3">
                  <FormField control={form.control} name={`line_items.${index}.unit_price`} render={({ field }) => (
                    <FormItem><FormLabel>Prix Unitaire (TND)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-3 md:col-span-1 flex justify-end">
                   <Button type="button" variant="ghost" size="icon" className="text-red-500/50 hover:text-red-500 h-10" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="bg-slate-900/40 border-slate-800">
             <CardHeader><CardTitle className="text-lg">Notes & Taxe</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <FormField control={form.control} name="tax_percentage" render={({ field }) => (
                  <FormItem><FormLabel>TVA (%)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes Additionnelles</FormLabel><FormControl><Textarea placeholder="ex: Modalités de paiement..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </CardContent>
           </Card>

           <Card className="bg-slate-900/40 border-slate-800 flex flex-col justify-between">
             <CardHeader><CardTitle className="text-lg">Résumé Financier</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-800">
                   <span className="text-slate-400">Sous-total</span>
                   <span className="font-semibold">{totals.subtotal.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                   <span className="text-slate-400">TVA ({watchTax}%)</span>
                   <span className="font-semibold">{totals.tax.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between py-4 text-xl font-bold bg-blue-500/5 px-4 rounded-lg border border-blue-500/10">
                   <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TOTAL</span>
                   <span className="text-white">{totals.total.toFixed(3)} TND</span>
                </div>
                <Button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
                  Générer et Enregistrer
                </Button>
             </CardContent>
           </Card>
        </div>
      </form>
    </Form>
  );
}

// Sub-components used
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
