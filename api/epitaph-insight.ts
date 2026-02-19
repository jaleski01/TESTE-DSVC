
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

/**
 * Handler para geração de insights baseados nos logs de Epitáfio.
 * Implementa segurança rigorosa e tratamento de erros para ambiente Serverless.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validação de Método HTTP (Apenas POST permitido)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // 2. Validação de API Key
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("[CRITICAL] API_KEY não encontrada.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  const { logs } = req.body;

  // 3. Validação de Payload
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'Dados de logs ausentes ou inválidos.' });
  }

  // 4. Sanitização e Limite de Dados (Prevenção de sobrecarga)
  const sanitizedLogs = logs.slice(0, 5).map(l => ({
    date: String(l.date || ''),
    day_number: Number(l.day_number || 0),
    content: String(l.content || '').substring(0, 1000) // Limita tamanho do texto
  }));

  try {
    // 5. Inicialização do SDK @google/genai (Conforme diretrizes Gemini API)
    const ai = new GoogleGenAI({ apiKey });

    // 6. Construção do Prompt (Seguro)
    const logsText = sanitizedLogs
      .map((l) => `Dia ${l.day_number} (${l.date}): "${l.content}"`)
      .join('\n\n');

    const prompt = `
      Atue como um analista comportamental sênior e mentor estoico. 
      Analise os seguintes registros diários (Epitáfios) de um indivíduo em jornada de superação de vício e alta performance.
      
      LOGS PARA ANÁLISE:
      ${logsText}

      OBJETIVO:
      Sintetize a evolução psicológica, força de caráter e clareza mental demonstrada.

      FORMATO OBRIGATÓRIO:
      - Exatamente 3 bullet points curtos, diretos e impactantes.
      - Tom marcial, solene e encorajador.
      - Não use introduções ou saudações.
    `;

    // 7. Geração de Conteúdo (Modelo Flash para Eficiência)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const generatedText = response.text;

    if (!generatedText) {
      throw new Error("A API retornou uma resposta vazia.");
    }

    // 8. Resposta de Sucesso
    return res.status(200).json({ insight: generatedText });

  } catch (error: any) {
    console.error("[GenAI Error] Falha na comunicação com o modelo:", error.message);
    const status = error.message?.includes('429') ? 429 : 500;
    return res.status(status).json({ 
      error: status === 429 ? 'Limite de taxa excedido.' : 'Erro ao processar análise.' 
    });
  }
}
