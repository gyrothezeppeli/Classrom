// app/api/docentes/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"  // ✅ import corregido
import bcrypt from "bcryptjs"

// ============================================
// GET - Obtener docentes
// ============================================
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const especialidad = searchParams.get("especialidad")
    const search = searchParams.get("search")
    const me = searchParams.get("me")

    // ✅ Si es "me", obtener el docente del usuario actual
    if (me === "true") {
      const docente = await prisma.docente.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              apellido: true,
              telefono: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })

      if (!docente) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id }
          })

          if (!user) {
            return NextResponse.json(
              { error: "Usuario no encontrado" },
              { status: 404 }
            )
          }

          const nuevoDocente = await prisma.docente.create({
            data: {
              userId: user.id,
              especialidad: "General",
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  nombre: true,
                  apellido: true,
                  telefono: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          })

          return NextResponse.json({
            id: nuevoDocente.id,
            userId: nuevoDocente.userId,
            cedulaIdentidad: nuevoDocente.cedulaIdentidad || '',
            email: nuevoDocente.user.email,
            nombre: nuevoDocente.user.nombre,
            apellido: nuevoDocente.user.apellido,
            telefono: nuevoDocente.user.telefono,
            especialidad: nuevoDocente.especialidad,
            createdAt: nuevoDocente.user.createdAt,
            updatedAt: nuevoDocente.user.updatedAt
          })
        } catch (createError) {
          console.error("❌ Error al crear docente automático:", createError)
          return NextResponse.json(
            { error: "No se pudo crear el perfil de docente" },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        id: docente.id,
        userId: docente.userId,
        cedulaIdentidad: docente.cedulaIdentidad || '',
        email: docente.user.email,
        nombre: docente.user.nombre,
        apellido: docente.user.apellido,
        telefono: docente.user.telefono,
        especialidad: docente.especialidad,
        createdAt: docente.user.createdAt,
        updatedAt: docente.user.updatedAt
      })
    }

    // ✅ Listar todos los docentes
    const where: any = {}

    if (especialidad) {
      where.especialidad = especialidad
    }

    if (search) {
      where.user = {
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { apellido: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      }
    }

    const docentes = await prisma.docente.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            telefono: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // ✅ MAPEO CORREGIDO
    const docentesFormateados = docentes.map(docente => ({
      id: docente.id,
      userId: docente.userId,
      cedulaIdentidad: docente.cedulaIdentidad || '',
      nombres: docente.user.nombre || '',
      apellidos: docente.user.apellido || '',
      email: docente.user.email || '',
      telefono: docente.user.telefono || '',
      nivel: docente.nivel || '',
      seccion: docente.seccion || '',
      especialidad: docente.especialidad || '',
      fechaContratacion: docente.fechaContratacion
        ? docente.fechaContratacion.toISOString()
        : docente.createdAt.toISOString(),
      activo: docente.activo,
    }))

    return NextResponse.json(docentesFormateados)

  } catch (error) {
    console.error("Error al obtener docentes:", error)
    return NextResponse.json(
      { error: "Error al obtener docentes" },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Crear docente
// ============================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      userId,
      email,
      password,
      nombre,
      apellido,
      telefono,
      cedulaIdentidad,
      especialidad
    } = body

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        )
      }

      const docenteExistente = await prisma.docente.findUnique({
        where: { userId }
      })

      if (docenteExistente) {
        return NextResponse.json(
          { error: "El usuario ya tiene un perfil de docente" },
          { status: 400 }
        )
      }

      const docente = await prisma.docente.create({
        data: {
          userId: user.id,
          cedulaIdentidad: cedulaIdentidad || null,
          especialidad: especialidad || "General",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: "Docente creado exitosamente",
        docente: {
          id: docente.id,
          userId: docente.userId,
          cedulaIdentidad: docente.cedulaIdentidad || '',
          email: docente.user.email,
          nombre: docente.user.nombre,
          apellido: docente.user.apellido,
          telefono: docente.user.telefono,
          especialidad: docente.especialidad
        }
      })
    }

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: email, password, nombre" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    if (cedulaIdentidad) {
      const existingCedula = await prisma.docente.findUnique({
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

    const docente = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nombre,
          apellido: apellido || null,
          telefono: telefono || null,
          role: "DOCENTE"
        }
      })

      const docente = await tx.docente.create({
        data: {
          userId: user.id,
          cedulaIdentidad: cedulaIdentidad || null,
          especialidad: especialidad || "General",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          }
        }
      })

      return docente
    })

    return NextResponse.json({
      success: true,
      message: "Docente creado exitosamente",
      docente: {
        id: docente.id,
        userId: docente.userId,
        cedulaIdentidad: docente.cedulaIdentidad || '',
        email: docente.user.email,
        nombre: docente.user.nombre,
        apellido: docente.user.apellido,
        telefono: docente.user.telefono,
        especialidad: docente.especialidad
      }
    })

  } catch (error) {
    console.error("Error al crear docente:", error)
    return NextResponse.json(
      { error: "Error al crear docente" },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Actualizar docente
// ============================================
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, email, nombre, apellido, telefono, cedulaIdentidad, especialidad } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID de docente requerido" },
        { status: 400 }
      )
    }

    const docenteExistente = await prisma.docente.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!docenteExistente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      )
    }

    const docenteActualizado = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: docenteExistente.userId },
        data: {
          email: email || docenteExistente.user.email,
          nombre: nombre || docenteExistente.user.nombre,
          apellido: apellido !== undefined ? apellido : docenteExistente.user.apellido,
          telefono: telefono !== undefined ? telefono : docenteExistente.user.telefono,
        }
      })

      const docente = await tx.docente.update({
        where: { id },
        data: {
          cedulaIdentidad: cedulaIdentidad !== undefined ? cedulaIdentidad : docenteExistente.cedulaIdentidad,
          especialidad: especialidad !== undefined ? especialidad : docenteExistente.especialidad,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          }
        }
      })

      return { docente, user }
    })

    return NextResponse.json({
      success: true,
      message: "Docente actualizado exitosamente",
      docente: {
        id: docenteActualizado.docente.id,
        userId: docenteActualizado.docente.userId,
        cedulaIdentidad: docenteActualizado.docente.cedulaIdentidad || '',
        email: docenteActualizado.user.email,
        nombre: docenteActualizado.user.nombre,
        apellido: docenteActualizado.user.apellido,
        telefono: docenteActualizado.user.telefono,
        especialidad: docenteActualizado.docente.especialidad
      }
    })

  } catch (error) {
    console.error("Error al actualizar docente:", error)
    return NextResponse.json(
      { error: "Error al actualizar docente" },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Eliminar docente
// ============================================
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de docente requerido" },
        { status: 400 }
      )
    }

    const docente = await prisma.docente.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!docente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: docente.userId }
    })

    return NextResponse.json({
      success: true,
      message: "Docente eliminado exitosamente"
    })

  } catch (error) {
    console.error("Error al eliminar docente:", error)
    return NextResponse.json(
      { error: "Error al eliminar docente" },
      { status: 500 }
    )
  }
}