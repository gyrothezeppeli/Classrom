import { NextResponse } from 'next/server';

import { getAppBaseUrl } from '@/lib/email/smtp';
import { emailVerificationService } from '@/lib/services/email-verification-service';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const token = requestUrl.searchParams.get('token') ?? '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return redirectToResult('invalid');
    }

    return new Response(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Confirmar correo</title></head><body><main><h1>Confirma tu correo electrónico</h1><p>Pulsa el botón para activar tu cuenta.</p><form method="post" action="/api/auth/verify-email"><input type="hidden" name="token" value="${token}"><button type="submit">Confirmar correo</button></form></main></body></html>`,
      {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
          'Content-Type': 'text/html; charset=utf-8',
          'Referrer-Policy': 'no-referrer',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  } catch (error) {
    console.error('Error al preparar la verificación del correo:', error);
    return NextResponse.json(
      { error: 'No se pudo completar la verificación del correo' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token');
    const verified = typeof token === 'string'
      ? await emailVerificationService.verify(token)
      : false;
    return redirectToResult(verified ? 'success' : 'invalid');
  } catch (error) {
    console.error('Error al verificar el correo:', error);
    return NextResponse.json(
      { error: 'No se pudo completar la verificación del correo' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

function redirectToResult(result: 'success' | 'invalid'): NextResponse {
  const destination = new URL('/', getAppBaseUrl());
  destination.searchParams.set('emailVerification', result);
  return NextResponse.redirect(destination, {
    status: 303,
    headers: {
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
