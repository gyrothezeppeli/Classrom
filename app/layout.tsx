// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from 'sileo';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
    <html lang="es" className={cn("dark font-sans", geist.variable)}>
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
        />
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Saira+Stencil+One&family=Montserrat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}