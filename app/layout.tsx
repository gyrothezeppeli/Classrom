import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { Providers } from './providers';

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
    <html lang="es">
      <head>
        {/* Font Awesome */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css" 
        />
        {/* Google Fonts: Agregada Saira Stencil One */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Saira+Stencil+One&family=Montserrat:wght@400;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}