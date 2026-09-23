// scripts/actualizar-cedulas-docentes.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const docentes = await prisma.docente.findMany({
    where: { cedulaIdentidad: null }
  })

  console.log(`Docentes sin cédula: ${docentes.length}`)

  for (let i = 0; i < docentes.length; i++) {
    const cedula = `V-${10000000 + i}`
    await prisma.docente.update({
      where: { id: docentes[i].id },
      data: { cedulaIdentidad: cedula }
    })
    console.log(`✅ Docente ${docentes[i].id} → ${cedula}`)
  }

  console.log('✅ Cédulas actualizadas')
}

main().finally(() => prisma.$disconnect())