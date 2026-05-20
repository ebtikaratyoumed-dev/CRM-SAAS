import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoice-pdf'
import React from 'react'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Fetch invoice with project name
  const { data: invoice, error } = await supabase
    .from('invoices_outgoing')
    .select(`*, project:projects(name)`)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    return new NextResponse('Invoice not found', { status: 404 })
  }

  // Generate PDF buffer
  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF, { invoice }) as any
  )

  const filename = `${invoice.invoice_number || 'facture'}.pdf`

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
