// lib/auth.ts

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log("🔍 Intentando login con:", credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Faltan credenciales")
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              docente: true,
              estudiante: true
            }
          })

          if (!user || !user.password) {
            console.log("❌ Usuario no encontrado")
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            console.log("❌ Contraseña incorrecta")
            return null
          }

          console.log("✅ Login exitoso:", user.email, "Rol:", user.role)

          return {
            id: user.id,
            email: user.email,
            name: `${user.nombre} ${user.apellido || ''}`,
            role: user.role,
            docenteId: user.docente?.id,
            estudianteId: user.estudiante?.id,
          }
        } catch (error) {
          console.error("❌ Error en authorize:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // ✅ CRÍTICO: Guardar el id explícitamente en el token
      if (user) {
        token.id = user.id            // 👈 ESTA LÍNEA FALTABA
        token.role = user.role
        token.docenteId = user.docenteId
        token.estudianteId = user.estudianteId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // ✅ Usar token.id explícito, con fallback a token.sub
        session.user.id = (token.id as string) || (token.sub as string)
        session.user.role = token.role as Role
        session.user.docenteId = token.docenteId as string
        session.user.estudianteId = token.estudianteId as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}