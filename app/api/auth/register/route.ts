// app/api/auth/register/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
// ✅ NUEVO: importar funciones de coincidencia
import { coincideNivel, coincideGrado, coincideSeccion } from "@/lib/coincidencias"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      email,
      password,
      nombre,
      apellido,
      telefono,
      cedulaIdentidad,
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

    // ✅ 1. Crear usuario y perfil en transacción
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nombre,
          apellido: apellido || null,
          telefono: telefono || null,
          role: rolFinal,
        }
      })

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

      return user
    })

    // ✅ 2. Si es ESTUDIANTE, asignar contenido existente automáticamente
    if (rolFinal === Role.ESTUDIANTE) {
      const estudiante = await prisma.estudiante.findUnique({
        where: { userId: result.id },
        include: { user: true }
      })

      if (estudiante) {
        console.log(`👨‍🎓 Nuevo estudiante: ${estudiante.user.nombre} ${estudiante.user.apellido} | ${estudiante.nivel} ${estudiante.grado} ${estudiante.seccion}`)

        // Asignar planes de evaluación existentes
        const planesExistentes = await prisma.planEvaluacion.findMany()
        const planesAsignados = planesExistentes.filter((plan) =>
          coincideNivel(plan.nivel, estudiante.nivel) &&
          coincideGrado(plan.grado, estudiante.grado) &&
          coincideSeccion(plan.seccion, estudiante.seccion)
        )

        if (planesAsignados.length > 0) {
          await prisma.estudiantePlanEvaluacion.createMany({
            data: planesAsignados.map((plan) => ({
              estudianteId: estudiante.id,
              planEvaluacionId: plan.id,
              visto: false,
            })),
            skipDuplicates: true,
          })
          console.log(`   → ${planesAsignados.length} planes asignados`)
        }

        // Asignar tareas existentes
        const tareasExistentes = await prisma.tarea.findMany()
        const tareasAsignadas = tareasExistentes.filter((tarea) =>
          coincideNivel(tarea.nivel, estudiante.nivel) &&
          coincideGrado(tarea.grado, estudiante.grado) &&
          coincideSeccion(tarea.seccion, estudiante.seccion)
        )

        if (tareasAsignadas.length > 0) {
          await prisma.estudianteTarea.createMany({
            data: tareasAsignadas.map((tarea) => ({
              estudianteId: estudiante.id,
              tareaId: tarea.id,
              visto: false,
              entregado: false,
            })),
            skipDuplicates: true,
          })
          console.log(`   → ${tareasAsignadas.length} tareas asignadas`)
        }

        // Asignar avisos existentes
        const avisosExistentes = await prisma.aviso.findMany()
        const avisosAsignados = avisosExistentes.filter((aviso) =>
          coincideNivel(aviso.nivel, estudiante.nivel) &&
          coincideGrado(aviso.grado, estudiante.grado) &&
          coincideSeccion(aviso.seccion, estudiante.seccion)
        )

        if (avisosAsignados.length > 0) {
          await prisma.estudianteAviso.createMany({
            data: avisosAsignados.map((aviso) => ({
              estudianteId: estudiante.id,
              avisoId: aviso.id,
              visto: false,
            })),
            skipDuplicates: true,
          })
          console.log(`   → ${avisosAsignados.length} avisos asignados`)
        }

        // Asignar materiales existentes
        const materialesExistentes = await prisma.material.findMany()
        const materialesAsignados = materialesExistentes.filter((material) =>
          coincideNivel(material.nivel, estudiante.nivel) &&
          coincideGrado(material.grado, estudiante.grado) &&
          coincideSeccion(material.seccion, estudiante.seccion)
        )

        if (materialesAsignados.length > 0) {
          await prisma.estudianteMaterial.createMany({
            data: materialesAsignados.map((material) => ({
              estudianteId: estudiante.id,
              materialId: material.id,
              visto: false,
            })),
            skipDuplicates: true,
          })
          console.log(`   → ${materialesAsignados.length} materiales asignados`)
        }

        console.log(`🎉 Total asignado a ${estudiante.user.nombre}: ${planesAsignados.length} planes, ${tareasAsignadas.length} tareas, ${avisosAsignados.length} avisos, ${materialesAsignados.length} materiales`)
      }
    }

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