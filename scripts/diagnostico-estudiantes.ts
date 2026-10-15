// scripts/diagnostico-estudiantes.ts
import { PrismaClient } from '@prisma/client';

class StudentDiagnostics {
  constructor(private readonly database: PrismaClient) {}

  async run(): Promise<void> {
  console.log('='.repeat(60));
  console.log('🔍 DIAGNÓSTICO COMPLETO DE ESTUDIANTES');
  console.log('='.repeat(60));

  // 1. Info de la conexión (sin exponer la contraseña)
  const dbUrl = process.env.DATABASE_URL || '';
  const urlSinPassword = dbUrl.replace(/:[^:@]+@/, ':***@');
  console.log('\n📡 Conexión a BD:');
  console.log(`   ${urlSinPassword}`);
  console.log(`   Host: ${dbUrl.split('@')[1]?.split('/')[0] || 'desconocido'}`);

  // 2. Conteos generales
  const totalUsers = await this.database.user.count();
  const usersEstudiantes = await this.database.user.count({
    where: { role: 'ESTUDIANTE' }
  });
  const totalEstudiantes = await this.database.estudiante.count();
  const totalDocentes = await this.database.docente.count();

  console.log('\n📊 CONTEO POR TABLA:');
  console.log(`   Total Users:                    ${totalUsers}`);
  console.log(`   Users con rol ESTUDIANTE:       ${usersEstudiantes}`);
  console.log(`   Users con rol DOCENTE:          ${await this.database.user.count({ where: { role: 'DOCENTE' } })}`);
  console.log(`   Users con rol ADMIN:            ${await this.database.user.count({ where: { role: 'ADMIN' } })}`);
  console.log(`   Users con rol COORDINACION:     ${await this.database.user.count({ where: { role: 'COORDINACION' } })}`);
  console.log(`   Total en tabla Estudiante:      ${totalEstudiantes}`);
  console.log(`   Total en tabla Docente:         ${totalDocentes}`);

  // 3. Distribución por nivel/grado
  console.log('\n📚 DISTRIBUCIÓN DE ESTUDIANTES POR CURSO:');
  const estudiantes = await this.database.estudiante.findMany({
    select: {
      id: true,
      nivel: true,
      grado: true,
      seccion: true,
      user: {
        select: { nombre: true, apellido: true, email: true, role: true }
      }
    },
    orderBy: [
      { nivel: 'asc' },
      { grado: 'asc' },
      { seccion: 'asc' }
    ]
  });

  const agrupados: Record<string, number> = {};
  estudiantes.forEach((e) => {
    const key = `${e.nivel} | ${e.grado} | ${e.seccion}`;
    agrupados[key] = (agrupados[key] || 0) + 1;
  });

  Object.entries(agrupados)
    .sort()
    .forEach(([key, count]) => {
      console.log(`   ${key}: ${count} estudiante(s)`);
    });

  // 4. Estudiantes con grados NO canónicos (los que necesitan normalización)
  console.log('\n⚠️  ESTUDIANTES CON GRADOS NO CANÓNICOS:');
  const gradosCanonicos = [
    'Pre-Kinder', 'Kinder', 'Preparatorio',
    '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado',
    '1er Año', '2do Año', '3er Año', '4to Año', '5to Año'
  ];

  const noCanonicos = estudiantes.filter(
    (e) => e.grado && !gradosCanonicos.includes(e.grado)
  );

  if (noCanonicos.length === 0) {
    console.log('   ✅ Todos los grados son canónicos');
  } else {
    noCanonicos.forEach((e) => {
      console.log(`   - ${e.user?.nombre} ${e.user?.apellido}: "${e.grado}" (nivel: ${e.nivel})`);
    });
  }

  // 5. Usuarios con rol ESTUDIANTE sin perfil de Estudiante
  console.log('\n🚨 USUARIOS CON ROL ESTUDIANTE SIN PERFIL:');
  const usersSinPerfil = await this.database.user.findMany({
    where: {
      role: 'ESTUDIANTE',
      estudiante: null
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      createdAt: true
    }
  });

  if (usersSinPerfil.length === 0) {
    console.log('   ✅ Ninguno. Todos tienen perfil.');
  } else {
    console.log(`   ⚠️  ${usersSinPerfil.length} huérfanos encontrados:`);
    usersSinPerfil.forEach((u) => {
      console.log(`   - ${u.nombre} ${u.apellido} (${u.email})`);
    });
  }

  // 6. Estudiantes sin User (huérfanos al revés)
  console.log('\n🚨 ESTUDIANTES SIN USER VÁLIDO:');
  const estudiantesSinUser = estudiantes.filter(
    (e) => !e.user || e.user.role !== 'ESTUDIANTE'
  );

  if (estudiantesSinUser.length === 0) {
    console.log('   ✅ Todos tienen User válido.');
  } else {
    console.log(`   ⚠️  ${estudiantesSinUser.length} estudiantes sin User ESTUDIANTE:`);
    estudiantesSinUser.forEach((e) => {
      console.log(`   - ID: ${e.id} | User: ${e.user?.nombre} ${e.user?.apellido} | Role: ${e.user?.role}`);
    });
  }

  // 7. Listado COMPLETO de todos los estudiantes (para verificar)
  console.log('\n📋 LISTADO COMPLETO DE ESTUDIANTES EN LA BD:');
  console.log(`   (Total: ${estudiantes.length})`);
  estudiantes.forEach((e, i) => {
    console.log(`   ${String(i + 1).padStart(2)}. ${e.user?.nombre} ${e.user?.apellido} | ${e.nivel} ${e.grado} ${e.seccion}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnóstico completado');
  console.log('='.repeat(60));
  }
}

const prisma = new PrismaClient();

new StudentDiagnostics(prisma)
  .run()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });