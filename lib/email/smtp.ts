import nodemailer from 'nodemailer';

export function getAppBaseUrl(): string {
  const configuredUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (!configuredUrl) {
    throw new Error('APP_URL o NEXTAUTH_URL debe configurarse para verificar correos');
  }

  const url = new URL(configuredUrl);
  if (
    url.protocol !== 'https:' &&
    url.hostname !== 'localhost' &&
    url.hostname !== '127.0.0.1'
  ) {
    throw new Error('La URL de la aplicación debe usar HTTPS');
  }

  return url.origin;
}

export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const from = process.env.EMAIL_FROM;
  const port = Number(process.env.SMTP_PORT || '587');
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const secureSetting = process.env.SMTP_SECURE;

  if (!host || !from) {
    throw new Error('Falta configurar SMTP_HOST o EMAIL_FROM');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT no es válido');
  }
  if ((username && !password) || (!username && password)) {
    throw new Error('SMTP_USER y SMTP_PASSWORD deben configurarse juntos');
  }
  if (secureSetting && secureSetting !== 'true' && secureSetting !== 'false') {
    throw new Error('SMTP_SECURE debe ser true o false');
  }

  const secure = secureSetting ? secureSetting === 'true' : port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    ...(username && password ? { auth: { user: username, pass: password } } : {}),
  });

  const safeUrl = verificationUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Confirma tu correo electrónico',
    text: `Confirma tu correo electrónico abriendo este enlace: ${verificationUrl}\n\nEl enlace vence en 24 horas.`,
    html: `<p>Confirma tu correo electrónico para activar tu cuenta.</p><p><a href="${safeUrl}">Confirmar correo</a></p><p>El enlace vence en 24 horas. Si no solicitaste esta cuenta, ignora este mensaje.</p>`,
  });
}
