// app/api/salones/sincronizar/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ===== Utilidades de normalización =====
const normalizar = (valor: string): string => {
  if (!valor) return '';
  return valor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

const variantesNivel = (nivel: string): string[] => {
  const n = normalizar(nivel);
  const mapa: Record<string, string[]> = {
    inicial: ['inicial', 'preescolar', 'educacion inicial'],
    primaria: ['primaria', 'educacion primaria'],
    media: ['media', 'bachillerato', 'educacion media'],
  };
  return mapa[n] || [n];
};

const variantesGrado = (grado: string): string[] => {
  const g = normalizar(grado);
  const mapa: Record<string, string[]> = {
    '1er ano': ['1er ano', '1ro', '1er año', '1'],
    '2do ano': ['2do ano', '2do', '2do año', '2'],
    '3er ano': ['3er ano', '3ro', '3er año', '3'],
    '4to ano': ['4to ano', '4to', '4to año', '4'],
    '5to ano': ['5to ano', '5to', '5to año', '5'],
    '1er grado': ['1er grado', '1ro', '1'],
    '2do grado': ['2do grado', '2do', '2'],
    '3er grado': ['3er grado', '3ro', '3'],
    '4to grado': ['4to grado', '4to', '4'],
    '5to grado': ['5to grado', '5to', '5'],
    '6to grado': ['6to grado', '6to', '6'],
    'pre-kinder': ['pre-kinder', 'prekinder'],
    kinder: ['kinder'],
    preparatorio: ['preparatorio'],
  };
  return mapa[g] || [g];
};

const coincideNivel = (a: string, b: string) =>
  variantesNivel(a).includes(normalizar(b)) ||
  variantesNivel(b).includes(normalizar(a));

const coincideGrado = (a: string, b: string) =>
  variantesGrado(a).includes(normalizar(b)) ||
  variantesGrado(b).includes(normalizar(a));

const coincideSeccion = (a: string, b: string) => {
  const na = normalizar(a);
  const nb = normalizar(b);
  return na === nb || na === `seccion ${nb}` || `seccion ${na}` === nb;
};

// ===== Endpoint principal =====
export async function POST() {
  try {
    // 1) Asegurar salón base "1er Año - Sección A" (media)
    const salonBaseExiste = await prisma.salon.findFirst({
      where: {
        nivel: 'media',
        grado: '1er Año',
        seccion: 'A',
        anioAcademico: '2024-2025',
      },
    });

    if (!salonBaseExiste) {
      await prisma.salon.create({
        data: {
          nombre: '1er Año - Sección A',
          nivel: 'media',
          grado: '1er Año',
          seccion: 'A',
          anioAcademico: '2024-2025',
          // ✅ Se eliminó `docenteIds: []` porque no existe en el schema.
          //    Si necesitas asignar docentes, se hace con DocenteSalon.
        },
      });
    }

    // 2) Traer todos los salones y estudiantes
    const salones = await prisma.salon.findMany({
      where: { anioAcademico: '2024-2025' },
    });
    const estudiantes = await prisma.estudiante.findMany();

    // 3) Para cada salón, calcular sus estudiantes según coincidencia
    for (const salon of salones) {
      const idsCoincidentes = estudiantes
        .filter(
          (e) =>
            coincideNivel(salon.nivel, e.nivel) &&
            coincideGrado(salon.grado, e.grado) &&
            coincideSeccion(salon.seccion, e.seccion)
        )
        .map((e) => e.id);

      // Asignar salonId a los que coinciden
      if (idsCoincidentes.length > 0) {
        await prisma.estudiante.updateMany({
          where: { id: { in: idsCoincidentes } },
          data: { salonId: salon.id },
        });
      }

      // Quitar salonId a los que ya no coinciden con este salón
      await prisma.estudiante.updateMany({
        where: {
          salonId: salon.id,
          id: { notIn: idsCoincidentes },
        },
        data: { salonId: null },
      });
    }

    // 4) Devolver salones actualizados en el formato que espera el front
    const salonesActualizados = await prisma.salon.findMany({
      where: { anioAcademico: '2024-2025' },
      include: {
        estudiantes: { select: { id: true } },
        docentes: true,   // ✅ Necesario para leer docenteIds
      },
      orderBy: [{ nivel: 'asc' }, { grado: 'asc' }, { seccion: 'asc' }],
    });

    const adaptados = salonesActualizados.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      nivel: s.nivel,
      grado: s.grado,
      seccion: s.seccion,
      anioAcademico: s.anioAcademico,
      // ✅ Extraer los IDs de la tabla intermedia DocenteSalon
      docenteIds: s.docentes.map((ds) => ds.docenteId),
      estudianteIds: s.estudiantes.map((e) => e.id),
    }));

    return NextResponse.json({ ok: true, salones: adaptados });
  } catch (error) {
    console.error('Error sincronizando salones:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al sincronizar' },
      { status: 500 }
    );
  }
}