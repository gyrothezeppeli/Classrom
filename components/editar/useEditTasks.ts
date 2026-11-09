"use client";

import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';
import { MATERIAS_POR_NIVEL, TIPOS_CONTENIDO } from '@/lib/editar/constants';
import { extraerNumeroGrado, normalizarGradoParaBD, parsearSecciones, serializarSecciones } from '@/lib/editar/utils';
import type { DocenteInfo, Estudiante, FilaPlan, PlanApi, PlanEvaluacion } from '@/lib/editar/types';

export function useEditTasks() {

  const { data: session, status } = useSession();
  const router = useRouter();
  const [docenteInfo, setDocenteInfo] = useState<DocenteInfo | null>(null);
  const [cargandoDocente, setCargandoDocente] = useState(true);

  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>('media');
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>('');
  const [seccionesSeleccionadas, setSeccionesSeleccionadas] = useState<string[]>([]);
  const [tipoContenido, setTipoContenido] = useState<string>('tarea');
  const [materia, setMateria] = useState<string>('');
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [contenido, setContenido] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    materia: '',
    recursos: '',
    objetivos: '',
    criterios: '',
    ponderacion: '',
    enlaces: ''
  });

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [filtroEstudianteNivel, setFiltroEstudianteNivel] = useState<string>('');
  const [filtroEstudianteGrado, setFiltroEstudianteGrado] = useState<string>('');
  const [filtroEstudianteSeccion, setFiltroEstudianteSeccion] = useState<string>('');

  const [mostrarGestorPlan, setMostrarGestorPlan] = useState(false);
  const [modoEdicionPlan, setModoEdicionPlan] = useState(false);
  const [planEditandoId, setPlanEditandoId] = useState<string | null>(null);
  const [vistaPreviaPlan, setVistaPreviaPlan] = useState<PlanEvaluacion | null>(null);

  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [planActual, setPlanActual] = useState<PlanEvaluacion>({
    id: '',
    areaFormacion: '',
    docente: '',
    ano: '',
    secciones: '',
    filas: [],
    nivel: '',
    grado: '',
    materia: ''
  });

  const [planSeccionesSeleccionadas, setPlanSeccionesSeleccionadas] = useState<string[]>([]);
  const [planesGuardados, setPlanesGuardados] = useState<PlanEvaluacion[]>([]);
  const [errorPlanes, setErrorPlanes] = useState<string | null>(null);

  const niveles = [
    { id: 'inicial', nombre: 'Educación Inicial' },
    { id: 'primaria', nombre: 'Educación Primaria' },
    { id: 'media', nombre: 'Educación Media' }
  ];

  // ✅ CORRECCIÓN #1: gradosPorNivel con IDs canónicos
  const gradosPorNivel = {
    inicial: [
      { id: 'Pre-Kinder', nombre: '1er Nivel', secciones: [] as string[] },
      { id: 'Kinder', nombre: '2do Nivel', secciones: [] as string[] },
      { id: 'Preparatorio', nombre: '3er Nivel', secciones: [] as string[] }
    ],
    primaria: [
      { id: '1er Grado', nombre: '1er Grado', secciones: ['A', 'B', 'C', 'D'] },
      { id: '2do Grado', nombre: '2do Grado', secciones: ['A', 'B', 'C', 'D'] },
      { id: '3er Grado', nombre: '3er Grado', secciones: ['A', 'B', 'C'] },
      { id: '4to Grado', nombre: '4to Grado', secciones: ['A', 'B', 'C'] },
      { id: '5to Grado', nombre: '5to Grado', secciones: ['A', 'B', 'C'] },
      { id: '6to Grado', nombre: '6to Grado', secciones: ['A', 'B', 'C'] }
    ],
    media: [
      { id: '1er Año', nombre: '1er Año', secciones: ['A', 'B', 'C', 'D'] },
      { id: '2do Año', nombre: '2do Año', secciones: ['A', 'B', 'C', 'D'] },
      { id: '3er Año', nombre: '3er Año', secciones: ['A', 'B', 'C'] },
      { id: '4to Año', nombre: '4to Año', secciones: ['A', 'B', 'C'] },
      { id: '5to Año', nombre: '5to Año', secciones: ['A', 'B'] }
    ]
  };

  const gradosActuales = gradosPorNivel[nivelSeleccionado as keyof typeof gradosPorNivel] || [];
  const materiasDisponibles = MATERIAS_POR_NIVEL[nivelSeleccionado as keyof typeof MATERIAS_POR_NIVEL] || [];

  const seccionesActuales = gradoSeleccionado
    ? gradosActuales.find(g => g.id === gradoSeleccionado)?.secciones || []
    : [];

  // ============ GESTIÓN DE SESIÓN ============

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const cargarDocente = async () => {
      if (status !== 'authenticated' || !session?.user) return;

      try {
        setCargandoDocente(true);
        const response = await fetch('/api/docentes?me=true');

        if (response.ok) {
          const data = await response.json();
          setDocenteInfo({
            id: data.id,
            nombres: data.nombre || data.nombres || '',
            apellidos: data.apellido || data.apellidos || '',
            email: data.email || '',
            especialidad: data.especialidad || ''
          });
        } else if (response.status === 404) {
          try {
            const createResponse = await fetch('/api/docentes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                especialidad: 'General',
              }),
            });

            if (createResponse.ok) {
              const data = await createResponse.json();
              setDocenteInfo({
                id: data.docente.id,
                nombres: data.docente.nombre || '',
                apellidos: data.docente.apellido || '',
                email: data.docente.email || '',
                especialidad: data.docente.especialidad || ''
              });
              window.location.reload();
            }
          } catch (error) {
            console.error('Error:', error);
          }
        }
      } catch (error) {
        console.error('Error al cargar docente:', error);
      } finally {
        setCargandoDocente(false);
      }
    };

    cargarDocente();
  }, [session, status]);

  const cargarPlanes = useCallback(async () => {
    try {
      setCargandoPlanes(true);
      setErrorPlanes(null);
      let url = '/api/planes-evaluacion';

      if (docenteInfo?.id) {
        url += `?docenteId=${docenteInfo.id}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const responseText = await response.text();
        let message = response.statusText || 'No se pudieron cargar los planes';

        if (responseText) {
          try {
            const errorData = JSON.parse(responseText) as { error?: string };
            message = errorData.error || responseText;
          } catch {
            message = responseText;
          }
        }

        throw new Error(message);
      }

      const data = await response.json() as PlanApi[];
      const planesNormalizados = data.map((plan) => ({
        id: plan.id || '',
        areaFormacion: plan.areaFormacion || plan.titulo || 'Sin título',
        docente: plan.docente || 'Docente',
        docenteId: plan.docenteId,
        ano: plan.ano || plan.grado || '1er Año',
        secciones: plan.secciones || plan.seccion || 'A',
        filas: Array.isArray(plan.filas)
          ? plan.filas.map((f) => ({
              id: f.id || '',
              fechaInicio: f.fechaInicio || f.fecha || '',
              fechaFin: f.fechaFin || '',
              referenteTeorico: f.referenteTeorico || '',
              estrategiaEvaluacion: f.estrategiaEvaluacion || '',
              tecnicaEvaluacion: f.tecnicaEvaluacion || '',
              instrumentoEvaluacion: f.instrumentoEvaluacion || '',
              ptos: f.ptos || '',
              porcentaje: f.porcentaje || '',
              criteriosEvaluacion: Array.isArray(f.criteriosEvaluacion)
                ? f.criteriosEvaluacion.filter(Boolean)
                : (f.criteriosEvaluacion ? [f.criteriosEvaluacion] : [''])
            }))
          : [],
        nivel: plan.nivel || '',
        grado: plan.grado || '',
        materia: plan.materia || '',
        createdAt: plan.createdAt,
      }));

      setPlanesGuardados(planesNormalizados);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      setErrorPlanes(
        error instanceof Error ? error.message : 'No se pudieron cargar los planes'
      );
    } finally {
      setCargandoPlanes(false);
    }
  }, [docenteInfo]);

  useEffect(() => {
    let active = true;
    if (status === 'authenticated' && docenteInfo?.id) {
      void Promise.resolve().then(() => {
        if (active) return cargarPlanes();
      });
    }
    return () => {
      active = false;
    };
  }, [status, docenteInfo?.id, cargarPlanes]);

  // ============ CARGA DE ESTUDIANTES ============
  const cargarEstudiantes = useCallback(async () => {
    try {
      setCargandoEstudiantes(true);
      const response = await fetch('/api/estudiantes');
      if (response.ok) {
        const data = await response.json();
        setEstudiantes(data);
      } else {
        sileo.error({ title: 'Error al cargar estudiantes' });
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setCargandoEstudiantes(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (tipoContenido === 'lista_estudiantes' && estudiantes.length === 0) {
      void Promise.resolve().then(() => {
        if (active) return cargarEstudiantes();
      });
    }
    return () => {
      active = false;
    };
  }, [tipoContenido, estudiantes.length, cargarEstudiantes]);

  // ✅ CORRECCIÓN #6: gradoCoincide reescrita con extracción de número
  const gradoCoincide = (gradoEstudiante: string, filtroGradoId: string): boolean => {
    if (!gradoEstudiante || !filtroGradoId) return false;

    const numEstudiante = extraerNumeroGrado(gradoEstudiante);
    const numFiltro = extraerNumeroGrado(filtroGradoId);

    if (!numEstudiante || !numFiltro) return false;

    return numEstudiante === numFiltro;
  };

  const estudiantesFiltrados = (() => {
    let filtrados = estudiantes;

    if (busquedaEstudiante.trim()) {
      const term = busquedaEstudiante.toLowerCase().trim();
      filtrados = filtrados.filter(
        (e) =>
          e.nombres.toLowerCase().includes(term) ||
          e.apellidos.toLowerCase().includes(term) ||
          `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term) ||
          e.cedulaIdentidad.toLowerCase().includes(term)
      );
    }

    if (filtroEstudianteNivel) {
      filtrados = filtrados.filter((e) => e.nivel === filtroEstudianteNivel);
    }

    if (filtroEstudianteGrado) {
      filtrados = filtrados.filter((e) =>
        gradoCoincide(e.grado, filtroEstudianteGrado)
      );
    }

    if (filtroEstudianteSeccion) {
      filtrados = filtrados.filter((e) => e.seccion === filtroEstudianteSeccion);
    }

    return filtrados;
  })();

  const limpiarFiltrosEstudiantes = () => {
    setBusquedaEstudiante('');
    setFiltroEstudianteNivel('');
    setFiltroEstudianteGrado('');
    setFiltroEstudianteSeccion('');
  };

  // ============ FIN CARGA DE ESTUDIANTES ============

  // ✅ CORRECCIÓN #5: planesFiltrados con comparación tolerante
  const planesFiltrados = planesGuardados.filter(plan => {
    let coincide = true;

    if (!plan) return false;

    if (nivelSeleccionado && plan.nivel !== nivelSeleccionado) coincide = false;

    if (gradoSeleccionado) {
      const numPlan = extraerNumeroGrado(plan.grado);
      const numFiltro = extraerNumeroGrado(gradoSeleccionado);
      if (numPlan !== numFiltro) coincide = false;
    }

    if (seccionesSeleccionadas.length > 0) {
      const seccionesPlan = parsearSecciones(plan.secciones || plan.seccion || '');
      const hayCoincidencia = seccionesSeleccionadas.some(s => seccionesPlan.includes(s));
      if (!hayCoincidencia) coincide = false;
    }

    return coincide;
  });

  const handleNivelChange = (nivelId: string) => {
    setNivelSeleccionado(nivelId);
    setGradoSeleccionado('');
    setSeccionesSeleccionadas([]);
    setMateria('');
    setVistaPreviaPlan(null);
  };

  const toggleSeccion = (seccion: string) => {
    setSeccionesSeleccionadas(prev => {
      if (prev.includes(seccion)) {
        return prev.filter(s => s !== seccion);
      }
      return [...prev, seccion];
    });
  };

  const seleccionarTodasLasSecciones = () => {
    setSeccionesSeleccionadas([...seccionesActuales]);
  };

  const limpiarSecciones = () => {
    setSeccionesSeleccionadas([]);
  };

  // ✅ CORRECCIÓN #3: Normalizar grado antes de enviar a la API
  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gradoSeleccionado) {
      sileo.warning({ title: 'Datos incompletos', description: 'Por favor seleccione un grado/año' });
      return;
    }

    if (nivelSeleccionado !== 'inicial' && seccionesSeleccionadas.length === 0) {
      sileo.warning({ title: 'Datos incompletos', description: 'Por favor seleccione al menos una sección' });
      return;
    }

    if (!materia) {
      sileo.warning({ title: 'Datos incompletos', description: 'Por favor seleccione una materia' });
      return;
    }

    if (!contenido.titulo) {
      sileo.warning({ title: 'Datos incompletos', description: 'Por favor ingrese un título' });
      return;
    }

    if (!docenteInfo?.id) {
      sileo.error({ title: 'Error', description: 'No se encontró información del docente. Recargue la página.' });
      return;
    }

    const nivelNombre = niveles.find(n => n.id === nivelSeleccionado)?.nombre;
    const gradoNombre = gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre;
    const tipoNombre = TIPOS_CONTENIDO.find(t => t.id === tipoContenido)?.nombre;

    try {
      const fechaFinal = contenido.fecha || new Date().toISOString().split('T')[0];
      const seccionesString = seccionesSeleccionadas.length > 0
        ? serializarSecciones(seccionesSeleccionadas)
        : 'Única';

      // ✅ NORMALIZAR GRADO a valor canónico
      const gradoNormalizado = normalizarGradoParaBD(gradoSeleccionado, nivelSeleccionado);

      let endpoint = '/api/tareas';
      let payload: Record<string, unknown> = {};

      if (tipoContenido === 'aviso') {
        endpoint = '/api/avisos';
        payload = {
          titulo: contenido.titulo.trim(),
          descripcion: contenido.descripcion || '',
          fecha: fechaFinal,
          nivel: nivelSeleccionado,
          grado: gradoNormalizado,  // ✅ Canónico
          seccion: seccionesString,
          materia,
          docenteId: docenteInfo.id,
        };
      } else if (tipoContenido === 'material') {
        endpoint = '/api/materiales';
        payload = {
          titulo: contenido.titulo.trim(),
          descripcion: contenido.descripcion || '',
          enlace: contenido.enlaces || '',
          fecha: fechaFinal,
          nivel: nivelSeleccionado,
          grado: gradoNormalizado,  // ✅ Canónico
          seccion: seccionesString,
          materia,
          docenteId: docenteInfo.id,
        };
      } else {
        endpoint = '/api/tareas';
        payload = {
          titulo: contenido.titulo.trim(),
          descripcion: contenido.descripcion || '',
          fechaEntrega: fechaFinal,
          recursos: contenido.recursos || '',
          objetivos: contenido.objetivos || '',
          ponderacion: contenido.ponderacion || '',
          nivel: nivelSeleccionado,
          grado: gradoNormalizado,  // ✅ Canónico
          seccion: seccionesString,
          materia,
          docenteId: docenteInfo.id,
        };
      }

      console.log(`Enviando a ${endpoint}:`, payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        sileo.error({
          title: 'Error al publicar',
          description: errorData.error || response.statusText,
        });
        return;
      }

      const data = await response.json();

      const seccionesTexto = seccionesSeleccionadas.length > 1
        ? `${seccionesSeleccionadas.length} secciones (${seccionesSeleccionadas.join(', ')})`
        : `Sección ${seccionesSeleccionadas[0] || 'Única'}`;

      sileo.success({
        title: `${tipoNombre} publicado exitosamente`,
        description: `${nivelNombre} • ${gradoNombre} • ${seccionesTexto} • ${materia} • Asignado a ${data.estudiantesAsignados || 0} estudiantes`,
      });

      setContenido({
        titulo: '',
        descripcion: '',
        fecha: '',
        materia: '',
        recursos: '',
        objetivos: '',
        criterios: '',
        ponderacion: '',
        enlaces: ''
      });
      setMateria('');
    } catch (error) {
      console.error('Error al publicar:', error);
      sileo.error({
        title: 'Error de conexión',
        description: 'No se pudo publicar el contenido',
      });
    }
  };

  const agregarFila = () => {
    const nuevaFila: FilaPlan = {
      id: `fila-${Date.now()}`,
      fechaInicio: '',
      fechaFin: '',
      referenteTeorico: '',
      estrategiaEvaluacion: '',
      tecnicaEvaluacion: '',
      instrumentoEvaluacion: '',
      ptos: '',
      porcentaje: '',
      criteriosEvaluacion: ['']
    };
    setPlanActual({
      ...planActual,
      filas: [...planActual.filas, nuevaFila]
    });
  };

  const eliminarFila = (id: string) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.filter(fila => fila.id !== id)
    });
  };

  const actualizarFila = (id: string, campo: keyof FilaPlan, valor: string) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.map(fila =>
        fila.id === id ? { ...fila, [campo]: valor } : fila
      )
    });
  };

  const agregarCriterio = (filaId: string) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.map(fila =>
        fila.id === filaId
          ? { ...fila, criteriosEvaluacion: [...fila.criteriosEvaluacion, ''] }
          : fila
      )
    });
  };

  const actualizarCriterio = (filaId: string, index: number, valor: string) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.map(fila =>
        fila.id === filaId
          ? {
              ...fila,
              criteriosEvaluacion: fila.criteriosEvaluacion.map((c, i) =>
                i === index ? valor : c
              )
            }
          : fila
      )
    });
  };

  const eliminarCriterio = (filaId: string, index: number) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.map(fila =>
        fila.id === filaId
          ? {
              ...fila,
              criteriosEvaluacion: fila.criteriosEvaluacion.filter((_, i) => i !== index)
            }
          : fila
      )
    });
  };

  const guardarPlan = async () => {
    if (!planActual.areaFormacion || !planActual.docente || !planActual.ano) {
      sileo.warning({ title: 'Datos incompletos', description: 'Complete los campos del encabezado del plan' });
      return;
    }

    if (!gradoSeleccionado) {
      sileo.warning({ title: 'Datos incompletos', description: 'Seleccione un grado/año antes de guardar el plan' });
      return;
    }

    if (nivelSeleccionado !== 'inicial' && planSeccionesSeleccionadas.length === 0) {
      sileo.warning({ title: 'Datos incompletos', description: 'Seleccione al menos una sección' });
      return;
    }

    if (planActual.filas.length === 0) {
      sileo.warning({ title: 'Datos incompletos', description: 'Agregue al menos una fila al plan' });
      return;
    }

    try {
      if (!session?.user) {
        sileo.error({ title: 'Sesión requerida', description: 'Debes iniciar sesión como docente' });
        return;
      }

      if (!docenteInfo?.id) {
        const response = await fetch('/api/docentes?me=true');
        if (response.ok) {
          const data = await response.json();

          setDocenteInfo({
            id: data.id,
            nombres: data.nombre || data.nombres || '',
            apellidos: data.apellido || data.apellidos || '',
            email: data.email || '',
            especialidad: data.especialidad || ''
          });

          setTimeout(() => {
            guardarPlanConDocente(data.id);
          }, 100);
          return;
        } else {
          sileo.error({ title: 'Error', description: 'No se encontró información del docente' });
          return;
        }
      }

      await guardarPlanConDocente(docenteInfo.id);

    } catch (error) {
      console.error('Error al guardar plan:', error);
      sileo.error({
        title: 'Error al guardar el plan',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  // ✅ CORRECCIÓN #4: Normalizar grado antes de guardar plan
  const guardarPlanConDocente = async (docenteId: string) => {
    try {
      if (!docenteId) {
        sileo.error({ title: 'Error', description: 'No se encontró el ID del docente' });
        return;
      }

      const seccionesString = planSeccionesSeleccionadas.length > 0
        ? serializarSecciones(planSeccionesSeleccionadas)
        : 'Única';

      // ✅ NORMALIZAR GRADO a valor canónico
      const gradoNormalizado = normalizarGradoParaBD(
        gradoSeleccionado || planActual.ano,
        nivelSeleccionado
      );

      const planData = {
        titulo: planActual.areaFormacion.trim() || 'Plan de Evaluación',
        descripcion: `Plan de evaluación de ${planActual.areaFormacion}`,
        nivel: nivelSeleccionado || 'media',
        grado: gradoNormalizado,  // ✅ Canónico
        seccion: seccionesString,
        materia: (materia || planActual.materia || planActual.areaFormacion || '').trim(),
        docenteId: docenteId,
        filas: planActual.filas || [],
      };

      let url = '/api/planes-evaluacion';
      let method = 'POST';

      if (modoEdicionPlan && planEditandoId) {
        url = `/api/planes-evaluacion/${planEditandoId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          sileo.error({ title: 'Error', description: errorJson.error || errorText });
        } catch {
          sileo.error({ title: 'Error', description: errorText });
        }
        return;
      }

      await response.json();
      sileo.success({ title: modoEdicionPlan ? 'Plan actualizado' : 'Plan creado' });

      await cargarPlanes();

      setMostrarGestorPlan(false);
      setModoEdicionPlan(false);
      setPlanEditandoId(null);
      setVistaPreviaPlan(null);
      setPlanSeccionesSeleccionadas([]);
      setPlanActual({
        id: '',
        areaFormacion: '',
        docente: '',
        ano: '',
        secciones: '',
        filas: [],
        nivel: '',
        grado: '',
        materia: ''
      });

    } catch (error) {
      console.error('Error en guardarPlanConDocente:', error);
      sileo.error({
        title: 'Error al guardar el plan',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  const editarPlan = (plan: PlanEvaluacion) => {
    setPlanActual({
      ...plan,
      filas: Array.isArray(plan.filas) ? plan.filas : []
    });
    setPlanSeccionesSeleccionadas(parsearSecciones(plan.secciones));
    setModoEdicionPlan(true);
    setPlanEditandoId(plan.id);
    setMostrarGestorPlan(true);
    setVistaPreviaPlan(null);
  };

  const verPlan = (plan: PlanEvaluacion) => {
    setVistaPreviaPlan({
      ...plan,
      filas: Array.isArray(plan.filas) ? plan.filas : []
    });
    setMostrarGestorPlan(false);
  };

  const cerrarVistaPrevia = () => {
    setVistaPreviaPlan(null);
  };

  const nuevoPlan = () => {
    const gradoPorDefecto = gradoSeleccionado || (gradosActuales.length > 0 ? gradosActuales[0].id : '');
    const seccionesPorDefecto = nivelSeleccionado === 'inicial'
      ? []
      : (seccionesSeleccionadas.length > 0 ? seccionesSeleccionadas : ['A']);

    const nombreDocente = session?.user?.name ||
      docenteInfo?.nombres ||
      docenteInfo?.user?.nombre ||
      'Docente';

    setPlanActual({
      id: '',
      areaFormacion: '',
      docente: nombreDocente,
      ano: gradoPorDefecto,
      secciones: serializarSecciones(seccionesPorDefecto),
      filas: [],
      nivel: nivelSeleccionado,
      grado: gradoPorDefecto,
      materia: materia || ''
    });

    if (gradoPorDefecto) setGradoSeleccionado(gradoPorDefecto);
    setPlanSeccionesSeleccionadas(seccionesPorDefecto);

    setModoEdicionPlan(false);
    setPlanEditandoId(null);
    setMostrarGestorPlan(true);
    setVistaPreviaPlan(null);
  };

  const eliminarPlan = (id: string) => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Eliminar plan?',
      descripcion: 'Esta acción no se puede deshacer',
      onConfirm: async () => {
        setConfirmacion(null);
        try {
          const response = await fetch(`/api/planes-evaluacion/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            sileo.success({ title: 'Plan eliminado exitosamente' });
            await cargarPlanes();
            if (vistaPreviaPlan?.id === id) {
              setVistaPreviaPlan(null);
            }
          } else {
            const error = await response.text();
            sileo.error({ title: 'Error', description: error });
          }
        } catch (error) {
          console.error('Error al eliminar:', error);
          sileo.error({ title: 'Error al eliminar el plan' });
        }
      },
    });
  };

  const exportarAPDF = async (plan: PlanEvaluacion) => {
    try {
      console.log('Iniciando exportación a PDF...');

      const filas = Array.isArray(plan.filas) ? plan.filas : [];

      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(0, 187, 126);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN DE EVALUACIÓN', pageWidth / 2, 12, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('U.E Ciudad Cuatricentenaria', pageWidth / 2, 19, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      let yPos = 35;
      doc.setFont('helvetica', 'bold');
      doc.text('Área:', 14, yPos);
      doc.text('Docente:', 80, yPos);
      doc.text('Año:', 160, yPos);
      doc.text('Sección:', 220, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(plan.areaFormacion || 'N/A', 30, yPos);
      doc.text(plan.docente || 'N/A', 100, yPos);
      doc.text(plan.ano || 'N/A', 175, yPos);
      doc.text(plan.secciones || 'N/A', 240, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Nivel:', 14, yPos);
      doc.text('Grado:', 80, yPos);
      doc.text('Materia:', 160, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(plan.nivel || 'N/A', 30, yPos);
      doc.text(plan.grado || 'N/A', 100, yPos);
      doc.text(plan.materia || 'N/A', 175, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de exportación:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 65, yPos);

      const tableData = filas.map((fila, index) => [
        (index + 1).toString(),
        fila.fechaInicio || '-',
        fila.fechaFin || '-',
        fila.referenteTeorico || '-',
        fila.estrategiaEvaluacion || '-',
        fila.tecnicaEvaluacion || '-',
        fila.instrumentoEvaluacion || '-',
        fila.ptos || '-',
        fila.porcentaje || '-',
        Array.isArray(fila.criteriosEvaluacion)
          ? fila.criteriosEvaluacion.filter(Boolean).join('\n')
          : (fila.criteriosEvaluacion || '-')
      ]);

      const tableConfig = {
        startY: yPos + 5,
        head: [['#', 'INICIO', 'FIN', 'REFERENTE', 'ESTRATEGIA', 'TÉCNICA', 'INSTRUMENTO', 'PTOS', '%', 'CRITERIOS']],
        body: tableData.length > 0 ? tableData : [['-', '-', '-', '-', 'Sin filas registradas', '-', '-', '-', '-', '-']],
        theme: 'grid' as const,
        styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] as [number, number, number] },
        headStyles: {
          fillColor: [0, 187, 126] as [number, number, number],
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: 'bold' as const
        },
        alternateRowStyles: { fillColor: [240, 250, 245] as [number, number, number] },
        margin: { top: 10, right: 10, bottom: 15, left: 10 }
      };

      autoTable(doc, tableConfig);

      const finalY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 50;
      const totalPuntos = filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de filas: ${filas.length}`, 14, finalY + 8);
      doc.text(`Puntos totales: ${totalPuntos}`, 80, finalY + 8);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${totalPages} - Portal Docente`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      const nombreArchivo = `Plan_Evaluacion_${(plan.areaFormacion || 'plan').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(nombreArchivo);

      sileo.success({
        title: 'PDF exportado',
        description: nombreArchivo,
      });

    } catch (error) {
      console.error('Error al exportar PDF:', error);
      sileo.error({
        title: 'Error al exportar el PDF',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  // ============ RENDER CAMPOS ESPECÍFICOS ============

  return { session, status, router, docenteInfo, cargandoDocente, nivelSeleccionado, gradoSeleccionado, setGradoSeleccionado, seccionesSeleccionadas, setSeccionesSeleccionadas, tipoContenido, setTipoContenido, materia, setMateria, cargandoPlanes, contenido, setContenido, estudiantes, cargandoEstudiantes, busquedaEstudiante, setBusquedaEstudiante, filtroEstudianteNivel, setFiltroEstudianteNivel, filtroEstudianteGrado, setFiltroEstudianteGrado, filtroEstudianteSeccion, setFiltroEstudianteSeccion, mostrarGestorPlan, setMostrarGestorPlan, modoEdicionPlan, setModoEdicionPlan, setPlanEditandoId, vistaPreviaPlan, setVistaPreviaPlan, confirmacion, setConfirmacion, isMobile, planActual, setPlanActual, planSeccionesSeleccionadas, setPlanSeccionesSeleccionadas, errorPlanes, niveles, gradosPorNivel, gradosActuales, materiasDisponibles, seccionesActuales, cargarPlanes, estudiantesFiltrados, limpiarFiltrosEstudiantes, planesFiltrados, handleNivelChange, toggleSeccion, seleccionarTodasLasSecciones, limpiarSecciones, handlePublicar, agregarFila, eliminarFila, actualizarFila, agregarCriterio, actualizarCriterio, eliminarCriterio, guardarPlan, editarPlan, verPlan, cerrarVistaPrevia, nuevoPlan, eliminarPlan, exportarAPDF };
}
