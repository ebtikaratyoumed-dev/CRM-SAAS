'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Scan, CheckCircle2, AlertCircle, Loader2, Save, X, LayoutGrid } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { saveScannedInvoice } from '@/app/dashboard/invoices/actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScannedItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ScannedInvoiceData {
  vendor_name: string;
  invoice_number: string;
  date: string;
  total_amount: number;
  tax_amount: number;
  line_items: ScannedItem[];
}

export default function InvoiceScanClient({ projects }: { projects: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedInvoiceData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setScannedData(null);
      setProgress(0);
    }
  };

  const startScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setProgress(10);
    
    try {
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/scan-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileType: file.type,
          }),
        });

        clearInterval(timer);
        setProgress(100);

        if (!response.ok) throw new Error('Échec du scan');
        
        const data = await response.json();
        setScannedData(data);
        toast.success('Facture scannée avec succès !');
      };
    } catch (error) {
      toast.error('Erreur lors du scan de la facture.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!scannedData || !file) return;
    if (!selectedProjectId) {
      toast.warning('Veuillez sélectionner un projet.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage Error:', uploadError);
        // Fallback or handle bucket missing
        if (uploadError.message.includes('bucket not found')) {
            throw new Error('Le bucket "invoices" n\'existe pas dans Supabase Storage.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // 2. Save to database
      await saveScannedInvoice({
        vendor_name: scannedData.vendor_name,
        invoice_number: scannedData.invoice_number,
        invoice_date: scannedData.date,
        total_amount: scannedData.total_amount,
        tax: scannedData.tax_amount,
        line_items: scannedData.line_items,
        project_id: selectedProjectId,
        file_url: publicUrl,
      });

      toast.success('Facture enregistrée.');
      router.push('/dashboard/invoices');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Scan de Facture IA
          </h1>
          <p className="text-slate-400 mt-1">
            Utilisez l'IA pour extraire automatiquement les données de vos factures fournisseurs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="bg-slate-900/40 border-slate-800 border-dashed border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Déposez votre facture ici</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-[200px]">
                Supporte les formats JPG, PNG et PDF.
              </p>
              
              <Input
                type="file"
                className="hidden"
                id="invoice-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
              />
              
              <Button 
                onClick={triggerFileInput}
                variant="outline" 
                className="cursor-pointer bg-slate-950 border-slate-800 hover:bg-slate-900"
              >
                Choisir un fichier
              </Button>

              {file && (
                <div className="mt-6 flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 w-full max-w-md mx-auto">
                  <FileText className="h-5 w-5 text-blue-400 shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); setScannedData(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {file && !scannedData && !isScanning && (
                <Button 
                  onClick={startScan}
                  className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20"
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Scanner avec l'IA
                </Button>
              )}

              {isScanning && (
                <div className="mt-6 w-full space-y-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400 font-medium">Analyse en cours...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1 bg-slate-800" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results & Validation Section */}
        <div className="space-y-6">
          {scannedData ? (
            <Card className="bg-slate-900/40 border-slate-800 animate-in slide-in-from-right duration-500">
              <CardHeader className="border-b border-slate-800/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Validation des Données
                  </CardTitle>
                </div>
                <CardDescription>Veuillez vérifier les informations et sélectionner un projet.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Project Selector */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3" /> Projet Associé
                  </Label>
                  <Select onValueChange={(val) => setSelectedProjectId(val || '')} value={selectedProjectId}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Sélectionner un projet..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800">
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/40">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">Fournisseur</Label>
                    <Input 
                      value={scannedData.vendor_name} 
                      onChange={(e) => setScannedData({...scannedData, vendor_name: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">N° Facture</Label>
                    <Input 
                      value={scannedData.invoice_number} 
                      onChange={(e) => setScannedData({...scannedData, invoice_number: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-sm h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">Date</Label>
                    <Input 
                      type="date"
                      value={scannedData.date} 
                      onChange={(e) => setScannedData({...scannedData, date: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-slate-500">Montant (TND)</Label>
                    <Input 
                      type="number"
                      step="0.001"
                      value={scannedData.total_amount} 
                      onChange={(e) => setScannedData({...scannedData, total_amount: parseFloat(e.target.value)})}
                      className="bg-slate-950 border-slate-800 text-sm h-9 font-bold text-blue-400"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 block">
                    Articles ({scannedData.line_items?.length || 0})
                  </Label>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                    {scannedData.line_items?.map((item: ScannedItem, i: number) => (
                      <div key={i} className="text-[11px] bg-slate-950/50 p-2 rounded border border-slate-800/60 flex justify-between gap-2">
                        <span className="truncate flex-1 text-slate-300">{item.description}</span>
                        <span className="font-bold text-zinc-400 shrink-0">{item.total_price.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                    <Button 
                    disabled={isSaving} 
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20 py-6"
                    >
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Confirmer et Enregistrer
                    </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col justify-center">
                <Alert className="bg-slate-900/60 border-slate-800 text-slate-400 border-dashed py-8">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg">Prêt pour l'analyse</AlertTitle>
                <AlertDescription className="mt-2">
                    Une fois votre facture téléchargée, nous utiliserons notre moteur d'IA pour extraire les montants, les dates et les détails des articles automatiquement.
                </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
