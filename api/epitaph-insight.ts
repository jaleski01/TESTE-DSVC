
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validação de Método e Segurança Básica
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { logs } = req.body;

  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'Logs inválidos ou vazios.' });
  }

  // 2. Inicialização Segura do SDK (Server-Side Only)
  // A chave fica apenas no ambiente da Vercel, nunca no cliente.
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY não configurada no ambiente.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // 3. Construção do Contexto para a IA
    const logsText = logs
      .map((l: any) => `Dia ${l.day_number} (${l.date}): "${l.content}"`)
      .join('\n\n');

    const prompt = `
      Aja como um analista comportamental estoico e mentor de alta performance. 
      Analise estes registros de diário ("Epitáfio") de um homem em processo de recuperação de vícios dopaminérgicos.
      
      LOGS DO USUÁRIO:
      ${logsText}

      TAREFA:
      Gere um resumo curto, direto e profundo sobre a evolução psicológica dele.
      
      FORMATO:
      Forneça exatamente 3 bullet points curtos e impactantes.
      Foque estritamente na evolução do caráter, armadilhas mentais detectadas e fortalecimento da disciplina.
      Use tom sério, marcial e encorajador. Sem introduções, vá direto aos pontos.
    `;

    // 4. Chamada ao Modelo (Gemini Flash para velocidade)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest', // Usando modelo atualizado conforme guidelines
      contents: prompt,
    });

    const text = response.text;

    return res.status(200).json({ insight: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'Falha ao processar insight.' });
  }
}
