import { NextResponse } from 'next/server';

import { authRegisterService } from '@/lib/services/auth-register-service'

export async function POST(req: Request) {
  try {
    const result = await authRegisterService.register(await req.json());

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 },
    );
  }
}
