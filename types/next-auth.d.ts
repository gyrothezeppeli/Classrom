// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    nombre: string;
    rol: string;
    nivel?: string | null;
    grado?: string | null;
    seccion?: string | null;
  }

  interface Session {
    user: {
      id: string;
      nombre: string;
      rol: string;
      nivel?: string | null;
      grado?: string | null;
      seccion?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nombre: string;
    rol: string;
    nivel?: string | null;
    grado?: string | null;
    seccion?: string | null;
  }
}