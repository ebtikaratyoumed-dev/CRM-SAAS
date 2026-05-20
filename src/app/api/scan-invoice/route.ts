import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, fileType } = await req.json();

    if (!fileBase64) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Gemini manquante' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyse cette facture et extrais les informations suivantes au format JSON uniquement.
      Ne mets pas de blocs de code markdown (comme \`\`\`json).
      
      Structure attendue:
      {
        "vendor_name": "Nom du fournisseur",
        "invoice_number": "Numéro de facture",
        "date": "YYYY-MM-DD",
        "total_amount": 0.00,
        "tax_amount": 0.00,
        "line_items": [
          { "description": "Désignation", "quantity": 1, "unit_price": 0.00, "total_price": 0.00 }
        ]
      }

      Si une information est manquante, utilise une valeur vide ou 0.
      Réponds UNIQUEMENT le JSON.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileBase64,
          mimeType: fileType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    // Attempt to parse and clean the response
    let jsonContent = text;
    if (text.includes('```json')) {
      jsonContent = text.match(/```json\n([\s\S]*)\n```/)?.[1] || text;
    } else if (text.includes('```')) {
        jsonContent = text.replace(/```/g, '');
    }

    try {
      const parsedData = JSON.parse(jsonContent);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error('Gemini Parse Error:', text);
      return NextResponse.json({ error: 'Erreur de lecture des données extraites' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne lors du scan' }, { status: 500 });
  }
}
