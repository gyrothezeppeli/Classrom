This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Verificación y autenticación de correo

Las cuentas nuevas quedan pendientes hasta que el usuario abra el enlace de verificación enviado por correo. El enlace vence en 24 horas. Para enviar mensajes, configura estas variables en el entorno del servidor:

- `APP_URL`: URL pública de la aplicación (usa HTTPS en producción). Si no está definida, se usa `NEXTAUTH_URL`.
- `SMTP_HOST`, `SMTP_PORT` y `SMTP_SECURE`: datos del servidor SMTP; `SMTP_SECURE` puede ser `true` o `false`.
- `SMTP_USER` y `SMTP_PASSWORD`: credenciales SMTP, ambas o ninguna, según el proveedor.
- `EMAIL_FROM`: dirección remitente autorizada por el proveedor.

Para Gmail, genera una contraseña de aplicación con la verificación en dos pasos habilitada y usa esta configuración:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-correo@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
EMAIL_FROM=tu-correo@gmail.com
APP_URL=http://localhost:3000
```

No uses la contraseña normal de Gmail ni compartas o subas la contraseña de aplicación a Git. En producción, configura estas variables como secretos del proveedor de despliegue y establece `APP_URL` con la URL pública HTTPS.

Aplica la migración de base de datos antes de desplegar:

```bash
npx prisma migrate deploy
npx prisma generate
```

Para autenticar los correos salientes con SPF, DKIM y DMARC, publica en el DNS del dominio remitente los registros exactos que proporcione tu servicio de correo. No copies el SPF de otro proveedor ni publiques más de un registro SPF para el mismo dominio. Configura primero DMARC en modo de monitorización (`p=none`), revisa los informes y endurece la política cuando SPF y DKIM estén alineados. La configuración exacta requiere conocer el dominio y proveedor usados.

Referencia: [Autenticación de correo electrónico — Proofpoint](https://www.proofpoint.com/es/threat-reference/email-authentication).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
