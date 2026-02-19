
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

/**
 * Handler para geração de insights baseados nos logs de Epitáfio.
 * Implementa segurança rigorosa e tratamento de erros para ambiente Serverless.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validação de Método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { logs } = req.body;

  // 2. Validação básica de entrada
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'Dados de logs ausentes ou inválidos.' });
  }

  // 3. Verificação de Segurança da API Key (Ambiente Seguro)
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("[CRITICAL] API_KEY não encontrada nas variáveis de ambiente do Vercel.");
    return res.status(500).json({ error: 'Erro de configuração interna do servidor.' });
  }

  try {
    // 4. Inicialização do Cliente GenAI (Padrão SDK Google)
    const ai = new GoogleGenAI({ apiKey });

    // 5. Construção do Prompt Contextualizado
    const logsText = logs
      .map((l: any) => `Dia ${l.day_number} (${l.date}): "${l.content}"`)
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

    // 6. Chamada à API Gemini (Modelo Flash para rapidez e eficiência em texto)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // 7. Extração Segura da Resposta
    const generatedText = response.text;

    if (!generatedText) {
      throw new Error("A API retornou uma resposta vazia.");
    }

    // 8. Resposta de Sucesso
    return res.status(200).json({ insight: generatedText });

  } catch (error: any) {
    // 9. Tratamento de Erro Robusto (Sem vazamento de segredos/stacktraces)
    console.error("[GenAI Error] Falha na comunicação com o modelo:", error.message);
    
    // Diferencia erro de cota/limite se possível
    const status = error.message?.includes('429') ? 429 : 500;
    const message = status === 429 
      ? 'Muitas solicitações. Tente novamente em alguns instantes.' 
      : 'Ocorreu um erro ao processar sua análise de evolução.';

    return res.status(status).json({ error: message });
  }
}
