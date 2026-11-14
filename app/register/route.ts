import { NextResponse } from 'next/server';

import { authRegisterService } from '@/lib/services/auth-register-service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo debe ser JSON válido' }, { status: 400 });
  }

  if (!isRecord(payload) || typeof payload.email !== 'string' || typeof payload.password !== 'string') {
    return NextResponse.json(
      { error: 'Se requieren correo y contraseña' },
      { status: 400 },
    );
  }

  const email = payload.email.trim().toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !payload.password ||
    Buffer.byteLength(payload.password, 'utf8') > 72
  ) {
    return NextResponse.json(
      { error: 'El correo o la contraseña no son válidos' },
      { status: 400 },
    );
  }

  try {
    const result = await authRegisterService.register({
      email,
      password: payload.password,
      nombre: email.slice(0, email.indexOf('@')),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, message: result.message, user: result.user },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error en POST /register:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 },
    );
  }
}
