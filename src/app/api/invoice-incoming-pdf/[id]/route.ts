import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { IncomingInvoicePDF } from '@/components/dashboard/invoices/incoming-invoice-pdf';
import React from 'react';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch invoice (incoming)
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`*`)
    .eq('id', id)
    .single();

  if (error || !invoice) {
    return new NextResponse('Invoice not found', { status: 404 });
  }

  // Prepare data for PDF
  const pdfData = {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    vendor_name: invoice.vendor_name,
    line_items: invoice.line_items || [],
    tax: invoice.tax,
    total_amount: invoice.total_amount,
    notes: invoice.notes,
    company_name: invoice.company_name,
    company_address: invoice.company_address,
    vendor_tax_number: invoice.vendor_tax_number
  };

  // Generate PDF buffer
  const buffer = await renderToBuffer(
    React.createElement(IncomingInvoicePDF, { data: pdfData }) as any
  );

  const filename = `${invoice.invoice_number || 'facture_fournisseur'}.pdf`;

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
