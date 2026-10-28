// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from 'sileo';
import { RegistrarSW } from '@/components/RegistrarSW';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'U.E Ciudad Cuatricentenaria - Start Bootstrap Theme',
  description: 'Proyectos de Informática y Desarrollo',
  verification: {
    google: 'S-7BKj-vL3gmteCfBMSyYelNygsiPftZELDXZbDeI3Y',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("dark font-sans", montserrat.variable)}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
        />
      </head>
      <body>
        <Providers>
          <RegistrarSW />   {/* ✅ NUEVO: registra el Service Worker */}
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}