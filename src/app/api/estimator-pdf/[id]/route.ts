import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { EstimationPDF } from '@/components/estimator/estimator-pdf'
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

  // Fetch sheet with project and items
  const { data: sheet, error } = await supabase
    .from('estimation_sheets')
    .select(`
      *,
      project:projects(name),
      estimation_items(*)
    `)
    .eq('id', id)
    .order('sort_order', { referencedTable: 'estimation_items', ascending: true })
    .single()

  if (error || !sheet) {
    return new NextResponse('Estimation sheet not found', { status: 404 })
  }

  // Generate PDF buffer
  const buffer = await renderToBuffer(
    React.createElement(EstimationPDF, { sheet }) as any
  )

  const safeTitle = (sheet.title as string)
    .replace(/[^a-zA-Z0-9-_\u00C0-\u024F ]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  const filename = `estimation-${safeTitle}.pdf`

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
