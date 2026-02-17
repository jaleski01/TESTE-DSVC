import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY não configurada no ambiente.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  try {
    // Inicializa o SDK Estável
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configura o modelo (Flash é ideal para velocidade/custo)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ insight: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Retorna 500 mas loga o erro para debug no painel da Vercel
    return res.status(500).json({ error: 'Falha ao processar insight.' });
  }
}