// app/editar/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';

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
  { id: 'plan_evaluacion', nombre: 'Plan de Evaluación', icon: ClipboardList }
];

const MATERIAS_POR_NIVEL = {
  inicial: [
    'Lenguaje y Comunicación',
    'Matemáticas',
    'Expresión Artística',
    'Educación Física'
  ],
  primaria: [
    'Lengua Española',
    'Matemáticas',
    'Ciencias Sociales',
    'Ciencias Naturales',
    'Inglés',
    'Educación Artística',
    'Educación Física'
  ],
  media: [
    'Lengua Española',
    'Matemáticas',
    'Historia',
    'Geografía',
    'Biología',
    'Química',
    'Física',
    'Inglés',
    'Educación Física',
    'Arte',
    'Informática'
  ]
};

const SECCIONES_DISPONIBLES = ['A', 'B', 'C', 'D', 'E'];

interface FilaPlan {
  id: string;
  fecha: string;
  referenteTeorico: string;
  estrategiaEvaluacion: string;
  tecnicaEvaluacion: string;
  instrumentoEvaluacion: string;
  ptos: string;
  porcentaje: string;
  criteriosEvaluacion: string;
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

const EditTasksPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [docenteInfo, setDocenteInfo] = useState<DocenteInfo | null>(null);
  const [cargandoDocente, setCargandoDocente] = useState(true);

  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>('media');
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>('');
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

  const [mostrarGestorPlan, setMostrarGestorPlan] = useState(false);
  const [modoEdicionPlan, setModoEdicionPlan] = useState(false);
  const [planEditandoId, setPlanEditandoId] = useState<string | null>(null);
  const [vistaPreviaPlan, setVistaPreviaPlan] = useState<PlanEvaluacion | null>(null);

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
          filas: Array.isArray(plan.filas) ? plan.filas : []
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
  }, [nivelSeleccionado, gradoSeleccionado, seccionSeleccionada, docenteInfo]);

  const planesFiltrados = planesGuardados.filter(plan => {
    let coincide = true;

    if (!plan) return false;

    if (nivelSeleccionado && plan.nivel !== nivelSeleccionado) coincide = false;
    if (gradoSeleccionado && plan.grado !== gradoSeleccionado) coincide = false;

    if (seccionSeleccionada) {
      const seccionesPlan = plan.secciones || (plan as any).seccion || '';
      if (typeof seccionesPlan === 'string') {
        if (!seccionesPlan.includes(seccionSeleccionada)) coincide = false;
      } else if (Array.isArray(seccionesPlan)) {
        if (!seccionesPlan.includes(seccionSeleccionada)) coincide = false;
      } else {
        coincide = false;
      }
    }

    return coincide;
  });

  const handleNivelChange = (nivelId: string) => {
    setNivelSeleccionado(nivelId);
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setMateria('');
    setVistaPreviaPlan(null);
  };

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gradoSeleccionado) {
      sileo.warning({ title: 'Datos incompletos', description: 'Por favor seleccione un grado/año' });
      return;
    }

    if (nivelSeleccionado !== 'inicial' && !seccionSeleccionada) {
      sileo.warning({ title: 'Datos incompletos', description: 'Por favor seleccione una sección' });
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
          seccion: seccionSeleccionada || 'Única',
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
          seccion: seccionSeleccionada || 'Única',
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
          seccion: seccionSeleccionada || 'Única',
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

      sileo.success({
        title: `${tipoNombre} publicado exitosamente`,
        description: `${nivelNombre} • ${gradoNombre}${seccionSeleccionada ? ` - Sección ${seccionSeleccionada}` : ''} • ${materia} • Asignado a ${data.estudiantesAsignados || 0} estudiantes`,
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
      fecha: '',
      referenteTeorico: '',
      estrategiaEvaluacion: '',
      tecnicaEvaluacion: '',
      instrumentoEvaluacion: '',
      ptos: '',
      porcentaje: '',
      criteriosEvaluacion: ''
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

  const guardarPlan = async () => {
    if (!planActual.areaFormacion || !planActual.docente || !planActual.ano) {
      sileo.warning({ title: 'Datos incompletos', description: 'Complete los campos del encabezado del plan' });
      return;
    }

    if (!gradoSeleccionado) {
      sileo.warning({ title: 'Datos incompletos', description: 'Seleccione un grado/año antes de guardar el plan' });
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

      const planData = {
        titulo: planActual.areaFormacion.trim() || 'Plan de Evaluación',
        descripcion: `Plan de evaluación de ${planActual.areaFormacion}`,
        nivel: nivelSeleccionado || 'media',
        grado: gradoSeleccionado || '1ro',
        seccion: planActual.secciones || seccionSeleccionada || 'Única',
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
    const seccionPorDefecto = nivelSeleccionado === 'inicial' ? '' : (seccionSeleccionada || 'A');

    const nombreDocente = session?.user?.name ||
      docenteInfo?.nombres ||
      docenteInfo?.user?.nombre ||
      'Docente';

    setPlanActual({
      id: '',
      areaFormacion: '',
      docente: nombreDocente,
      ano: gradoPorDefecto,
      secciones: seccionPorDefecto,
      filas: [],
      nivel: nivelSeleccionado,
      grado: gradoPorDefecto,
      materia: materia || ''
    });

    if (gradoPorDefecto) setGradoSeleccionado(gradoPorDefecto);
    if (seccionPorDefecto) setSeccionSeleccionada(seccionPorDefecto);

    setModoEdicionPlan(false);
    setPlanEditandoId(null);
    setMostrarGestorPlan(true);
    setVistaPreviaPlan(null);
  };

  // ✅ CORREGIDO: usa window.confirm en lugar de sileo.action con cancel
  const eliminarPlan = (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este plan de evaluación?')) {
      return;
    }
    ejecutarEliminarPlan(id);
  };

  const ejecutarEliminarPlan = async (id: string) => {
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
        fila.fecha || '-',
        fila.referenteTeorico || '-',
        fila.estrategiaEvaluacion || '-',
        fila.tecnicaEvaluacion || '-',
        fila.instrumentoEvaluacion || '-',
        fila.ptos || '-',
        fila.porcentaje || '-',
        fila.criteriosEvaluacion || '-'
      ]);

      const tableConfig = {
        startY: yPos + 5,
        head: [['#', 'FECHA', 'REFERENTE', 'ESTRATEGIA', 'TÉCNICA', 'INSTRUMENTO', 'PTOS', '%', 'CRITERIOS']],
        body: tableData.length > 0 ? tableData : [['-', '-', '-', 'Sin filas registradas', '-', '-', '-', '-', '-']],
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
                Mensaje del aviso
              </Label>
              <Textarea
                className="bg-black/40 border-white/10 text-white mt-2 min-h-30"
                placeholder="Escriba el mensaje que desea comunicar..."
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
                Descripción del material
              </Label>
              <Textarea
                className="bg-black/40 border-white/10 text-white mt-2 min-h-25"
                placeholder="Describa el material que se compartirá..."
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
                Fecha de publicación
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
                      "FECHA",
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
                      <TableCell className="text-center text-white">{fila.fecha || "-"}</TableCell>
                      <TableCell className="text-white">{fila.referenteTeorico || "-"}</TableCell>
                      <TableCell className="text-white">{fila.estrategiaEvaluacion || "-"}</TableCell>
                      <TableCell className="text-white">{fila.tecnicaEvaluacion || "-"}</TableCell>
                      <TableCell className="text-white">{fila.instrumentoEvaluacion || "-"}</TableCell>
                      <TableCell className="text-center text-white">{fila.ptos || "-"}</TableCell>
                      <TableCell className="text-center text-white">{fila.porcentaje || "-"}</TableCell>
                      <TableCell className="text-white">{fila.criteriosEvaluacion || "-"}</TableCell>
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
            }}
          >
            <X className="mr-2 h-4 w-4" /> Cerrar Editor
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className={`grid gap-4 bg-black/30 p-5 rounded-xl border border-white/5 ${
              nivelSeleccionado === "inicial"
                ? "grid-cols-1 md:grid-cols-3"
                : "grid-cols-1 md:grid-cols-4"
            }`}
          >
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

            {nivelSeleccionado !== "inicial" && (
              <div>
                <Label className="text-emerald-400 text-xs uppercase font-bold">Secciones</Label>
                <Select
                  value={planActual.secciones ?? ''}
                  onValueChange={(v) => {
                    const valor = v ?? '';
                    setPlanActual({ ...planActual, secciones: valor });
                    setSeccionSeleccionada(valor);
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECCIONES_DISPONIBLES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                  {[
                    "FECHA",
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
                    {(
                      [
                        ["fecha", "date"],
                        ["referenteTeorico", "text"],
                        ["estrategiaEvaluacion", "text"],
                        ["tecnicaEvaluacion", "text"],
                        ["instrumentoEvaluacion", "text"],
                        ["ptos", "text"],
                        ["porcentaje", "text"],
                        ["criteriosEvaluacion", "text"],
                      ] as [keyof FilaPlan, string][]
                    ).map(([campo, tipo]) => (
                      <TableCell key={campo} className="p-1">
                        <Input
                          type={tipo}
                          value={fila[campo] as string}
                          onChange={(e) => actualizarFila(fila.id, campo, e.target.value)}
                          className="bg-black/30 border-white/5 text-white text-xs h-8 min-w-20"
                        />
                      </TableCell>
                    ))}
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
                  if (window.confirm('¿Está seguro de que desea cancelar la edición?')) {
                    setMostrarGestorPlan(false);
                    setModoEdicionPlan(false);
                    setPlanEditandoId(null);
                  }
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

  // ✅ CORREGIDO: usa window.confirm en lugar de sileo.action con cancel
  const handleCerrarSesion = () => {
    if (!window.confirm('¿Está seguro de que desea cerrar sesión?')) {
      return;
    }
    ejecutarCerrarSesion();
  };

  const ejecutarCerrarSesion = async () => {
    await signOut({ redirect: false });
    router.push('/');
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
      {/* Fondo: imagen nítida + overlay oscuro sutil */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
      />
      <div className="fixed inset-0 bg-[#0a1410]/50 z-0 pointer-events-none" />

      {/* NAVBAR simplificado */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-[8%] py-3 bg-[#1a2e26]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="text-emerald-400 font-extrabold tracking-widest text-xs">
          {vistaPreviaPlan
            ? 'VISTA PREVIA'
            : mostrarGestorPlan
            ? 'EDITOR DE PLAN'
            : tipoContenido === 'plan_evaluacion'
            ? 'GESTIÓN DE PLANES'
            : 'EDITOR DE CONTENIDO'}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-[#081a14] font-bold text-sm">
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
              : 'Publica tareas, avisos y materiales para los estudiantes.'}
          </p>
        </header>

        {vistaPreviaPlan ? (
          renderVistaPreviaPlan()
        ) : mostrarGestorPlan ? (
          renderPlanForm()
        ) : tipoContenido === 'plan_evaluacion' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            <div>{renderListaPlanes()}</div>
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
                              setSeccionSeleccionada('');
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
                      <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                        Sección
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {seccionesActuales.map((seccion) => (
                          <button
                            key={seccion}
                            onClick={() => setSeccionSeleccionada(seccion)}
                            className={`p-3 rounded-lg font-bold text-center transition border ${
                              seccionSeleccionada === seccion
                                ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                                : 'bg-black/30 text-white border-white/10 hover:bg-white/5'
                            }`}
                          >
                            {seccion}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-6">
            
            {/* ============ BARRA LATERAL IZQUIERDA: TIPO DE CONTENIDO ============ */}
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
                          onClick={() => setTipoContenido(tipo.id)}
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

            {/* ============ FORMULARIO CENTRAL ============ */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
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

            {/* ============ BARRA LATERAL DERECHA: NIVEL/GRADO/SECCIÓN ============ */}
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
                            setSeccionSeleccionada('');
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
                    <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
                      Sección
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {seccionesActuales.map((seccion) => (
                        <button
                          key={seccion}
                          onClick={() => setSeccionSeleccionada(seccion)}
                          className={`p-3 rounded-lg font-bold text-center transition border ${
                            seccionSeleccionada === seccion
                              ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                              : 'bg-black/30 text-white border-white/10 hover:bg-white/5'
                          }`}
                        >
                          {seccion}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default EditTasksPage;