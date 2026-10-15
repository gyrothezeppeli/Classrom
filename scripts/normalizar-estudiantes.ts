// scripts/normalizar-estudiantes.ts
import { PrismaClient } from '@prisma/client';

class StudentGradeNormalizer {
  private readonly map: Record<string, string>;

  constructor() {
    this.map = {

// ============================================
// Mapa completo: valor antiguo → valor canónico
// ============================================
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

  // Variantes sueltas (las problemáticas)
  '1ro': '1',   // ← Solo para detectar el número
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
  }

// ============================================
// Función principal: normaliza un grado según el nivel
// ============================================
  normalize(gradoOriginal: string, nivel: string): string {
    if (!gradoOriginal) return '';

    const nivelNorm = (nivel || '').toLowerCase().trim();
    const gradoLimpio = gradoOriginal.trim();

  // 1. Buscar el valor en el mapa (variantes exactas)
    const valorMapeado = this.map[gradoLimpio] || this.map[gradoLimpio.toLowerCase()];

    if (valorMapeado) {
    // Si el mapeo devuelve un número suelto (1-6), construir el grado canónico
      if (/^\d$/.test(valorMapeado)) {
        const num = parseInt(valorMapeado);
        const ordinales: Record<number, string> = {
          1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to',
        };
        const ordinal = ordinales[num];

        if (nivelNorm === 'inicial') {
          const nivelesInicial: Record<number, string> = {
            1: 'Pre-Kinder', 2: 'Kinder', 3: 'Preparatorio',
          };
          return nivelesInicial[num] || gradoLimpio;
        }

        const sufijo = nivelNorm === 'primaria' ? 'Grado' : 'Año';
        return `${ordinal} ${sufijo}`;
      }

      return valorMapeado;
    }

  // 2. Si no está en el mapa, intentar extraer el número y reconstruir
    const match = gradoLimpio.match(/\d/);
    if (match) {
      const num = parseInt(match[0]);
      const ordinales: Record<number, string> = {
        1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to',
      };
      const ordinal = ordinales[num];

      if (ordinal) {
        if (nivelNorm === 'inicial') {
          const nivelesInicial: Record<number, string> = {
            1: 'Pre-Kinder', 2: 'Kinder', 3: 'Preparatorio',
          };
          return nivelesInicial[num] || gradoLimpio;
        }

        const sufijo = nivelNorm === 'primaria' ? 'Grado' : 'Año';
        return `${ordinal} ${sufijo}`;
      }
    }

    return gradoLimpio;
  }
}

class StudentNormalizationJob {
  constructor(
    private readonly database: PrismaClient,
    private readonly gradeNormalizer: StudentGradeNormalizer
  ) {}

  async run(): Promise<void> {
  console.log('🔍 Iniciando normalización de estudiantes...\n');

  // 1. Obtener todos los estudiantes
  const estudiantes = await this.database.estudiante.findMany({
    include: {
      user: { select: { nombre: true, apellido: true } }
    }
  });

  console.log(`📊 Total de estudiantes en la BD: ${estudiantes.length}\n`);

  let actualizados = 0;
  let sinCambios = 0;
  const errores: string[] = [];

  // 2. Procesar cada estudiante
  for (const est of estudiantes) {
    const gradoOriginal = est.grado;
    const nivel = est.nivel;

    const gradoNormalizado = this.gradeNormalizer.normalize(gradoOriginal, nivel);

    if (gradoNormalizado !== gradoOriginal) {
      try {
        await this.database.estudiante.update({
          where: { id: est.id },
          data: { grado: gradoNormalizado }
        });

        const nombre = `${est.user?.nombre || ''} ${est.user?.apellido || ''}`.trim();
        console.log(`✅ ${nombre} (${nivel}): "${gradoOriginal}" → "${gradoNormalizado}"`);
        actualizados++;
      } catch (error) {
        const msg = `❌ Error actualizando ${est.id}: ${error}`;
        console.error(msg);
        errores.push(msg);
      }
    } else {
      sinCambios++;
    }
  }

  // 3. Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE NORMALIZACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Actualizados:  ${actualizados}`);
  console.log(`⏭️  Sin cambios:   ${sinCambios}`);
  console.log(`❌ Errores:       ${errores.length}`);
  console.log(`📊 Total:         ${estudiantes.length}`);

  if (errores.length > 0) {
    console.log('\n⚠️  Errores encontrados:');
    errores.forEach((e) => console.log(`   ${e}`));
  }

  console.log('\n🎉 Normalización completada.\n');
  }
}

const prisma = new PrismaClient();

new StudentNormalizationJob(prisma, new StudentGradeNormalizer())
  .run()
  .catch((e) => {
    console.error('❌ Error general:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });