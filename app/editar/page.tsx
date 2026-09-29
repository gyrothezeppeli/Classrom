// app/editar/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';

// ============ COMPONENTES PROPIOS ============
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ============ SHADCN UI ============
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Save,
  LogOut,
  BookOpen,
  Bell,
  FileText,
  ClipboardList,
  ArrowLeft,
  Users,
  Search,
  Check,
  CalendarCheck,
} from "lucide-react";

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  danger: '#ef4444'
};

const TIPOS_CONTENIDO = [
  { id: 'tarea', nombre: 'Tarea', icon: BookOpen },
  { id: 'aviso', nombre: 'Aviso', icon: Bell },
  { id: 'material', nombre: 'Material', icon: FileText },
  { id: 'plan_evaluacion', nombre: 'Plan de Evaluación', icon: ClipboardList },
  { id: 'lista_estudiantes', nombre: 'Lista de Estudiantes', icon: Users },
  { id: 'asistencia', nombre: 'Lista de Asistencia', icon: CalendarCheck }, // ✅ NUEVO
];

// ✅ MATERIAS ACTUALIZADAS
const MATERIAS_POR_NIVEL = {
  inicial: [
    'Lenguaje y Comunicación',
    'Matemáticas',
    'Expresión Artística',
    'Educación Física'
  ],
  primaria: [
    'Castellano',
    'Matemáticas',
    'Ciencias Sociales',
    'Ciencias Naturales',
    'Inglés',
    'Educación Artística',
    'Educación Física'
  ],
  media: [
    'Castellano',
    'Matemáticas',
    'Historia',
    'Geografía',
    'Biología',
    'Química',
    'Física',
    'Inglés',
    'G.H.C',
    'Ciencias de la Tierra',
    'Educación Física',
    'Arte y Patrimonio',
    'Informática'
  ]
};

const SECCIONES_DISPONIBLES = ['A', 'B', 'C', 'D', 'E'];

interface FilaPlan {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  referenteTeorico: string;
  estrategiaEvaluacion: string;
  tecnicaEvaluacion: string;
  instrumentoEvaluacion: string;
  ptos: string;
  porcentaje: string;
  criteriosEvaluacion: string[];
}

interface PlanEvaluacion {
  id: string;
  areaFormacion: string;
  docente: string;
  docenteId?: string;
  ano: string;
  secciones: string;
  filas: FilaPlan[];
  nivel: string;
  grado: string;
  materia: string;
  createdAt?: string;
}

interface DocenteInfo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  especialidad?: string;
  user?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  fechaNacimiento?: string;
  nivel: string;
  grado: string;
  seccion: string;
  numeroTelefonoCelular?: string;
  correoElectronico?: string;
}

// ✅ Utilidad: convierte "A,B,C" a ["A", "B", "C"]
const parsearSecciones = (secciones: string | string[] | null | undefined): string[] => {
  if (!secciones) return [];
  if (Array.isArray(secciones)) return secciones.filter(Boolean);
  return secciones.split(',').map(s => s.trim()).filter(Boolean);
};

// ✅ Utilidad: convierte ["A", "B"] a "A,B"
const serializarSecciones = (secciones: string[]): string => {
  return secciones.filter(Boolean).join(',');
};

const EditTasksPage: React.FC = () => {
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

  // ✅ Estados para la Lista de Estudiantes
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

  const niveles = [
    { id: 'inicial', nombre: 'Educación Inicial' },
    { id: 'primaria', nombre: 'Educación Primaria' },
    { id: 'media', nombre: 'Educación Media' }
  ];

  const gradosPorNivel = {
    inicial: [
      { id: '1er nivel', nombre: '1er Nivel', secciones: [] as string[] },
      { id: '2do nivel', nombre: '2do Nivel', secciones: [] as string[] },
      { id: '3er nivel', nombre: '3er Nivel', secciones: [] as string[] }
    ],
    primaria: [
      { id: '1ro', nombre: '1er Grado', secciones: ['A', 'B', 'C', 'D'] },
      { id: '2do', nombre: '2do Grado', secciones: ['A', 'B', 'C', 'D'] },
      { id: '3ro', nombre: '3er Grado', secciones: ['A', 'B', 'C'] },
      { id: '4to', nombre: '4to Grado', secciones: ['A', 'B', 'C'] },
      { id: '5to', nombre: '5to Grado', secciones: ['A', 'B', 'C'] },
      { id: '6to', nombre: '6to Grado', secciones: ['A', 'B', 'C'] }
    ],
    media: [
      { id: '1ro', nombre: '1er Año', secciones: ['A', 'B', 'C', 'D'] },
      { id: '2do', nombre: '2do Año', secciones: ['A', 'B', 'C', 'D'] },
      { id: '3ro', nombre: '3er Año', secciones: ['A', 'B', 'C'] },
      { id: '4to', nombre: '4to Año', secciones: ['A', 'B', 'C'] },
      { id: '5to', nombre: '5to Año', secciones: ['A', 'B'] }
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
          await crearDocenteAutomaticamente();
        }
      } catch (error) {
        console.error('Error al cargar docente:', error);
      } finally {
        setCargandoDocente(false);
      }
    };

    cargarDocente();
  }, [session, status]);

  const crearDocenteAutomaticamente = async () => {
    try {
      const response = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          especialidad: 'General',
        }),
      });

      if (response.ok) {
        const data = await response.json();
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
  };

  const cargarPlanes = async () => {
    try {
      setCargandoPlanes(true);
      let url = '/api/planes-evaluacion';

      if (docenteInfo?.id) {
        url += `?docenteId=${docenteInfo.id}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();

        const planesNormalizados = data.map((plan: any) => ({
          ...plan,
          secciones: plan.secciones || plan.seccion || 'A',
          areaFormacion: plan.areaFormacion || plan.titulo || 'Sin título',
          docente: plan.docente || 'Docente',
          ano: plan.ano || plan.grado || '1ro',
          filas: Array.isArray(plan.filas)
            ? plan.filas.map((f: any) => ({
                id: f.id || `fila-${Date.now()}-${Math.random()}`,
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
            : []
        }));

        setPlanesGuardados(planesNormalizados);
      } else {
        setPlanesGuardados([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setPlanesGuardados([]);
    } finally {
      setCargandoPlanes(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && docenteInfo?.id) {
      cargarPlanes();
    }
  }, [status, docenteInfo]);

  useEffect(() => {
    if (status === 'authenticated' && docenteInfo?.id) {
      cargarPlanes();
    }
  }, [nivelSeleccionado, gradoSeleccionado, seccionesSeleccionadas, docenteInfo]);

  // ============ CARGA DE ESTUDIANTES ============
  useEffect(() => {
    if (tipoContenido === 'lista_estudiantes' && estudiantes.length === 0) {
      cargarEstudiantes();
    }
  }, [tipoContenido]);

  const cargarEstudiantes = async () => {
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
  };

  const normalizarGrado = (grado: string): string => {
    if (!grado) return '';
    return grado
      .toLowerCase()
      .trim()
      .replace(/[°º]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^1ro\b/, '1er')
      .replace(/^2do\b/, '2do')
      .replace(/^3ro\b/, '3er')
      .replace(/^4to\b/, '4to')
      .replace(/^5to\b/, '5to')
      .replace(/^6to\b/, '6to');
  };

  const gradoCoincide = (gradoEstudiante: string, filtroGradoId: string, filtroNivel: string): boolean => {
    if (!gradoEstudiante || !filtroGradoId) return false;

    const gradoEst = normalizarGrado(gradoEstudiante);
    const idFiltro = normalizarGrado(filtroGradoId);

    const gradoObj = gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.find(
      (g) => g.id === filtroGradoId
    );
    const nombreFiltro = normalizarGrado(gradoObj?.nombre || '');

    return (
      gradoEst === idFiltro ||
      gradoEst === nombreFiltro ||
      gradoEst.includes(idFiltro) ||
      idFiltro.includes(gradoEst) ||
      gradoEst.includes(nombreFiltro) ||
      nombreFiltro.includes(gradoEst)
    );
  };

  const estudiantesFiltrados = useMemo(() => {
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
        gradoCoincide(e.grado, filtroEstudianteGrado, filtroEstudianteNivel)
      );
    }

    if (filtroEstudianteSeccion) {
      filtrados = filtrados.filter((e) => e.seccion === filtroEstudianteSeccion);
    }

    return filtrados;
  }, [estudiantes, busquedaEstudiante, filtroEstudianteNivel, filtroEstudianteGrado, filtroEstudianteSeccion]);

  const limpiarFiltrosEstudiantes = () => {
    setBusquedaEstudiante('');
    setFiltroEstudianteNivel('');
    setFiltroEstudianteGrado('');
    setFiltroEstudianteSeccion('');
  };

  // ============ FIN CARGA DE ESTUDIANTES ============

  const planesFiltrados = planesGuardados.filter(plan => {
    let coincide = true;

    if (!plan) return false;

    if (nivelSeleccionado && plan.nivel !== nivelSeleccionado) coincide = false;
    if (gradoSeleccionado && plan.grado !== gradoSeleccionado) coincide = false;

    if (seccionesSeleccionadas.length > 0) {
      const seccionesPlan = parsearSecciones(plan.secciones || (plan as any).seccion || '');
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

      let endpoint = '/api/tareas';
      let payload: any = {};

      if (tipoContenido === 'aviso') {
        endpoint = '/api/avisos';
        payload = {
          titulo: contenido.titulo.trim(),
          descripcion: contenido.descripcion || '',
          fecha: fechaFinal,
          nivel: nivelSeleccionado,
          grado: gradoSeleccionado,
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
          grado: gradoSeleccionado,
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
          grado: gradoSeleccionado,
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

  const guardarPlanConDocente = async (docenteId: string) => {
    try {
      if (!docenteId) {
        sileo.error({ title: 'Error', description: 'No se encontró el ID del docente' });
        return;
      }

      const seccionesString = planSeccionesSeleccionadas.length > 0
        ? serializarSecciones(planSeccionesSeleccionadas)
        : 'Única';

      const planData = {
        titulo: planActual.areaFormacion.trim() || 'Plan de Evaluación',
        descripcion: `Plan de evaluación de ${planActual.areaFormacion}`,
        nivel: nivelSeleccionado || 'media',
        grado: gradoSeleccionado || '1ro',
        seccion: seccionesString,
        materia: (materia || planActual.materia || planActual.areaFormacion || '').trim(),
        docenteId: docenteId,
        filas: planActual.filas || [],
      };

      let response;
      let url = '/api/planes-evaluacion';
      let method = 'POST';

      if (modoEdicionPlan && planEditandoId) {
        url = `/api/planes-evaluacion/${planEditandoId}`;
        method = 'PUT';
      }

      response = await fetch(url, {
        method: method,
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

      const jsPDFModule = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');

      const JsPDFClass = (jsPDFModule as any).default || (jsPDFModule as any).jsPDF;
      const autoTableFn = (autoTableModule as any).default || autoTableModule;

      const doc = new JsPDFClass({
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

      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, tableConfig);
      } else if ((doc as any).autoTable) {
        (doc as any).autoTable(tableConfig);
      }

      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
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
  const renderCamposEspecificos = () => {
    switch (tipoContenido) {
      case 'tarea':
        return (
          <>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Recursos / Material de apoyo
              </Label>
              <Input
                className="bg-black/40 border-white/10 text-white mt-2"
                placeholder="Ej: Libro páginas 45-50, Video explicativo..."
                value={contenido.recursos}
                onChange={(e) => setContenido({ ...contenido, recursos: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Objetivos de la tarea
              </Label>
              <Textarea
                className="bg-black/40 border-white/10 text-white mt-2 min-h-20"
                placeholder="Ej: Comprender los conceptos básicos de..."
                value={contenido.objetivos}
                onChange={(e) => setContenido({ ...contenido, objetivos: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-emerald-400 text-xs uppercase font-bold">
                  Fecha Límite
                </Label>
                <Input
                  type="date"
                  className="bg-black/40 border-white/10 text-white mt-2"
                  value={contenido.fecha}
                  onChange={(e) => setContenido({ ...contenido, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-emerald-400 text-xs uppercase font-bold">
                  Ponderación (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Ej: 15"
                  className="bg-black/40 border-white/10 text-white mt-2"
                  value={contenido.ponderacion}
                  onChange={(e) => setContenido({ ...contenido, ponderacion: e.target.value })}
                />
              </div>
            </div>
          </>
        );

      case 'aviso':
        return (
          <>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Mensaje del aviso <span className="text-gray-500 normal-case font-normal">(opcional)</span>
              </Label>
              <Textarea
                className="bg-black/40 border-white/10 text-white mt-2 min-h-30"
                placeholder="Escriba el mensaje que desea comunicar (opcional)..."
                value={contenido.descripcion}
                onChange={(e) => setContenido({ ...contenido, descripcion: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Fecha del aviso
              </Label>
              <Input
                type="date"
                className="bg-black/40 border-white/10 text-white mt-2"
                value={contenido.fecha}
                onChange={(e) => setContenido({ ...contenido, fecha: e.target.value })}
              />
            </div>
          </>
        );

      case 'material':
        return (
          <>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Descripción del material <span className="text-gray-500 normal-case font-normal">(opcional)</span>
              </Label>
              <Textarea
                className="bg-black/40 border-white/10 text-white mt-2 min-h-25"
                placeholder="Describa el material que se compartirá (opcional)..."
                value={contenido.descripcion}
                onChange={(e) => setContenido({ ...contenido, descripcion: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Enlace(s) de descarga
              </Label>
              <Input
                className="bg-black/40 border-white/10 text-white mt-2"
                placeholder="Ej: https://drive.google.com/..."
                value={contenido.enlaces}
                onChange={(e) => setContenido({ ...contenido, enlaces: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Fecha de publicación <span className="text-gray-500 normal-case font-normal">(opcional — hoy por defecto)</span>
              </Label>
              <Input
                type="date"
                className="bg-black/40 border-white/10 text-white mt-2"
                value={contenido.fecha}
                onChange={(e) => setContenido({ ...contenido, fecha: e.target.value })}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ============ RENDER SELECTOR DE SECCIONES (MÚLTIPLE) ============
  const renderSelectorSecciones = (
    seleccionadas: string[],
    onToggle: (s: string) => void,
    onSeleccionarTodas: () => void,
    onLimpiar: () => void
  ) => {
    if (nivelSeleccionado === 'inicial') return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-emerald-400 text-xs uppercase font-bold">
            Secciones *
          </Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSeleccionarTodas}
              className="text-[0.65rem] text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
            >
              Todas
            </button>
            {seleccionadas.length > 0 && (
              <button
                type="button"
                onClick={onLimpiar}
                className="text-[0.65rem] text-gray-400 hover:text-white underline-offset-2 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {seccionesActuales.map((seccion) => {
            const activa = seleccionadas.includes(seccion);
            return (
              <button
                key={seccion}
                type="button"
                onClick={() => onToggle(seccion)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition border flex items-center gap-1.5 ${
                  activa
                    ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                    : 'bg-black/30 text-white border-white/10 hover:bg-white/5'
                }`}
              >
                {activa && <Check className="w-3.5 h-3.5" />}
                {seccion}
              </button>
            );
          })}
        </div>
        {seleccionadas.length > 0 && (
          <p className="text-gray-400 text-xs mt-2">
            {seleccionadas.length} {seleccionadas.length === 1 ? 'sección seleccionada' : 'secciones seleccionadas'}: {seleccionadas.join(', ')}
          </p>
        )}
      </div>
    );
  };

  // ============ VISTA PREVIA ============
  const renderVistaPreviaPlan = () => {
    if (!vistaPreviaPlan) return null;

    const filas = Array.isArray(vistaPreviaPlan.filas) ? vistaPreviaPlan.filas : [];
    const totalPuntos = filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0);

    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-emerald-400 text-2xl">
            Vista Previa — Plan de Evaluación
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => exportarAPDF(vistaPreviaPlan)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <FileDown className="mr-2 h-4 w-4" /> Exportar a PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => editarPlan(vistaPreviaPlan)}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Pencil className="mr-2 h-4 w-4" /> Editar Plan
            </Button>
            <Button variant="destructive" onClick={cerrarVistaPrevia}>
              <X className="mr-2 h-4 w-4" /> Cerrar Vista Previa
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/30 p-5 rounded-xl border border-white/5">
            {[
              { label: "Área de Formación", value: vistaPreviaPlan.areaFormacion },
              { label: "Docente", value: vistaPreviaPlan.docente },
              { label: "Año", value: vistaPreviaPlan.ano },
              { label: "Secciones", value: vistaPreviaPlan.secciones },
            ].map((item) => (
              <div key={item.label}>
                <Label className="text-[0.65rem] uppercase text-emerald-400">
                  {item.label}
                </Label>
                <p className="text-white font-semibold mt-1">{item.value || "—"}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 overflow-auto">
            {filas.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Este plan no tiene filas registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                    {[
                      "FECHA INICIO",
                      "FECHA FIN",
                      "REFERENTE TEÓRICO-PRÁCTICO",
                      "ESTRATEGIA",
                      "TÉCNICA",
                      "INSTRUMENTO",
                      "PTOS",
                      "%",
                      "CRITERIOS",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((fila) => (
                    <TableRow key={fila.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-center text-white text-xs">
                        {fila.fechaInicio || "-"}
                      </TableCell>
                      <TableCell className="text-center text-white text-xs">
                        {fila.fechaFin || "-"}
                      </TableCell>
                      <TableCell className="text-white text-xs">{fila.referenteTeorico || "-"}</TableCell>
                      <TableCell className="text-white text-xs">{fila.estrategiaEvaluacion || "-"}</TableCell>
                      <TableCell className="text-white text-xs">{fila.tecnicaEvaluacion || "-"}</TableCell>
                      <TableCell className="text-white text-xs">{fila.instrumentoEvaluacion || "-"}</TableCell>
                      <TableCell className="text-center text-white text-xs">{fila.ptos || "-"}</TableCell>
                      <TableCell className="text-center text-white text-xs">{fila.porcentaje || "-"}</TableCell>
                      <TableCell className="text-white text-xs">
                        {Array.isArray(fila.criteriosEvaluacion) && fila.criteriosEvaluacion.filter(Boolean).length > 0 ? (
                          <ul className="list-disc list-inside m-0 p-0">
                            {fila.criteriosEvaluacion.filter(Boolean).map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-between items-center flex-wrap gap-3 text-gray-400 text-sm">
            <div className="flex gap-4">
              <span>
                Total de filas: <strong className="text-white">{filas.length}</strong>
              </span>
              <span>
                Puntos totales: <strong className="text-white">{totalPuntos}</strong>
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => eliminarPlan(vistaPreviaPlan.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============ FORMULARIO DE PLAN ============
  const renderPlanForm = () => {
    const gradoActual = gradosActuales.find((g) => g.id === planActual.ano);

    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-400 text-2xl">
            {modoEdicionPlan ? "Editar Plan de Evaluación" : "Nuevo Plan de Evaluación"}
          </CardTitle>
          <Button
            variant="destructive"
            onClick={() => {
              setMostrarGestorPlan(false);
              setModoEdicionPlan(false);
              setPlanEditandoId(null);
              setPlanSeccionesSeleccionadas([]);
            }}
          >
            <X className="mr-2 h-4 w-4" /> Cerrar Editor
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 bg-black/30 p-5 rounded-xl border border-white/5 grid-cols-1 md:grid-cols-3">
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Área de Formación
              </Label>
              <Select
                value={planActual.areaFormacion ?? ''}
                onValueChange={(v) => setPlanActual({ ...planActual, areaFormacion: v ?? '' })}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {materiasDisponibles.map((mat) => (
                    <SelectItem key={mat} value={mat}>
                      {mat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Docente</Label>
              <Input
                className="bg-black/40 border-white/10 text-white mt-2"
                placeholder="Nombre del docente"
                value={planActual.docente}
                onChange={(e) => setPlanActual({ ...planActual, docente: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Año</Label>
              <Select
                value={planActual.ano ?? ''}
                onValueChange={(v) => {
                  const valor = v ?? '';
                  setPlanActual({ ...planActual, ano: valor });
                  setGradoSeleccionado(valor);
                  setPlanSeccionesSeleccionadas([]);
                }}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {gradosActuales.map((grado) => (
                    <SelectItem key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-gray-400 text-xs mt-1">
                {gradoActual ? `Grado seleccionado: ${gradoActual.nombre}` : "Selecciona un grado/año"}
              </p>
            </div>
          </div>

          {nivelSeleccionado !== "inicial" && (
            <div className="bg-black/30 p-5 rounded-xl border border-white/5">
              {renderSelectorSecciones(
                planSeccionesSeleccionadas,
                (s) => {
                  setPlanSeccionesSeleccionadas(prev =>
                    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                  );
                },
                () => setPlanSeccionesSeleccionadas([...seccionesActuales]),
                () => setPlanSeccionesSeleccionadas([])
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/10 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                  {[
                    "FECHA INICIO",
                    "FECHA FIN",
                    "REFERENTE",
                    "ESTRATEGIA",
                    "TÉCNICA",
                    "INSTRUMENTO",
                    "PTOS",
                    "%",
                    "CRITERIOS",
                    "ACCIONES",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {planActual.filas.map((fila) => (
                  <TableRow key={fila.id} className="border-white/5">
                    <TableCell className="p-1">
                      <Input
                        type="date"
                        value={fila.fechaInicio}
                        onChange={(e) => actualizarFila(fila.id, 'fechaInicio', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-32"
                        placeholder="Inicio"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="date"
                        value={fila.fechaFin}
                        onChange={(e) => actualizarFila(fila.id, 'fechaFin', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-32"
                        placeholder="Fin"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="text"
                        value={fila.referenteTeorico}
                        onChange={(e) => actualizarFila(fila.id, 'referenteTeorico', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-20"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="text"
                        value={fila.estrategiaEvaluacion}
                        onChange={(e) => actualizarFila(fila.id, 'estrategiaEvaluacion', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-20"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="text"
                        value={fila.tecnicaEvaluacion}
                        onChange={(e) => actualizarFila(fila.id, 'tecnicaEvaluacion', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-20"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="text"
                        value={fila.instrumentoEvaluacion}
                        onChange={(e) => actualizarFila(fila.id, 'instrumentoEvaluacion', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-20"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="text"
                        value={fila.ptos}
                        onChange={(e) => actualizarFila(fila.id, 'ptos', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-16"
                      />
                    </TableCell>

                    <TableCell className="p-1">
                      <Input
                        type="text"
                        value={fila.porcentaje}
                        onChange={(e) => actualizarFila(fila.id, 'porcentaje', e.target.value)}
                        className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-16"
                      />
                    </TableCell>

                    <TableCell className="p-1 min-w-64">
                      <div className="flex flex-col gap-1.5">
                        {fila.criteriosEvaluacion.map((criterio, index) => (
                          <div key={index} className="flex gap-1 items-center">
                            <Input
                              type="text"
                              value={criterio}
                              onChange={(e) => actualizarCriterio(fila.id, index, e.target.value)}
                              placeholder={`Criterio ${index + 1}`}
                              className="bg-black/30 border-white/5 text-white text-xs h-8 flex-1"
                            />
                            {fila.criteriosEvaluacion.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => eliminarCriterio(fila.id, index)}
                                title="Eliminar criterio"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => agregarCriterio(fila.id)}
                          className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 h-7 text-[0.65rem] mt-1"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Agregar criterio
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="p-1 text-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => eliminarFila(fila.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={agregarFila}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Fila
            </Button>
            <Button
              onClick={guardarPlan}
              className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
            >
              <Save className="mr-2 h-4 w-4" />
              {modoEdicionPlan ? "ACTUALIZAR PLAN" : "GUARDAR PLAN"}
            </Button>
            {modoEdicionPlan && (
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmacion({
                    abierto: true,
                    titulo: '¿Cancelar edición?',
                    descripcion: 'Se perderán los cambios no guardados',
                    onConfirm: () => {
                      setConfirmacion(null);
                      setMostrarGestorPlan(false);
                      setModoEdicionPlan(false);
                      setPlanEditandoId(null);
                      setPlanSeccionesSeleccionadas([]);
                    },
                  });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>

          <Separator className="bg-white/10" />

          <div className="text-gray-400 text-sm">
            Total de filas: <strong className="text-white">{planActual.filas.length}</strong>
            {planActual.filas.length > 0 && (
              <span className="ml-4">
                Puntos totales:{" "}
                <strong className="text-white">
                  {planActual.filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0)}
                </strong>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============ LISTA DE PLANES ============
  const renderListaPlanes = () => (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setMostrarGestorPlan(false);
              setModoEdicionPlan(false);
              setPlanEditandoId(null);
              setVistaPreviaPlan(null);
              setTipoContenido('tarea');
            }}
            className="border-white/20 text-white hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-xl h-10 w-10 transition-all"
            title="Volver al editor"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-emerald-400 text-2xl">
            Mis Planes de Evaluación
          </CardTitle>
        </div>
        <Button
          onClick={nuevoPlan}
          className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Plan
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {cargandoPlanes ? (
          <div className="text-center py-12 text-gray-400">
            <p>Cargando planes...</p>
          </div>
        ) : planesFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No has creado planes de evaluación aún.</p>
            <p className="text-sm mt-2">
              Crea tu primer plan utilizando el botón "Crear Nuevo Plan".
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {planesFiltrados.map((plan) => {
              const filas = Array.isArray(plan.filas) ? plan.filas : [];
              return (
                <div
                  key={plan.id}
                  className="p-5 rounded-xl bg-black/30 border border-white/10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center hover:border-emerald-500/30 transition"
                >
                  <div>
                    <div className="font-bold text-lg text-emerald-400">
                      {plan.areaFormacion}
                    </div>
                    <div className="text-sm text-gray-400 mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        Año: {plan.ano}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        Secciones: {plan.secciones}
                      </Badge>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                        Filas: {filas.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportarAPDF(plan)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileDown className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verPlan(plan)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="mr-2 h-4 w-4" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editarPlan(plan)}
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminarPlan(plan.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-xs text-yellow-400 leading-relaxed m-0">
            <strong>Nota:</strong> Solo puedes ver, editar y eliminar los planes que tú has creado.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // ============ LISTA DE ESTUDIANTES ============
  const renderListaEstudiantes = () => {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setTipoContenido('tarea');
                limpiarFiltrosEstudiantes();
              }}
              className="border-white/20 text-white hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-xl h-10 w-10 transition-all"
              title="Volver al editor"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-emerald-400 text-2xl flex items-center gap-2">
              <Users className="w-6 h-6" />
              Lista de Estudiantes
            </CardTitle>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1.5 text-xs font-semibold">
            {estudiantesFiltrados.length} de {estudiantes.length} estudiantes
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, apellido o cédula..."
              value={busquedaEstudiante}
              onChange={(e) => setBusquedaEstudiante(e.target.value)}
              className="bg-black/30 border-white/10 text-white pl-12 pr-12 h-14 text-base"
            />
            {busquedaEstudiante && (
              <button
                onClick={() => setBusquedaEstudiante('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Select
              value={filtroEstudianteNivel || 'all'}
              onValueChange={(v) => {
                setFiltroEstudianteNivel(v === 'all' ? '' : (v ?? ''));
                setFiltroEstudianteGrado('');
              }}
            >
              <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {niveles.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filtroEstudianteGrado || 'all'}
              onValueChange={(v) => setFiltroEstudianteGrado(v === 'all' ? '' : (v ?? ''))}
              disabled={!filtroEstudianteNivel}
            >
              <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                <SelectValue placeholder="Todos los grados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grados</SelectItem>
                {filtroEstudianteNivel &&
                  gradosPorNivel[filtroEstudianteNivel as keyof typeof gradosPorNivel]?.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={filtroEstudianteSeccion || 'all'}
              onValueChange={(v) => setFiltroEstudianteSeccion(v === 'all' ? '' : (v ?? ''))}
            >
              <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                <SelectValue placeholder="Todas las secciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las secciones</SelectItem>
                {SECCIONES_DISPONIBLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    Sección {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(busquedaEstudiante || filtroEstudianteNivel || filtroEstudianteGrado || filtroEstudianteSeccion) && (
              <Button
                variant="outline"
                onClick={limpiarFiltrosEstudiantes}
                className="border-white/10 text-gray-400 hover:bg-white/5 hover:border-emerald-500/40 h-11"
              >
                <X className="w-4 h-4 mr-2" /> Limpiar filtros
              </Button>
            )}
          </div>

          <Separator className="bg-white/5" />

          {cargandoEstudiantes ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p>Cargando estudiantes...</p>
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
              <p className="text-lg">No se encontraron estudiantes</p>
              <p className="text-sm mt-2">
                {estudiantes.length === 0
                  ? 'No hay estudiantes registrados en el sistema'
                  : 'Prueba con otros filtros de búsqueda'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/20 hover:bg-black/20">
                    {['Cédula', 'Nombres', 'Apellidos', 'Nivel', 'Grado', 'Sección', 'Teléfono', 'Correo'].map((h) => (
                      <TableHead
                        key={h}
                        className="text-emerald-400 font-bold text-xs uppercase"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantesFiltrados.map((e) => (
                    <TableRow key={e.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <span className="font-mono font-semibold text-emerald-400">
                          {e.cedulaIdentidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">{e.nombres}</TableCell>
                      <TableCell className="text-white">{e.apellidos}</TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {niveles.find((n) => n.id === e.nivel)?.nombre || e.nivel}
                      </TableCell>
                      <TableCell className="text-white">{e.grado}</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          {e.seccion}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {e.numeroTelefonoCelular || '-'}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {e.correoElectronico || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleCerrarSesion = () => {
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

  if (status === 'loading' || cargandoDocente) {
    return (
      <div className="min-h-screen bg-[#1a2e26] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif", background: PALETTE.deepBg }}
    >
      <div
        className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
      />
      <div className="fixed inset-0 bg-[#0a1410]/50 z-0 pointer-events-none" />

      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-[8%] py-3 bg-[#1a2e26]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="text-emerald-400 font-extrabold tracking-widest text-xs">
          {vistaPreviaPlan
            ? 'VISTA PREVIA'
            : mostrarGestorPlan
            ? 'EDITOR DE PLAN'
            : tipoContenido === 'plan_evaluacion'
            ? 'GESTIÓN DE PLANES'
            : tipoContenido === 'lista_estudiantes'
            ? 'LISTA DE ESTUDIANTES'
            : tipoContenido === 'asistencia'
            ? 'ASISTENCIA'
            : 'EDITOR DE CONTENIDO'}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-[#081a14] font-bold text-sm">
              {docenteInfo?.nombres?.[0] || session?.user?.name?.[0] || 'D'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {docenteInfo?.nombres || session?.user?.name || 'Docente'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCerrarSesion}
            className="text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Salir</span>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-350 mx-auto px-4 sm:px-[8%] py-6">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
            {vistaPreviaPlan
              ? 'PLAN DE EVALUACIÓN'
              : mostrarGestorPlan
              ? 'EDITAR PLAN DE EVALUACIÓN'
              : tipoContenido === 'plan_evaluacion'
              ? 'GESTIÓN DE PLANES DE EVALUACIÓN'
              : tipoContenido === 'lista_estudiantes'
              ? 'LISTA DE ESTUDIANTES'
              : tipoContenido === 'asistencia'
              ? 'CONTROL DE ASISTENCIA'
              : 'GESTIÓN DE CONTENIDO'}
          </h1>
          <p className="text-white/60 text-base">
            {vistaPreviaPlan
              ? `Visualizando plan de ${vistaPreviaPlan.areaFormacion}`
              : mostrarGestorPlan
              ? modoEdicionPlan
                ? 'Editando plan de evaluación'
                : 'Creando nuevo plan de evaluación'
              : tipoContenido === 'plan_evaluacion'
              ? `Bienvenido ${docenteInfo?.nombres || 'Docente'}, gestiona tus planes de evaluación`
              : tipoContenido === 'lista_estudiantes'
              ? 'Consulta y filtra la lista completa de estudiantes'
              : tipoContenido === 'asistencia'
              ? 'Accede al módulo de control de asistencia'
              : 'Publica tareas, avisos y materiales para los estudiantes.'}
          </p>
        </header>

        {vistaPreviaPlan ? (
          renderVistaPreviaPlan()
        ) : mostrarGestorPlan ? (
          renderPlanForm()
        ) : tipoContenido === 'lista_estudiantes' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div>
              <Card className="bg-black/20 border-white/5 backdrop-blur">
                <CardContent className="p-5">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                    Tipo de Contenido
                  </h3>
                  <div className="space-y-2">
                    {TIPOS_CONTENIDO.map((tipo) => {
                      const IconComponent = tipo.icon;
                      return (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => {
                            if (tipo.id === 'asistencia') {
                              router.push('/asistencias');
                              return;
                            }
                            setTipoContenido(tipo.id);
                            limpiarFiltrosEstudiantes();
                          }}
                          className={`w-full flex items-center gap-3 text-left p-4 rounded-xl border transition ${
                            tipoContenido === tipo.id
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : 'border-white/10 bg-black/30 text-white hover:bg-white/5'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 shrink-0" />
                          <span className="font-bold text-sm">{tipo.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>{renderListaEstudiantes()}</div>
          </div>
        ) : tipoContenido === 'plan_evaluacion' ? (
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-[1fr_380px]'} gap-8`}>
            {isMobile && (
              <FiltrosPlanMovil
                niveles={niveles}
                nivelSeleccionado={nivelSeleccionado}
                onNivelChange={handleNivelChange}
                gradosActuales={gradosActuales}
                gradoSeleccionado={gradoSeleccionado}
                onGradoChange={(v) => {
                  setGradoSeleccionado(v);
                  setSeccionesSeleccionadas([]);
                }}
                seccionesActuales={seccionesActuales}
                seccionesSeleccionadas={seccionesSeleccionadas}
                onToggleSeccion={toggleSeccion}
                onSeleccionarTodas={seleccionarTodasLasSecciones}
                onLimpiarSecciones={limpiarSecciones}
              />
            )}

            <div className={isMobile ? 'order-2' : ''}>{renderListaPlanes()}</div>

            {!isMobile && (
              <div>
                <div className="flex flex-col gap-5">
                  <Card className="bg-black/20 border-white/5 backdrop-blur">
                    <CardContent className="p-5">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                        Filtros de Búsqueda
                      </h3>
                      <div className="space-y-2">
                        {niveles.map((nivel) => (
                          <button
                            key={nivel.id}
                            onClick={() => handleNivelChange(nivel.id)}
                            className={`w-full text-left p-4 rounded-xl border transition ${
                              nivelSeleccionado === nivel.id
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                                : 'border-white/10 bg-black/30 text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="font-bold text-sm">{nivel.nombre}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {gradosActuales.length > 0 && (
                    <Card className="bg-black/20 border-white/5 backdrop-blur">
                      <CardContent className="p-5">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                          Grado / Año
                        </h3>
                        <div className="space-y-2">
                          {gradosActuales.map((grado) => (
                            <button
                              key={grado.id}
                              onClick={() => {
                                setGradoSeleccionado(grado.id);
                                setSeccionesSeleccionadas([]);
                              }}
                              className={`w-full text-left p-3 rounded-lg border transition ${
                                gradoSeleccionado === grado.id
                                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                                  : 'border-white/10 bg-black/30 text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="font-semibold text-sm">{grado.nombre}</span>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {seccionesActuales.length > 0 && nivelSeleccionado !== 'inicial' && (
                    <Card className="bg-black/20 border-white/5 backdrop-blur">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xs font-bold text-emerald-400 uppercase">
                            Sección
                          </h3>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={seleccionarTodasLasSecciones}
                              className="text-[0.65rem] text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
                            >
                              Todas
                            </button>
                            {seccionesSeleccionadas.length > 0 && (
                              <button
                                type="button"
                                onClick={limpiarSecciones}
                                className="text-[0.65rem] text-gray-400 hover:text-white underline-offset-2 hover:underline"
                              >
                                Limpiar
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {seccionesActuales.map((seccion) => {
                            const activa = seccionesSeleccionadas.includes(seccion);
                            return (
                              <button
                                key={seccion}
                                onClick={() => toggleSeccion(seccion)}
                                className={`p-3 rounded-lg font-bold text-center transition border flex items-center justify-center gap-1 ${
                                  activa
                                    ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                                    : 'bg-black/30 text-white border-white/10 hover:bg-white/5'
                                }`}
                              >
                                {activa && <Check className="w-3.5 h-3.5" />}
                                {seccion}
                              </button>
                            );
                          })}
                        </div>
                        {seccionesSeleccionadas.length > 1 && (
                          <p className="text-[0.65rem] text-emerald-400 mt-3 font-semibold">
                            {seccionesSeleccionadas.length} secciones seleccionadas
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-[280px_1fr_340px]'} gap-6`}>
            {isMobile && (
              <FiltrosPublicacionMovil
                niveles={niveles}
                nivelSeleccionado={nivelSeleccionado}
                onNivelChange={handleNivelChange}
                gradosActuales={gradosActuales}
                gradoSeleccionado={gradoSeleccionado}
                onGradoChange={(v) => {
                  setGradoSeleccionado(v);
                  setSeccionesSeleccionadas([]);
                }}
                seccionesActuales={seccionesActuales}
                seccionesSeleccionadas={seccionesSeleccionadas}
                onToggleSeccion={toggleSeccion}
                onSeleccionarTodas={seleccionarTodasLasSecciones}
                onLimpiarSecciones={limpiarSecciones}
              />
            )}

            <div className={isMobile ? 'order-2' : ''}>
              <Card className="bg-black/20 border-white/5 backdrop-blur">
                <CardContent className="p-5">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                    Tipo de Contenido
                  </h3>
                  <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
                    {TIPOS_CONTENIDO.map((tipo) => {
                      const IconComponent = tipo.icon;
                      return (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => {
                            if (tipo.id === 'asistencia') {
                              router.push('/asistencia');
                              return;
                            }
                            setTipoContenido(tipo.id);
                            limpiarFiltrosEstudiantes();
                          }}
                          className={`w-full flex items-center gap-3 text-left p-4 rounded-xl border transition ${
                            tipoContenido === tipo.id
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : 'border-white/10 bg-black/30 text-white hover:bg-white/5'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 shrink-0" />
                          <span className="font-bold text-sm">{tipo.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className={`bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl ${isMobile ? 'order-3' : ''}`}>
              <CardContent className="p-6">
                <form onSubmit={handlePublicar} className="flex flex-col gap-5">
                  {tipoContenido !== 'plan_evaluacion' && (
                    <>
                      <div>
                        <Label className="text-emerald-400 text-xs uppercase font-bold">
                          Título del contenido
                        </Label>
                        <Input
                          className="bg-black/40 border-white/10 text-white mt-2"
                          placeholder="Ej: Análisis Literario"
                          value={contenido.titulo}
                          onChange={(e) => setContenido({ ...contenido, titulo: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-400 text-xs uppercase font-bold">
                          Materia
                        </Label>
                        <Select value={materia ?? ''} onValueChange={(v) => setMateria(v ?? '')}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                            <SelectValue placeholder="Seleccione una materia" />
                          </SelectTrigger>
                          <SelectContent>
                            {materiasDisponibles.map((mat) => (
                              <SelectItem key={mat} value={mat}>
                                {mat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {renderCamposEspecificos()}

                      <Button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black text-base uppercase shadow-lg shadow-emerald-500/30"
                      >
                        Publicar Contenido
                      </Button>
                    </>
                  )}

                  {tipoContenido === 'plan_evaluacion' && (
                    <div className="text-center p-8 bg-emerald-500/5 rounded-xl border border-dashed border-emerald-500/30">
                      <p className="text-gray-400 mb-5">
                        Gestiona planes de evaluación en formato de cuadrícula
                      </p>
                      <Button
                        onClick={nuevoPlan}
                        className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Plan
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {!isMobile && (
              <div className="flex flex-col gap-5">
                <Card className="bg-black/20 border-white/5 backdrop-blur">
                  <CardContent className="p-5">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                      Nivel de Publicación
                    </h3>
                    <div className="space-y-2">
                      {niveles.map((nivel) => (
                        <button
                          key={nivel.id}
                          onClick={() => handleNivelChange(nivel.id)}
                          className={`w-full text-left p-4 rounded-xl border transition ${
                            nivelSeleccionado === nivel.id
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : 'border-white/10 bg-black/30 text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="font-bold text-sm">{nivel.nombre}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {gradosActuales.length > 0 && (
                  <Card className="bg-black/20 border-white/5 backdrop-blur">
                    <CardContent className="p-5">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                        Grado / Año
                      </h3>
                      <div className="space-y-2">
                        {gradosActuales.map((grado) => (
                          <button
                            key={grado.id}
                            onClick={() => {
                              setGradoSeleccionado(grado.id);
                              setSeccionesSeleccionadas([]);
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition ${
                              gradoSeleccionado === grado.id
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                                : 'border-white/10 bg-black/30 text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="font-semibold text-sm">{grado.nombre}</span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {seccionesActuales.length > 0 && nivelSeleccionado !== 'inicial' && (
                  <Card className="bg-black/20 border-white/5 backdrop-blur">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase">
                          Sección
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={seleccionarTodasLasSecciones}
                            className="text-[0.65rem] text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
                          >
                            Todas
                          </button>
                          {seccionesSeleccionadas.length > 0 && (
                            <button
                              type="button"
                              onClick={limpiarSecciones}
                              className="text-[0.65rem] text-gray-400 hover:text-white underline-offset-2 hover:underline"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {seccionesActuales.map((seccion) => {
                          const activa = seccionesSeleccionadas.includes(seccion);
                          return (
                            <button
                              key={seccion}
                              onClick={() => toggleSeccion(seccion)}
                              className={`p-3 rounded-lg font-bold text-center transition border flex items-center justify-center gap-1 ${
                                activa
                                  ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                                  : 'bg-black/30 text-white border-white/10 hover:bg-white/5'
                              }`}
                            >
                              {activa && <Check className="w-3.5 h-3.5" />}
                              {seccion}
                            </button>
                          );
                        })}
                      </div>
                      {seccionesSeleccionadas.length > 1 && (
                        <p className="text-[0.65rem] text-emerald-400 mt-3 font-semibold">
                          {seccionesSeleccionadas.length} secciones seleccionadas
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {confirmacion?.abierto && (
        <ConfirmDialog
          abierto={confirmacion.abierto}
          titulo={confirmacion.titulo}
          descripcion={confirmacion.descripcion}
          onConfirm={confirmacion.onConfirm}
          onCancel={() => setConfirmacion(null)}
        />
      )}
    </div>
  );
};

// ============================================
// FiltrosPublicacionMovil (con selección múltiple)
// ============================================
const FiltrosPublicacionMovil: React.FC<{
  niveles: { id: string; nombre: string }[];
  nivelSeleccionado: string;
  onNivelChange: (id: string) => void;
  gradosActuales: { id: string; nombre: string }[];
  gradoSeleccionado: string;
  onGradoChange: (v: string) => void;
  seccionesActuales: string[];
  seccionesSeleccionadas: string[];
  onToggleSeccion: (s: string) => void;
  onSeleccionarTodas: () => void;
  onLimpiarSecciones: () => void;
}> = ({
  niveles,
  nivelSeleccionado,
  onNivelChange,
  gradosActuales,
  gradoSeleccionado,
  onGradoChange,
  seccionesActuales,
  seccionesSeleccionadas,
  onToggleSeccion,
  onSeleccionarTodas,
  onLimpiarSecciones,
}) => {
  const esInicial = nivelSeleccionado === 'inicial';

  return (
    <Card className="bg-black/30 border-white/10 backdrop-blur order-1">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider">
            Publicar en
          </span>
        </div>

        <div className={`grid gap-2 ${esInicial ? 'grid-cols-2' : 'grid-cols-2'}`}>
          <div>
            <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">
              Nivel
            </Label>
            <Select value={nivelSeleccionado} onValueChange={(v) => v && onNivelChange(v)}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-xs">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                {niveles.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.nombre.replace('Educación ', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">
              {esInicial ? 'Nivel' : 'Grado/Año'}
            </Label>
            <Select
              value={gradoSeleccionado || 'none'}
              onValueChange={(v) => v && v !== 'none' && onGradoChange(v)}
            >
              <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-xs">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Seleccionar
                </SelectItem>
                {gradosActuales.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!esInicial && seccionesActuales.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold">
                Secciones
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSeleccionarTodas}
                  className="text-[0.6rem] text-emerald-400 hover:text-emerald-300"
                >
                  Todas
                </button>
                {seccionesSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={onLimpiarSecciones}
                    className="text-[0.6rem] text-gray-400 hover:text-white"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {seccionesActuales.map((s) => {
                const activa = seccionesSeleccionadas.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onToggleSeccion(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border flex items-center gap-1 ${
                      activa
                        ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                        : 'bg-black/40 text-white border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {activa && <Check className="w-3 h-3" />}
                    {s}
                  </button>
                );
              })}
            </div>
            {seccionesSeleccionadas.length > 1 && (
              <p className="text-[0.6rem] text-emerald-400 mt-2 font-semibold">
                {seccionesSeleccionadas.length} secciones seleccionadas
              </p>
            )}
          </div>
        )}

        {(gradoSeleccionado || seccionesSeleccionadas.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
            {gradoSeleccionado && (
              <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                {niveles.find((n) => n.id === nivelSeleccionado)?.nombre.replace('Educación ', '')}
              </span>
            )}
            {gradoSeleccionado && (
              <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                {gradosActuales.find((g) => g.id === gradoSeleccionado)?.nombre}
              </span>
            )}
            {seccionesSeleccionadas.length > 0 && (
              <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Secc: {seccionesSeleccionadas.join(', ')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// FiltrosPlanMovil (con selección múltiple)
// ============================================
const FiltrosPlanMovil: React.FC<{
  niveles: { id: string; nombre: string }[];
  nivelSeleccionado: string;
  onNivelChange: (id: string) => void;
  gradosActuales: { id: string; nombre: string }[];
  gradoSeleccionado: string;
  onGradoChange: (v: string) => void;
  seccionesActuales: string[];
  seccionesSeleccionadas: string[];
  onToggleSeccion: (s: string) => void;
  onSeleccionarTodas: () => void;
  onLimpiarSecciones: () => void;
}> = ({
  niveles,
  nivelSeleccionado,
  onNivelChange,
  gradosActuales,
  gradoSeleccionado,
  onGradoChange,
  seccionesActuales,
  seccionesSeleccionadas,
  onToggleSeccion,
  onSeleccionarTodas,
  onLimpiarSecciones,
}) => {
  const esInicial = nivelSeleccionado === 'inicial';

  return (
    <Card className="bg-black/30 border-white/10 backdrop-blur order-1">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider">
            Filtrar planes
          </span>
        </div>

        <div className={`grid gap-2 ${esInicial ? 'grid-cols-2' : 'grid-cols-2'}`}>
          <div>
            <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">
              Nivel
            </Label>
            <Select value={nivelSeleccionado} onValueChange={(v) => v && onNivelChange(v)}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-xs">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                {niveles.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.nombre.replace('Educación ', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">
              {esInicial ? 'Nivel' : 'Grado/Año'}
            </Label>
            <Select
              value={gradoSeleccionado || 'none'}
              onValueChange={(v) => v && v !== 'none' && onGradoChange(v)}
            >
              <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-xs">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Seleccionar
                </SelectItem>
                {gradosActuales.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!esInicial && seccionesActuales.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold">
                Secciones
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSeleccionarTodas}
                  className="text-[0.6rem] text-emerald-400 hover:text-emerald-300"
                >
                  Todas
                </button>
                {seccionesSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={onLimpiarSecciones}
                    className="text-[0.6rem] text-gray-400 hover:text-white"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {seccionesActuales.map((s) => {
                const activa = seccionesSeleccionadas.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onToggleSeccion(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border flex items-center gap-1 ${
                      activa
                        ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                        : 'bg-black/40 text-white border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {activa && <Check className="w-3 h-3" />}
                    {s}
                  </button>
                );
              })}
            </div>
            {seccionesSeleccionadas.length > 1 && (
              <p className="text-[0.6rem] text-emerald-400 mt-2 font-semibold">
                {seccionesSeleccionadas.length} secciones seleccionadas
              </p>
            )}
          </div>
        )}

        {(gradoSeleccionado || seccionesSeleccionadas.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
            {gradoSeleccionado && (
              <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                {niveles.find((n) => n.id === nivelSeleccionado)?.nombre.replace('Educación ', '')}
              </span>
            )}
            {gradoSeleccionado && (
              <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                {gradosActuales.find((g) => g.id === gradoSeleccionado)?.nombre}
              </span>
            )}
            {seccionesSeleccionadas.length > 0 && (
              <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Secc: {seccionesSeleccionadas.join(', ')}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditTasksPage;