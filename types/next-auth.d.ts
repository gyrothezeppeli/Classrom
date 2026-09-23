// types/next-auth.d.ts

import { DefaultSession } from "next-auth"
import { Role } from "@prisma/client" // 👈 Importa el enum de Prisma

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role // 👈 Usa el enum de Prisma
      docenteId?: string
      estudianteId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string
    role: Role // 👈 Usa el enum de Prisma
    docenteId?: string
    estudianteId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string
    role?: Role // 👈 Usa el enum de Prisma
    docenteId?: string
    estudianteId?: string
  }
}