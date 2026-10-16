// scripts/diagnostico-todas-las-tablas.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GRADOS_CANONICOS = [
  'Pre-Kinder', 'Kinder', 'Preparatorio',
  '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado',
  '1er Año', '2do Año', '3er Año', '4to Año', '5to Año',
];

async function diagnosticarTabla(
  nombre: string,
  modelo: any,
  campoNivel: string = 'nivel'
) {
  try {
    const total = await modelo.count();

    const registros = await modelo.findMany({
      select: { grado: true, [campoNivel]: true },
    });

    const gradosUnicos = new Map<string, number>();
    const noCanonicos: any[] = [];

    registros.forEach((r: any) => {
      const grado = r.grado || '(vacío)';
      gradosUnicos.set(grado, (gradosUnicos.get(grado) || 0) + 1);

      if (r.grado && !GRADOS_CANONICOS.includes(r.grado)) {
        noCanonicos.push({
          grado: r.grado,
          nivel: r[campoNivel] || '(sin nivel)',
        });
      }
    });

    console.log(`\n📋 ${nombre} (${total} registros)`);
    console.log(`   Grados únicos:`);
    Array.from(gradosUnicos.entries())
      .sort()
      .forEach(([grado, count]) => {
        const esCanonico = GRADOS_CANONICOS.includes(grado) || grado === '(vacío)';
        const icono = esCanonico ? '✅' : '⚠️ ';
        console.log(`   ${icono} "${grado}": ${count}`);
      });

    if (noCanonicos.length > 0) {
      console.log(`   🚨 ${noCanonicos.length} registros NO canónicos`);
    }

    return {
      tabla: nombre,
      total,
      noCanonicos: noCanonicos.length,
      valoresNoCanonicos: Array.from(new Set(noCanonicos.map((n) => n.grado))),
    };
  } catch (error) {
    console.log(`\n📋 ${nombre}: ❌ Error (${(error as Error).message})`);
    return {
      tabla: nombre,
      total: 0,
      noCanonicos: 0,
      valoresNoCanonicos: [],
      error: true,
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 DIAGNÓSTICO COMPLETO DE TODAS LAS TABLAS');
  console.log('='.repeat(70));

  const resultados = await Promise.all([
    diagnosticarTabla('Estudiante', prisma.estudiante),
    diagnosticarTabla('Tarea', prisma.tarea),
    diagnosticarTabla('Aviso', prisma.aviso),
    diagnosticarTabla('Material', prisma.material),
    diagnosticarTabla('PlanEvaluacion', prisma.planEvaluacion),
    diagnosticarTabla('Nota', prisma.nota),
    diagnosticarTabla('Horario', prisma.horario),
    diagnosticarTabla('Salon', prisma.salon),
    diagnosticarTabla('Asistencia', prisma.asistencia),
  ]);

  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN');
  console.log('='.repeat(70));

  let totalNoCanonicos = 0;

  resultados.forEach((r) => {
    const status = r.error
      ? '❌ Error'
      : r.noCanonicos === 0
      ? '✅ OK'
      : `⚠️  ${r.noCanonicos} a normalizar`;

    console.log(
      `${r.tabla.padEnd(20)} | Total: ${String(r.total).padStart(4)} | ${status}`
    );

    if (r.valoresNoCanonicos.length > 0) {
      console.log(`   └─ Valores: ${r.valoresNoCanonicos.join(', ')}`);
    }

    totalNoCanonicos += r.noCanonicos;
  });

  console.log('\n' + '='.repeat(70));
  console.log(`📊 TOTAL DE REGISTROS A NORMALIZAR: ${totalNoCanonicos}`);
  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });