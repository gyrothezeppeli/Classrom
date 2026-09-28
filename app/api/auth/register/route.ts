// app/api/auth/register/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      email, 
      password, 
      nombre, 
      apellido, 
      telefono,
      cedulaIdentidad, // ✅ NUEVO
      role,
      especialidad,
      nivel,
      grado,
      seccion
    } = body

    // Validaciones básicas
    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: email, password y nombre" },
        { status: 400 }
      )
    }

    // ✅ Validar que el rol sea uno de los permitidos
    const rolesValidos: Role[] = [
      Role.ESTUDIANTE,
      Role.DOCENTE,
      Role.ADMIN,
      Role.COORDINACION,
    ]

    const rolFinal: Role = rolesValidos.includes(role as Role)
      ? (role as Role)
      : Role.ESTUDIANTE

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // ✅ Verificar si la cédula ya existe (solo para estudiantes)
    if (cedulaIdentidad && rolFinal === Role.ESTUDIANTE) {
      const existingCedula = await prisma.estudiante.findUnique({
        where: { cedulaIdentidad }
      })

      if (existingCedula) {
        return NextResponse.json(
          { error: "La cédula ya está registrada" },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el usuario base con el rol correcto
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nombre,
          apellido: apellido || null,
          telefono: telefono || null,
          role: rolFinal,  // ✅ GUARDA EL ROL REAL
        }
      })

      // 2. Crear el perfil específico según el rol (solo DOCENTE y ESTUDIANTE)
      if (rolFinal === Role.DOCENTE) {
        await tx.docente.create({
          data: {
            userId: user.id,
            especialidad: especialidad || null,
          }
        })
      } else if (rolFinal === Role.ESTUDIANTE) {
        await tx.estudiante.create({
          data: {
            userId: user.id,
            cedulaIdentidad: cedulaIdentidad || null,
            nivel: nivel || "",
            grado: grado || "",
            seccion: seccion || "",
          }
        })
      }
      // Para ADMIN y COORDINACION no se crea perfil extra

      return user
    })

    return NextResponse.json({ 
      success: true, 
      message: "Usuario registrado exitosamente",
      user: {
        id: result.id,
        email: result.email,
        nombre: result.nombre,
        role: result.role
      }
    })

  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}