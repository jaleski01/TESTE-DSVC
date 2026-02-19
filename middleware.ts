
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CONFIGURAÇÃO DE SEGURANÇA - RATE LIMIT
 * Limite: 30 requisições por minuto por IP.
 * Nota: Como o middleware roda em Edge, o Map é instanciado por região/instância.
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

  // 1. Apenas processa rotas de API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. PROTEÇÃO DE ROTA CRON (AUTORIZAÇÃO DE BORDA)
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn(`[Security] Bloqueio de acesso não autorizado ao Cron via IP: ${ip}`);
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
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
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': '60'
      },
    });
  }

  // Permite a requisição prosseguir para a Serverless Function
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
