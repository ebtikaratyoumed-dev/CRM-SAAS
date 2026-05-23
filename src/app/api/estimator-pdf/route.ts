import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { EstimationPDF } from '@/components/estimator/estimator-pdf';
import { createClient } from '@/lib/supabase/server';
import React from 'react';

export async function POST(req: NextRequest) {
  try {
    // Auth guard (ensure user is logged in)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await req.json();
    const { title, projectName, notes, items } = data;

    // Construct mock sheet matching the structure expected by EstimationPDF
    const sheet = {
      id: 'standalone',
      title: title || 'Estimation de Matériaux',
      status: 'Validé', // Default to Validated for exported files
      notes: notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: projectName ? { name: projectName } : undefined,
      estimation_items: (items ?? []).map((item: any, idx: number) => ({
        id: String(idx),
        material_name: item.material_name,
        category: item.category,
        unit: item.unit,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        total_price: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      })),
    };

    // Render react-pdf component to buffer on server side
    const buffer = await renderToBuffer(
      React.createElement(EstimationPDF, { sheet }) as any
    );

    const safeTitle = (sheet.title as string)
      .replace(/[^a-zA-Z0-9-_\u00C0-\u024F ]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const filename = `estimation-${safeTitle || 'matériaux'}.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
