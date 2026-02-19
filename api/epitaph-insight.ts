
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Fix: Use @google/genai as per current guidelines instead of deprecated @google/generative-ai
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validação de Método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { logs } = req.body;

  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'Logs inválidos ou vazios.' });
  }

  // 2. Inicialização Segura (Server-Side)
  // Fix: The API key must be obtained exclusively from the environment variable process.env.API_KEY
  if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY não configurada no ambiente.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  try {
    // Fix: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 3. Construção do Prompt
    const logsText = logs
      .map((l: any) => `Dia ${l.day_number} (${l.date}): "${l.content}"`)
      .join('\n\n');

    const prompt = `
      Aja como um analista comportamental estoico e mentor de alta performance. 
      Analise estes registros de diário ("Epitáfio") de um homem em processo de recuperação.
      
      LOGS DO USUÁRIO:
      ${logsText}

      TAREFA:
      Gere um resumo curto e profundo sobre a evolução psicológica dele.
      
      FORMATO:
      Forneça exatamente 3 bullet points curtos e impactantes.
      Foque na evolução do caráter e disciplina.
      Use tom sério, marcial e encorajador.
    `;

    // 4. Geração de Conteúdo
    // Fix: Use ai.models.generateContent and gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Fix: The GenerateContentResponse object features a text property (not a method, so do not call text())
    const text = response.text;

    return res.status(200).json({ insight: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Retorna 500 mas loga o erro para debug no painel da Vercel
    return res.status(500).json({ error: 'Falha ao processar insight.' });
  }
}
