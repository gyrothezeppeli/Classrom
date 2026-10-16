// scripts/normalizar-todas-las-tablas.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// MAPA COMPLETO DE NORMALIZACIÓN
// ============================================
const MAPA_GRADOS: Record<string, string> = {
  // Preescolar / Inicial
  '1er_nivel': 'Pre-Kinder',
  '2do_nivel': 'Kinder',
  '3er_nivel': 'Preparatorio',
  '1er nivel': 'Pre-Kinder',
  '2do nivel': 'Kinder',
  '3er nivel': 'Preparatorio',
  '1er Nivel': 'Pre-Kinder',
  '2do Nivel': 'Kinder',
  '3er Nivel': 'Preparatorio',
  'pre-kinder': 'Pre-Kinder',
  'prekinder': 'Pre-Kinder',
  'kinder': 'Kinder',
  'preparatorio': 'Preparatorio',

  // Primaria
  '1er_grado': '1er Grado',
  '2do_grado': '2do Grado',
  '3er_grado': '3er Grado',
  '4to_grado': '4to Grado',
  '5to_grado': '5to Grado',
  '6to_grado': '6to Grado',
  '1er grado': '1er Grado',
  '2do grado': '2do Grado',
  '3er grado': '3er Grado',
  '4to grado': '4to Grado',
  '5to grado': '5to Grado',
  '6to grado': '6to Grado',

  // Media / Bachillerato
  '1er_ano': '1er Año',
  '2do_ano': '2do Año',
  '3er_ano': '3er Año',
  '4to_ano': '4to Año',
  '5to_ano': '5to Año',
  '1er ano': '1er Año',
  '2do ano': '2do Año',
  '3er ano': '3er Año',
  '4to ano': '4to Año',
  '5to ano': '5to Año',
  '1er año': '1er Año',
  '2do año': '2do Año',
  '3er año': '3er Año',
  '4to año': '4to Año',
  '5to año': '5to Año',

  // Variantes sueltas
  '1ro': '1',
  '1ero': '1',
  '1er': '1',
  '1ra': '1',
  '2do': '2',
  '2da': '2',
  '3ro': '3',
  '3ero': '3',
  '3ra': '3',
  '4to': '4',
  '4ta': '4',
  '5to': '5',
  '5ta': '5',
  '6to': '6',
  '6ta': '6',
};

// ============================================
// Construir grado canónico desde número + nivel
// ============================================
function construirGrado(num: number, nivel: string): string {
  if (nivel === 'inicial') {
    const iniciales: Record<number, string> = {
      1: 'Pre-Kinder',
      2: 'Kinder',
      3: 'Preparatorio',
    };
    return iniciales[num] || '';
  }

  const ordinales: Record<number, string> = {
    1: '1er',
    2: '2do',
    3: '3er',
    4: '4to',
    5: '5to',
    6: '6to',
  };

  const ordinal = ordinales[num];
  if (!ordinal) return '';

  const sufijo = nivel === 'primaria' ? 'Grado' : 'Año';
  return `${ordinal} ${sufijo}`;
}

// ============================================
// Normalizar un grado según nivel
// ============================================
function normalizarGrado(gradoOriginal: string, nivel: string): string {
  if (!gradoOriginal) return '';

  const nivelNorm = (nivel || '').toLowerCase().trim();
  const gradoLimpio = gradoOriginal.trim();

  // 1. Buscar en el mapa (variante exacta o en minúsculas)
  const valorMapeado =
    MAPA_GRADOS[gradoLimpio] ||
    MAPA_GRADOS[gradoLimpio.toLowerCase()] ||
    MAPA_GRADOS[gradoLimpio.toLowerCase().replace(/\s+/g, '_')];

  if (valorMapeado) {
    // Si es un número suelto, construir el grado canónico
    if (/^\d$/.test(valorMapeado)) {
      const construido = construirGrado(parseInt(valorMapeado), nivelNorm);
      if (construido) return construido;
    }
    return valorMapeado;
  }

  // 2. Si no está en el mapa, extraer número y reconstruir
  const match = gradoLimpio.match(/\d/);
  if (match) {
    const num = parseInt(match[0]);
    const construido = construirGrado(num, nivelNorm);
    if (construido) return construido;
  }

  // 3. Devolver el original si no se pudo normalizar
  return gradoLimpio;
}

// ============================================
// Normalizar una tabla genérica
// ============================================
async function normalizarTabla(
  nombre: string,
  modelo: any
): Promise<{ actualizados: number; sinCambios: number; errores: number }> {
  console.log(`\n📋 Normalizando ${nombre}...`);

  let registros: any[] = [];
  try {
    registros = await modelo.findMany({
      select: { id: true, grado: true, nivel: true },
    });
  } catch (error) {
    console.log(`   ⚠️  No se pudo leer la tabla: ${(error as Error).message}`);
    return { actualizados: 0, sinCambios: 0, errores: 1 };
  }

  let actualizados = 0;
  let sinCambios = 0;
  let errores = 0;

  for (const r of registros) {
    if (!r.grado) {
      sinCambios++;
      continue;
    }

    const gradoNormalizado = normalizarGrado(r.grado, r.nivel || '');

    if (gradoNormalizado && gradoNormalizado !== r.grado) {
      try {
        await modelo.update({
          where: { id: r.id },
          data: { grado: gradoNormalizado },
        });
        console.log(
          `   ✅ "${r.grado}" → "${gradoNormalizado}" (nivel: ${r.nivel || '?'})`
        );
        actualizados++;
      } catch (error) {
        console.error(`   ❌ Error en ${r.id}: ${(error as Error).message}`);
        errores++;
      }
    } else {
      sinCambios++;
    }
  }

  console.log(
    `   → Actualizados: ${actualizados} | Sin cambios: ${sinCambios} | Errores: ${errores}`
  );

  return { actualizados, sinCambios, errores };
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('='.repeat(70));
  console.log('🔧 NORMALIZACIÓN COMPLETA DE TODAS LAS TABLAS');
  console.log('='.repeat(70));

  // Info de conexión (sin exponer contraseña)
  const dbUrl = process.env.DATABASE_URL || '';
  const urlSinPassword = dbUrl.replace(/:[^:@]+@/, ':***@');
  console.log(`\n📡 Conectado a: ${urlSinPassword}\n`);

  const resultados = {
    estudiantes: await normalizarTabla('Estudiante', prisma.estudiante),
    tareas: await normalizarTabla('Tarea', prisma.tarea),
    avisos: await normalizarTabla('Aviso', prisma.aviso),
    materiales: await normalizarTabla('Material', prisma.material),
    planes: await normalizarTabla('PlanEvaluacion', prisma.planEvaluacion),
    notas: await normalizarTabla('Nota', prisma.nota),
    horarios: await normalizarTabla('Horario', prisma.horario),
    salones: await normalizarTabla('Salon', prisma.salon),
    asistencias: await normalizarTabla('Asistencia', prisma.asistencia),
  };

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(70));

  let totalActualizados = 0;
  let totalSinCambios = 0;
  let totalErrores = 0;

  Object.entries(resultados).forEach(([nombre, r]) => {
    console.log(
      `${nombre.padEnd(15)} | ✅ ${String(r.actualizados).padStart(4)} actualizados | ⏭️  ${String(r.sinCambios).padStart(4)} sin cambios | ❌ ${r.errores}`
    );
    totalActualizados += r.actualizados;
    totalSinCambios += r.sinCambios;
    totalErrores += r.errores;
  });

  console.log('='.repeat(70));
  console.log(
    `TOTAL: ✅ ${totalActualizados} actualizados | ⏭️  ${totalSinCambios} sin cambios | ❌ ${totalErrores} errores`
  );
  console.log('='.repeat(70));

  if (totalErrores === 0) {
    console.log('\n🎉 Normalización completada exitosamente.\n');
  } else {
    console.log(`\n⚠️  Completado con ${totalErrores} errores.\n`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error general:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });