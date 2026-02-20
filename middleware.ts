// middleware.ts
// Implementação Framework-Agnostic (Web API padrão) para Vercel Edge Middleware

export const config = {
  matcher: '/api/:path*',
};

/**
 * CONFIGURAÇÃO DE SEGURANÇA - RATE LIMIT (Camada Rasa)
 * Limite: 30 requisições por minuto por IP.
 * Nota técnica: Em ambientes Edge serverless, variáveis globais (Map) são mantidas 
 * apenas durante o tempo de vida do "isolate" (instância) naquela região. 
 * É uma proteção útil contra spam básico de um único nó, mas não substitui um WAF.
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  // 1. Apenas processa rotas de API
  if (!pathname.startsWith('/api/')) {
    return; // Retornar vazio no middleware da Vercel permite que a requisição prossiga
  }

  // 2. PROTEÇÃO DE ROTA CRON (AUTORIZAÇÃO DE BORDA)
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn(`[Security] Bloqueio de acesso não autorizado ao Cron via IP: ${ip}`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 3. IMPLEMENTAÇÃO DE RATE LIMIT (Lógica em Memória de Borda)
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const limit = 30;

  const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - rateData.lastReset > windowMs) {
    rateData.count = 1;
    rateData.lastReset = now;
  } else {
    rateData.count++;
  }

  rateLimitMap.set(ip, rateData);

  if (rateData.count > limit) {
    console.warn(`[Security] Rate limit excedido para IP: ${ip} na rota: ${pathname}`);
    return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      },
    });
  }

  // Permite a requisição prosseguir (equivalente ao NextResponse.next())
  return;
}
