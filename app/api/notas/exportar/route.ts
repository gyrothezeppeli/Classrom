// app/api/notas/exportar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

// ============================================
// GET: Exportar notas a Excel con filtros
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const materia = searchParams.get('materia');
    const periodo = searchParams.get('periodo');

    // ✅ 1. Traer TODOS los estudiantes del curso (para que aparezcan aunque no tengan nota)
    const estudiantesWhere: any = {};
    if (nivel) estudiantesWhere.nivel = nivel;
    if (grado) estudiantesWhere.grado = grado;
    if (seccion) estudiantesWhere.seccion = seccion;

    const estudiantes = await prisma.estudiante.findMany({
      where: estudiantesWhere,
      include: {
        user: { select: { nombre: true, apellido: true } }
      },
      orderBy: [
        { user: { apellido: 'asc' } },
        { user: { nombre: 'asc' } }
      ]
    });

    // ✅ 2. Traer las notas que coinciden con los filtros
    const notasWhere: any = {};
    if (nivel) notasWhere.nivel = nivel;
    if (grado) notasWhere.grado = grado;
    if (seccion) notasWhere.seccion = seccion;
    if (materia) notasWhere.materia = materia;
    if (periodo) notasWhere.periodo = periodo;

    const notas = await prisma.nota.findMany({ where: notasWhere });

    // ✅ 3. Mapa de notas por estudiante + materia + periodo
    const notasMap = new Map<string, number>();
    notas.forEach((n) => {
      notasMap.set(`${n.estudianteId}|${n.materia}|${n.periodo}`, n.nota);
    });

    // ✅ 4. Si hay materia + periodo, mostrar solo esa columna
    // Si no, mostrar todas las materias con notas
    const materiasUnicas = materia
      ? [materia]
      : [...new Set(notas.map((n) => n.materia))].sort();

    const periodosUnicos = periodo
      ? [periodo]
      : [...new Set(notas.map((n) => n.periodo))].sort();

    // ✅ 5. Construir filas
    const filas = estudiantes.map((e) => {
      const fila: any = {
        'Cédula': e.cedulaIdentidad || '',
        'Apellidos': e.user.apellido || '',
        'Nombres': e.user.nombre,
        'Nivel': e.nivel,
        'Grado': e.grado,
        'Sección': e.seccion,
      };

      if (materia) {
        // Solo una materia
        if (periodo) {
          // Solo un período
          const clave = `${e.id}|${materia}|${periodo}`;
          fila[`${materia} (${periodo})`] = notasMap.get(clave) ?? '';
        } else {
          // Todos los períodos
          periodosUnicos.forEach((p) => {
            const clave = `${e.id}|${materia}|${p}`;
            fila[`${materia} (${p})`] = notasMap.get(clave) ?? '';
          });
          // Calcular promedio
          const valores = periodosUnicos
            .map((p) => notasMap.get(`${e.id}|${materia}|${p}`))
            .filter((v): v is number => v !== undefined);
          if (valores.length > 0) {
            fila['Promedio'] = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
          }
        }
      } else {
        // Todas las materias del período filtrado
        if (periodo) {
          materiasUnicas.forEach((mat) => {
            const clave = `${e.id}|${mat}|${periodo}`;
            fila[`${mat}`] = notasMap.get(clave) ?? '';
          });
        } else {
          // Todas las combinaciones materia + período
          materiasUnicas.forEach((mat) => {
            periodosUnicos.forEach((p) => {
              const clave = `${e.id}|${mat}|${p}`;
              fila[`${mat} (${p})`] = notasMap.get(clave) ?? '';
            });
          });
        }
      }

      return fila;
    });

    // ✅ 6. Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();

    // Ajustar ancho de columnas
    const colWidths = Object.keys(filas[0] || {}).map((key) => ({
      wch: Math.max(key.length + 2, 12),
    }));
    worksheet['!cols'] = colWidths;

    // ✅ Congelar la primera fila (header)
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas');

    // ✅ Generar el buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    // ✅ Nombre del archivo
    const partes = ['Notas'];
    if (nivel) partes.push(nivel);
    if (grado) partes.push(grado);
    if (seccion) partes.push(`Seccion-${seccion}`);
    if (materia) partes.push(materia);
    if (periodo) partes.push(periodo.replace(/\s+/g, '-'));

    const nombreArchivo = `${partes.join('_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar notas:', error);
    return NextResponse.json(
      { error: 'Error al exportar notas' },
      { status: 500 }
    );
  }
}