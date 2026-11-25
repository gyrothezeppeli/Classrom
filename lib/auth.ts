// lib/auth.ts

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          const rawEmail = credentials?.email?.trim()
          const rawPassword = credentials?.password

          if (!rawEmail || !rawPassword) {
            console.log("Faltan credenciales")
            return null
          }

          const emailLower = rawEmail.toLowerCase()

          // 1. Buscar por email normalizado en minúsculas
          let user = await prisma.user.findUnique({
            where: { email: emailLower },
            include: {
              docente: true,
              estudiante: true
            }
          })

          // 2. Si no aparece, buscar sin distinguir mayúsculas/minúsculas (por si quedó guardado con mayúsculas)
          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                email: {
                  equals: rawEmail,
                  mode: "insensitive"
                }
              },
              include: {
                docente: true,
                estudiante: true
              }
            })
          }

          if (!user || !user.password) {
            console.log("Usuario no encontrado para:", emailLower)
            return null
          }

          const isValid = await bcrypt.compare(rawPassword, user.password)
          if (!isValid) {
            console.log("Contraseña incorrecta para:", user.email)
            return null
          }

          // Solo exigimos verificación y aprobación a quienes se registren a partir de esta fecha
          const FECHA_ACTIVACION = new Date("2026-11-20T00:00:00.000Z")
          const esUsuarioNuevo = user.createdAt ? new Date(user.createdAt) >= FECHA_ACTIVACION : false

          if (esUsuarioNuevo) {
            if (!user.emailVerified) {
              console.log("El correo del usuario no está verificado")
              throw new Error("EMAIL_NOT_VERIFIED")
            }

            if (!user.aprobado) {
              console.log("La cuenta está en revisión por Control de Estudios")
              throw new Error("ACCOUNT_IN_REVIEW")
            }
          }

          console.log("Login exitoso:", user.email, "Rol:", user.role)

          return {
            id: user.id,
            email: user.email,
            name: `${user.nombre} ${user.apellido || ''}`,
            role: user.role,
            docenteId: user.docente?.id,
            estudianteId: user.estudiante?.id,
          }
        } catch (error) {
          if (
            error instanceof Error &&
            (error.message === "EMAIL_NOT_VERIFIED" || error.message === "ACCOUNT_IN_REVIEW")
          ) {
            throw error
          }
          console.error("Error en authorize:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.docenteId = user.docenteId
        token.estudianteId = user.estudianteId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
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