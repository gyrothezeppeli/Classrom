import { signIn } from 'next-auth/react';
import type { RegistrationPayload } from './AuthForm';

const REMEMBER_ME_KEY = 'portal_remember_email';

interface RegistrationResponse {
  error?: string;
}

export class AuthService {
  async register(payload: RegistrationPayload): Promise<{ error?: string }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as RegistrationResponse;
    if (!response.ok) {
      return { error: data.error || 'Intenta de nuevo' };
    }

    return {};
  }

  async login(email: string, password: string) {
    return signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
  }

  rememberEmail(email: string, shouldRemember: boolean): void {
    try {
      if (shouldRemember) {
        localStorage.setItem(REMEMBER_ME_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  getRememberedEmail(): string | null {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY);
    } catch (error) {
      console.error('Error al leer localStorage:', error);
      return null;
    }
  }
}
