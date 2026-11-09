"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { sileo } from 'sileo';
import { COLOR_MATERIA_ACTIVA, MATERIAS_BASE } from '@/lib/dashboard-estudiante/constants';
import { fetchDashboardList, normalizarTexto, coincideGrado, coincideMateria, coincideNivel, coincideSeccion } from '@/lib/dashboard-estudiante/utils';
import type { Aviso, AvisoApi, Estudiante, FiltroMaterias, Horario, MateriaConPlanes, Material, MaterialApi, PlanApi, PlanEvaluacion, Tarea, TareaApi } from '@/lib/dashboard-estudiante/types';

export function useEstudianteDashboard() {

  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedMateria, setSelectedMateria] = useState<MateriaConPlanes | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanEvaluacion | null>(null);
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [materias, setMaterias] = useState<MateriaConPlanes[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<FiltroMaterias>('todas');

  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  const [datosAbiertos, setDatosAbiertos] = useState(false);

  const [mostrarTodasEntregas, setMostrarTodasEntregas] = useState(false);
  const [mostrarTodasMaterias, setMostrarTodasMaterias] = useState(false);

  const actualizarBusqueda = (value: string) => {
    setBusqueda(value);
    setMostrarTodasMaterias(false);
  };
  const actualizarFiltroActivo = (value: FiltroMaterias) => {
    setFiltroActivo(value);
    setMostrarTodasMaterias(false);
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const cargarDatosCompletos = async () => {
      if (status === 'loading') return;

      if (!session?.user) {
        router.push('/');
        return;
      }

      const userId = session.user.id;

      if (!userId) {
        setError('Error: No se pudo identificar al usuario.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/estudiantes/usuario/${userId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('No tienes un perfil de estudiante registrado.');
          } else {
            setError('Error al cargar los datos del estudiante.');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        const estudianteData: Estudiante = {
          id: data.id || '',
          nombres: data.nombres || data.nombre || 'Estudiante',
          apellidos: data.apellidos || data.apellido || '',
          grado: data.grado || '',
          seccion: data.seccion || '',
          cedulaIdentidad: data.cedulaIdentidad || data.cedula || '',
          correoElectronico: data.correoElectronico || data.email || '',
          nivel: data.nivel || '',
          telefono: data.telefono || ''
        };

        setEstudiante(estudianteData);

        // ✅ LOG DE DIAGNÓSTICO 1: Datos del estudiante
        console.log('👤 [DASHBOARD] Estudiante:', {
          id: estudianteData.id,
          nivel: estudianteData.nivel,
          grado: estudianteData.grado,
          seccion: estudianteData.seccion,
        });

        const estudianteId = encodeURIComponent(data.id);
        const parametrosHorario = new URLSearchParams({
          nivel: estudianteData.nivel.trim(),
          grado: estudianteData.grado.trim(),
          seccion: estudianteData.seccion.trim(),
        });
        const cargaHorarios = estudianteData.nivel.trim() && estudianteData.grado.trim() && estudianteData.seccion.trim()
          ? fetchDashboardList<Horario>(`/api/horarios?${parametrosHorario}`, 'horarios')
          : Promise.resolve([] as Horario[]);
        const [rawPlanes, rawTareas, rawAvisos, rawMateriales, rawHorarios] = await Promise.all([
          fetchDashboardList<PlanApi>(`/api/estudiantes/planes?estudianteId=${estudianteId}`, 'planes'),
          fetchDashboardList<TareaApi>(`/api/tareas?estudianteId=${estudianteId}`, 'tareas'),
          fetchDashboardList<AvisoApi>(`/api/avisos?estudianteId=${estudianteId}`, 'avisos'),
          fetchDashboardList<MaterialApi>(`/api/materiales?estudianteId=${estudianteId}`, 'materiales'),
          cargaHorarios,
        ]);
        if (rawPlanes === null) {
          throw new Error('No se pudieron cargar los planes del estudiante');
        }
        if (rawHorarios === null) {
          setErrorHorarios('No se pudo cargar tu horario. Inténtalo de nuevo más tarde.');
          setHorarios([]);
        } else {
          const horariosFiltrados = rawHorarios.filter((horario) =>
            coincideNivel(horario.nivel, estudianteData.nivel) &&
            coincideGrado(horario.grado, estudianteData.grado) &&
            coincideSeccion(horario.seccion, estudianteData.seccion)
          );
          setHorarios(horariosFiltrados);
          setErrorHorarios(null);
        }

        const planesData: PlanEvaluacion[] = rawPlanes.map((plan) => ({
          id: plan.id || '',
          areaFormacion: plan.areaFormacion || plan.titulo || 'Sin título',
          docente: plan.docente || 'Docente no asignado',
          docenteId: plan.docenteId || '',
          ano: plan.ano || plan.grado || 'N/A',
          secciones: plan.secciones || plan.seccion || 'A',
          nivel: plan.nivel || '',
          grado: plan.grado || '',
          materia: plan.materia || '',
          filas: Array.isArray(plan.filas) ? plan.filas.map((fila, index) => ({
            id: fila.id || `fila-${index}`,
            fecha: fila.fecha || '',
            referenteTeorico: fila.referenteTeorico || '',
            estrategiaEvaluacion: fila.estrategiaEvaluacion || '',
            tecnicaEvaluacion: fila.tecnicaEvaluacion || '',
            instrumentoEvaluacion: fila.instrumentoEvaluacion || '',
            ptos: fila.ptos || '',
            porcentaje: fila.porcentaje || '',
            criteriosEvaluacion: typeof fila.criteriosEvaluacion === 'string'
              ? fila.criteriosEvaluacion
              : Array.isArray(fila.criteriosEvaluacion)
                ? fila.criteriosEvaluacion.join(', ')
                : '',
          })) : [],
          visto: plan.visto || false,
          fechaVisto: plan.fechaVisto || null,
          createdAt: plan.createdAt || new Date().toISOString()
        }));

        const tareasData: Tarea[] = (rawTareas ?? []).map((t) => ({
          id: t.id || '',
          titulo: t.titulo || '',
          descripcion: t.descripcion || '',
          fechaEntrega: t.fechaEntrega || '',
          estado: t.estado || 'pendiente',
          recursos: t.recursos || '',
          objetivos: t.objetivos || '',
          ponderacion: t.ponderacion || '',
          materia: t.materia || '',
          docente: t.docente || 'Docente',
          nivel: t.nivel || '',
          grado: t.grado || '',
          seccion: t.seccion || '',
          visto: t.visto || false,
          entregado: t.entregado || false,
          calificacion: t.calificacion ?? null,
          createdAt: t.createdAt || new Date().toISOString()
        }));

        const avisosData: Aviso[] = (rawAvisos ?? []).map((a) => ({
          id: a.id || '',
          titulo: a.titulo || '',
          descripcion: a.descripcion || '',
          fecha: a.fecha || '',
          materia: a.materia || '',
          docente: a.docente || 'Docente',
          nivel: a.nivel || '',
          grado: a.grado || '',
          seccion: a.seccion || '',
          visto: a.visto || false,
          fechaVisto: a.fechaVisto || null,
          createdAt: a.createdAt || new Date().toISOString()
        }));

        const materialesData: Material[] = (rawMateriales ?? []).map((m) => ({
          id: m.id || '',
          titulo: m.titulo || '',
          descripcion: m.descripcion || '',
          enlace: m.enlace || '',
          fecha: m.fecha || '',
          materia: m.materia || '',
          docente: m.docente || 'Docente',
          nivel: m.nivel || '',
          grado: m.grado || '',
          seccion: m.seccion || '',
          visto: m.visto || false,
          fechaVisto: m.fechaVisto || null,
          createdAt: m.createdAt || new Date().toISOString()
        }));

        const docentesMap: Record<string, string> = {};
        const docentesIds = [...new Set(planesData.map(p => p.docenteId).filter(Boolean))];

        if (docentesIds.length > 0) {
          const params = new URLSearchParams({ ids: docentesIds.join(',') });
          const docentes = await fetchDashboardList<{
            id: string;
            nombres?: string;
            apellidos?: string;
            email?: string;
          }>(`/api/docentes?${params}`, 'docentes');
          for (const docente of docentes ?? []) {
            const nombreCompleto = `${docente.nombres || ''} ${docente.apellidos || ''}`.trim();
            docentesMap[docente.id] = nombreCompleto || docente.email || 'Docente';
          }
        }


        const materiasConstruidas: MateriaConPlanes[] = MATERIAS_BASE.map((base) => {
          // ✅ CORREGIDO: filtros flexibles de materia + nivel/grado/sección
          const planesMateria = planesData.filter((plan: PlanEvaluacion) => {
            const materiaOk = coincideMateria(plan.materia, base.nombre) ||
                              coincideMateria(plan.areaFormacion, base.nombre);
            if (!materiaOk) return false;
            if (!coincideNivel(plan.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(plan.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(plan.secciones || '', estudianteData.seccion)) return false;
            return true;
          });

          const tareasMateria = tareasData.filter((t) => {
            const materiaOk = coincideMateria(t.materia, base.nombre);
            if (!materiaOk) return false;
            if (!coincideNivel(t.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(t.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(t.seccion || '', estudianteData.seccion)) return false;
            return true;
          });

          const avisosMateria = avisosData.filter((a) => {
            const materiaOk = coincideMateria(a.materia, base.nombre);
            if (!materiaOk) return false;
            if (!coincideNivel(a.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(a.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(a.seccion || '', estudianteData.seccion)) return false;
            return true;
          });

          const materialesMateria = materialesData.filter((m) => {
            const materiaOk = coincideMateria(m.materia, base.nombre);
            if (!materiaOk) return false;
            if (!coincideNivel(m.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(m.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(m.seccion || '', estudianteData.seccion)) return false;
            return true;
          });

          let profesor = 'Sin profesor asignado';
          const planConDocente = planesMateria.find(p => p.docenteId && docentesMap[p.docenteId]);
          if (planConDocente && planConDocente.docenteId) {
            profesor = docentesMap[planConDocente.docenteId] || 'Sin profesor asignado';
          } else if (tareasMateria.length > 0) {
            profesor = tareasMateria[0].docente;
          } else if (avisosMateria.length > 0) {
            profesor = avisosMateria[0].docente;
          } else if (materialesMateria.length > 0) {
            profesor = materialesMateria[0].docente;
          }

          // ✅ LOG DE DIAGNÓSTICO 3: Materias con planes
          if (planesMateria.length > 0) {
            console.log(`✅ [DASHBOARD] "${base.nombre}" → ${planesMateria.length} plan(es)`);
          }

          return {
            ...base,
            profesor: profesor,
            planEvaluacion: planesMateria,
            tareasPendientes: tareasMateria,
            avisos: avisosMateria,
            materiales: materialesMateria
          };
        });

        // ✅ LOG DE DIAGNÓSTICO 4: Resumen final
        const totalPlanesAsignados = materiasConstruidas.reduce(
          (sum, m) => sum + m.planEvaluacion.length, 0
        );
        console.log(`📊 [DASHBOARD] Total planes asignados a materias: ${totalPlanesAsignados}`);
        console.log('📚 [DASHBOARD] Materias con contenido:',
          materiasConstruidas
            .filter(m => m.planEvaluacion.length > 0 || m.tareasPendientes.length > 0)
            .map(m => `${m.nombre}: ${m.planEvaluacion.length} planes, ${m.tareasPendientes.length} tareas`)
        );

        setMaterias(materiasConstruidas);
        setError(null);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosCompletos();
  }, [session, status, router]);

  const handleLogout = () => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Cerrar sesión?',
      descripcion: 'Se cerrará tu sesión actual',
      onConfirm: async () => {
        setConfirmacion(null);
        await signOut({ redirect: false });
        router.push('/');
      },
    });
  };

  const descargarHorarioPDF = async () => {
    if (errorHorarios) {
      sileo.error({ title: 'No se pudo cargar tu horario' });
      return;
    }
    if (horarios.length === 0 || !estudiante) {
      sileo.warning({ title: 'Aún no tienes un horario asignado' });
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const diasBase = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
      const clavesDiasBase = new Set(diasBase.map(normalizarTexto));
      const diasHorarioPDF = [
        ...diasBase,
        ...diasHorario
          .map((dia) => dia.toLocaleUpperCase('es-ES'))
          .filter((dia) => !clavesDiasBase.has(normalizarTexto(dia))),
      ];
      const horasBase = Array.from({ length: 10 }, (_, index) =>
        `${String(index + 7).padStart(2, '0')}:00`
      );
      const horasFilas = [...new Set([...horasBase, ...horarios.map((horario) => horario.horaInicio)])]
        .sort((a, b) => a.localeCompare(b));
      const marginX = 12;
      const tableWidth = pageWidth - marginX * 2;
      const firstColumnWidth = 24;
      const otherColumnWidth = (tableWidth - firstColumnWidth) / diasHorarioPDF.length;
      const colWidths = [firstColumnWidth, ...Array(diasHorarioPDF.length).fill(otherColumnWidth)];
      const startY = 30;
      const rowHeightHeader = 9;
      const rowHeightData = Math.min(20, (pageHeight - startY - 24 - rowHeightHeader) / horasFilas.length);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HORARIO DE CLASES', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const anioAcademico = horarios[0].anioAcademico || '2024-2025';
      doc.text(
        `${estudiante.nivel} | ${estudiante.grado} | Sección ${estudiante.seccion} | Año: ${anioAcademico}`,
        pageWidth / 2,
        22,
        { align: 'center' }
      );

      const dibujarCelda = (
        texto: string,
        x: number,
        y: number,
        ancho: number,
        alto: number,
        encabezado = false
      ) => {
        if (encabezado) {
          doc.setFillColor(0, 187, 126);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(x, y, ancho, alto, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.rect(x, y, ancho, alto, 'S');
        if (encabezado) {
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setTextColor(0, 0, 0);
        }
        doc.setFontSize(encabezado ? 8 : 7);
        doc.setFont('helvetica', encabezado ? 'bold' : 'normal');
        doc.text(texto, x + ancho / 2, y + alto / 2 + 1, {
          align: 'center',
          maxWidth: ancho - 2,
        });
      };

      let x = marginX;
      dibujarCelda('HORAS', x, startY, colWidths[0], rowHeightHeader, true);
      x += colWidths[0];
      diasHorarioPDF.forEach((dia, index) => {
        dibujarCelda(dia, x, startY, colWidths[index + 1], rowHeightHeader, true);
        x += colWidths[index + 1];
      });

      horasFilas.forEach((hora, rowIndex) => {
        const y = startY + rowHeightHeader + rowIndex * rowHeightData;
        let currentX = marginX;
        dibujarCelda(hora, currentX, y, colWidths[0], rowHeightData);
        currentX += colWidths[0];

        diasHorarioPDF.forEach((dia, dayIndex) => {
          const bloque = horarios.find((horario) =>
            normalizarTexto(horario.diaSemana) === normalizarTexto(dia) &&
            horario.horaInicio === hora
          );
          const ancho = colWidths[dayIndex + 1];
          dibujarCelda('', currentX, y, ancho, rowHeightData);
          if (bloque) {
            const lineas = [
              bloque.materia,
              bloque.docente,
              bloque.aula ? `Aula: ${bloque.aula}` : '',
            ].filter(Boolean);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            const lineHeight = Math.min(3.5, (rowHeightData - 2) / lineas.length);
            const startTextY = y + (rowHeightData - lineas.length * lineHeight) / 2 + 2;
            lineas.forEach((linea, lineIndex) => {
              doc.text(doc.splitTextToSize(linea, ancho - 2), currentX + ancho / 2, startTextY + lineIndex * lineHeight, {
                align: 'center',
              });
            });
          }
          currentX += ancho;
        });
      });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );

      const nombreArchivo = `Horario_${normalizarTexto(estudiante.grado).replace(/\s+/g, '_')}_${estudiante.seccion}.pdf`;
      doc.save(nombreArchivo);
      sileo.success({ title: 'Horario descargado', description: nombreArchivo });
    } catch (error) {
      console.error('Error al exportar horario del estudiante:', error);
      sileo.error({ title: 'Error al exportar el horario en PDF' });
    }
  };

  const planesNoVistos = materias.reduce((sum, m) => sum + m.planEvaluacion.filter(p => !p.visto).length, 0);
  const materiasConPlanes = materias.filter(m => m.planEvaluacion.length > 0 || m.tareasPendientes.length > 0 || m.avisos.length > 0 || m.materiales.length > 0).length;
  const totalTareas = materias.reduce((sum, m) => sum + m.tareasPendientes.length, 0);
  const totalAvisos = materias.reduce((sum, m) => sum + m.avisos.length, 0);
  const totalMateriales = materias.reduce((sum, m) => sum + m.materiales.length, 0);

  const materiasFiltradas = useMemo(() => {
    let resultado = materias;

    if (busqueda.trim()) {
      const term = normalizarTexto(busqueda);
      resultado = resultado.filter(m =>
        normalizarTexto(m.nombre).includes(term) ||
        normalizarTexto(m.profesor).includes(term)
      );
    }

    switch (filtroActivo) {
      case 'novedades':
        resultado = resultado.filter(m =>
          m.planEvaluacion.length > 0 ||
          m.tareasPendientes.length > 0 ||
          m.avisos.length > 0 ||
          m.materiales.length > 0
        );
        break;
      case 'tareas':
        resultado = resultado.filter(m => m.tareasPendientes.length > 0);
        break;
      case 'planes_nuevos':
        resultado = resultado.filter(m => m.planEvaluacion.some(p => !p.visto));
        break;
      case 'todas':
      default:
        break;
    }

    return resultado;
  }, [materias, busqueda, filtroActivo]);

  const ordenDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const diasHorario = [...new Map(horarios.map((horario) => [
    normalizarTexto(horario.diaSemana),
    horario.diaSemana,
  ])).values()].sort((a, b) => {
    const ordenA = ordenDias.indexOf(normalizarTexto(a));
    const ordenB = ordenDias.indexOf(normalizarTexto(b));
    if (ordenA === -1 && ordenB === -1) return a.localeCompare(b);
    if (ordenA === -1) return 1;
    if (ordenB === -1) return -1;
    return ordenA - ordenB;
  });

  const proximasEntregas = useMemo(() => {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);

    const tareas = materias.flatMap(m =>
      m.tareasPendientes.map(t => ({
        ...t,
        colorMateria: COLOR_MATERIA_ACTIVA,
        nombreMateria: m.nombre
      }))
    );

    return tareas
      .filter(t => {
        if (!t.fechaEntrega) return false;
        const fecha = new Date(t.fechaEntrega);
        if (isNaN(fecha.getTime())) return false;
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() >= ahora.getTime();
      })
      .sort((a, b) => {
        const dateA = new Date(a.fechaEntrega).getTime();
        const dateB = new Date(b.fechaEntrega).getTime();
        return dateA - dateB;
      });
  }, [materias]);

  return {
    router,
    status,
    loading,
    error,
    estudiante,
    selectedMateria,
    setSelectedMateria,
    selectedPlan,
    setSelectedPlan,
    confirmacion,
    setConfirmacion,
    busqueda,
    filtroActivo,
    actualizarBusqueda,
    actualizarFiltroActivo,
    datosAbiertos,
    setDatosAbiertos,
    mostrarTodasEntregas,
    setMostrarTodasEntregas,
    mostrarTodasMaterias,
    setMostrarTodasMaterias,
    isMobile,
    handleLogout,
    descargarHorarioPDF,
    planesNoVistos,
    materiasConPlanes,
    totalTareas,
    totalAvisos,
    totalMateriales,
    materiasFiltradas,
    proximasEntregas,
  };
}
