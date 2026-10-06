// app/Notas/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';

// ============ COMPONENTES PROPIOS ============
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ============ SHADCN UI ============
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Search,
  X,
  Save,
  LogOut,
  Users,
  GraduationCap,
  Check,
  AlertCircle,
  BookOpen,
} from "lucide-react";

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  danger: '#ef4444'
};

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

// ============ TIPOS ============
interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  nivel: string;
  grado: string;
  seccion: string;
  numeroTelefonoCelular?: string;
  correoElectronico?: string;
}

interface NotaEstudiante {
  id?: string;
  estudianteId: string;
  materia: string;
  nivel: string;
  grado: string;
  seccion: string;
  nota: string;
  observacion?: string;
  docenteId?: string;
  periodo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DocenteInfo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  especialidad?: string;
}

const NotasPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ============ ESTADOS DE SESIÓN ============
  const [docenteInfo, setDocenteInfo] = useState<DocenteInfo | null>(null);
  const [cargandoDocente, setCargandoDocente] = useState(true);

  // ============ ESTADOS DE FILTROS ============
  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>('media');
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string>('');
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('1er Lapso');

  // ============ ESTADOS DE ESTUDIANTES Y NOTAS ============
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [notas, setNotas] = useState<Record<string, NotaEstudiante>>({});
  const [notasOriginales, setNotasOriginales] = useState<Record<string, NotaEstudiante>>({});
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [guardando, setGuardando] = useState(false);

  // ============ ESTADOS DE UI ============
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

  // ============ CONFIGURACIÓN ============
  const niveles = [
    { id: 'inicial', nombre: 'Educación Inicial' },
    { id: 'primaria', nombre: 'Educación Primaria' },
    { id: 'media', nombre: 'Educación Media' }
  ];

  const periodos = ['1er Lapso', '2do Lapso', '3er Lapso'];

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
        }
      } catch (error) {
        console.error('Error al cargar docente:', error);
      } finally {
        setCargandoDocente(false);
      }
    };

    cargarDocente();
  }, [session, status]);

  // ============ CARGA DE ESTUDIANTES ============
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

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  // ============ CARGA DE NOTAS EXISTENTES ============
  const cargarNotas = async () => {
    if (!nivelSeleccionado || !gradoSeleccionado || !materiaSeleccionada) return;

    try {
      const params = new URLSearchParams({
        nivel: nivelSeleccionado,
        grado: gradoSeleccionado,
        materia: materiaSeleccionada,
        periodo: periodoSeleccionado,
      });

      if (seccionSeleccionada) {
        params.append('seccion', seccionSeleccionada);
      }

      const response = await fetch(`/api/notas?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();

        const notasMap: Record<string, NotaEstudiante> = {};
        data.forEach((nota: any) => {
          notasMap[nota.estudianteId] = {
            id: nota.id,
            estudianteId: nota.estudianteId,
            materia: nota.materia,
            nivel: nota.nivel,
            grado: nota.grado,
            seccion: nota.seccion,
            nota: nota.nota?.toString() || '',
            observacion: nota.observacion || '',
            docenteId: nota.docenteId,
            periodo: nota.periodo || periodoSeleccionado,
          };
        });

        setNotas(notasMap);
        setNotasOriginales(JSON.parse(JSON.stringify(notasMap)));
      } else {
        setNotas({});
        setNotasOriginales({});
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
      setNotas({});
      setNotasOriginales({});
    }
  };

  useEffect(() => {
    if (nivelSeleccionado && gradoSeleccionado && materiaSeleccionada) {
      cargarNotas();
    }
  }, [nivelSeleccionado, gradoSeleccionado, seccionSeleccionada, materiaSeleccionada, periodoSeleccionado]);

  // ============ NORMALIZACIÓN DE GRADO ============
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

  // ============ FILTRADO DE ESTUDIANTES ============
  const estudiantesFiltrados = useMemo(() => {
    let filtrados = estudiantes;

    if (nivelSeleccionado) {
      filtrados = filtrados.filter((e) => e.nivel === nivelSeleccionado);
    }

    if (gradoSeleccionado) {
      filtrados = filtrados.filter((e) =>
        gradoCoincide(e.grado, gradoSeleccionado, nivelSeleccionado)
      );
    }

    if (seccionSeleccionada) {
      filtrados = filtrados.filter((e) => e.seccion === seccionSeleccionada);
    }

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

    return filtrados.sort((a, b) =>
      `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`)
    );
  }, [estudiantes, nivelSeleccionado, gradoSeleccionado, seccionSeleccionada, busquedaEstudiante]);

  // ============ MANEJO DE NOTAS ============
  const handleNotaChange = (estudianteId: string, valor: string) => {
    const valorLimpio = valor.replace(',', '.');

    if (valorLimpio === '') {
      setNotas(prev => ({
        ...prev,
        [estudianteId]: {
          ...(prev[estudianteId] || {
            estudianteId,
            materia: materiaSeleccionada,
            nivel: nivelSeleccionado,
            grado: gradoSeleccionado,
            seccion: seccionSeleccionada,
            periodo: periodoSeleccionado,
          }),
          nota: ''
        }
      }));
      return;
    }

    const num = parseFloat(valorLimpio);
    if (isNaN(num)) return;
    if (num < 0 || num > 20) return;

    setNotas(prev => ({
      ...prev,
      [estudianteId]: {
        ...(prev[estudianteId] || {
          estudianteId,
          materia: materiaSeleccionada,
          nivel: nivelSeleccionado,
          grado: gradoSeleccionado,
          seccion: seccionSeleccionada,
          periodo: periodoSeleccionado,
        }),
        nota: valorLimpio
      }
    }));
  };

  const handleObservacionChange = (estudianteId: string, valor: string) => {
    setNotas(prev => ({
      ...prev,
      [estudianteId]: {
        ...(prev[estudianteId] || {
          estudianteId,
          materia: materiaSeleccionada,
          nivel: nivelSeleccionado,
          grado: gradoSeleccionado,
          seccion: seccionSeleccionada,
          periodo: periodoSeleccionado,
        }),
        observacion: valor
      }
    }));
  };

  const hayCambios = useMemo(() => {
    return JSON.stringify(notas) !== JSON.stringify(notasOriginales);
  }, [notas, notasOriginales]);

  // ============ GUARDAR NOTAS ============
  const guardarNotas = async () => {
    if (!docenteInfo?.id) {
      sileo.error({ title: 'Error', description: 'No se encontró información del docente' });
      return;
    }

    if (!materiaSeleccionada) {
      sileo.warning({ title: 'Datos incompletos', description: 'Seleccione una materia' });
      return;
    }

    if (!gradoSeleccionado) {
      sileo.warning({ title: 'Datos incompletos', description: 'Seleccione un grado/año' });
      return;
    }

    const notasAGuardar = Object.values(notas).filter(n => n.nota !== '' && n.nota !== undefined);

    if (notasAGuardar.length === 0) {
      sileo.warning({ title: 'Sin notas', description: 'No hay notas para guardar' });
      return;
    }

    try {
      setGuardando(true);

      const payload = notasAGuardar.map(n => ({
        estudianteId: n.estudianteId,
        materia: materiaSeleccionada,
        nivel: nivelSeleccionado,
        grado: gradoSeleccionado,
        seccion: n.seccion || seccionSeleccionada || 'A',
        nota: parseFloat(n.nota),
        observacion: n.observacion || '',
        docenteId: docenteInfo.id,
        periodo: periodoSeleccionado,
      }));

      const response = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: payload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        sileo.error({
          title: 'Error al guardar',
          description: errorData.error || 'No se pudieron guardar las notas'
        });
        return;
      }

      const data = await response.json();

      sileo.success({
        title: 'Notas guardadas exitosamente',
        description: `${data.guardadas} ${data.guardadas === 1 ? 'nota guardada' : 'notas guardadas'}`
      });

      await cargarNotas();

    } catch (error) {
      console.error('Error al guardar notas:', error);
      sileo.error({
        title: 'Error de conexión',
        description: 'No se pudieron guardar las notas'
      });
    } finally {
      setGuardando(false);
    }
  };

  // ============ LIMPIAR FILTROS ============
  const limpiarTodo = () => {
    if (hayCambios) {
      setConfirmacion({
        abierto: true,
        titulo: '¿Descartar cambios?',
        descripcion: 'Hay notas sin guardar. Si continúas, se perderán.',
        onConfirm: () => {
          setConfirmacion(null);
          setNotas({});
          setNotasOriginales({});
          setNivelSeleccionado('media');
          setGradoSeleccionado('');
          setSeccionSeleccionada('');
          setMateriaSeleccionada('');
          setPeriodoSeleccionado('1er Lapso');
          setBusquedaEstudiante('');
        },
      });
      return;
    }

    setNivelSeleccionado('media');
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setMateriaSeleccionada('');
    setPeriodoSeleccionado('1er Lapso');
    setBusquedaEstudiante('');
    setNotas({});
    setNotasOriginales({});
  };

  const volverAlEditor = () => {
    if (hayCambios) {
      setConfirmacion({
        abierto: true,
        titulo: '¿Salir sin guardar?',
        descripcion: 'Hay notas sin guardar. Si sales, se perderán.',
        onConfirm: () => {
          setConfirmacion(null);
          router.push('/editar');
        },
      });
      return;
    }
    router.push('/editar');
  };

  // ============ CERRAR SESIÓN ============
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

  // ============ ESTADÍSTICAS ============
  const estadisticas = useMemo(() => {
    const notasValidas = Object.values(notas).filter(n => n.nota !== '' && n.nota !== undefined);
    const valores = notasValidas.map(n => parseFloat(n.nota)).filter(n => !isNaN(n));

    if (valores.length === 0) {
      return { promedio: 0, aprobados: 0, reprobados: 0, total: 0 };
    }

    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const aprobados = valores.filter(v => v >= 10).length;
    const reprobados = valores.filter(v => v < 10).length;

    return {
      promedio: promedio.toFixed(2),
      aprobados,
      reprobados,
      total: valores.length,
    };
  }, [notas]);

  // ============ RENDER ============
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

  const filtrosCompletos = nivelSeleccionado && gradoSeleccionado && materiaSeleccionada;

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

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-[8%] py-3 bg-[#1a2e26]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={volverAlEditor}
            className="border-white/20 text-white hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-xl h-9 w-9 transition-all"
            title="Volver al editor"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-emerald-400 font-extrabold tracking-widest text-xs">
            GESTIÓN DE NOTAS
          </div>
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
        {/* HEADER */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight flex items-center justify-center gap-3">
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            GESTIÓN DE NOTAS
          </h1>
          <p className="text-white/60 text-base">
            {filtrosCompletos
              ? `Calificaciones de ${materiaSeleccionada} — ${gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre || gradoSeleccionado}${seccionSeleccionada ? ` "${seccionSeleccionada}"` : ''} — ${periodoSeleccionado}`
              : 'Selecciona nivel, grado, materia y período para comenzar'}
          </p>
        </header>

        {/* FILTROS */}
        <Card className="bg-black/30 border-white/10 backdrop-blur mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider">
                Configuración de Calificaciones
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Nivel */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">
                  Nivel
                </Label>
                <Select
                  value={nivelSeleccionado}
                  onValueChange={(v) => {
                    if (v) {
                      setNivelSeleccionado(v);
                      setGradoSeleccionado('');
                      setSeccionSeleccionada('');
                      setMateriaSeleccionada('');
                      setNotas({});
                      setNotasOriginales({});
                    }
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
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

              {/* Grado */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">
                  Grado / Año
                </Label>
                <Select
                  value={gradoSeleccionado || 'none'}
                  onValueChange={(v) => {
                    if (v && v !== 'none') {
                      setGradoSeleccionado(v);
                      setSeccionSeleccionada('');
                      setNotas({});
                      setNotasOriginales({});
                    }
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
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

              {/* Sección */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">
                  Sección
                </Label>
                <Select
                  value={seccionSeleccionada || 'all'}
                  onValueChange={(v) => {
                    setSeccionSeleccionada(v === 'all' ? '' : (v ?? ''));
                    setNotas({});
                    setNotasOriginales({});
                  }}
                  disabled={nivelSeleccionado === 'inicial' || seccionesActuales.length === 0}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las secciones</SelectItem>
                    {seccionesActuales.map((s) => (
                      <SelectItem key={s} value={s}>
                        Sección {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Materia */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">
                  Materia
                </Label>
                <Select
                  value={materiaSeleccionada || 'none'}
                  onValueChange={(v) => {
                    if (v && v !== 'none') {
                      setMateriaSeleccionada(v);
                      setNotas({});
                      setNotasOriginales({});
                    }
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Seleccionar
                    </SelectItem>
                    {materiasDisponibles.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">
                  Período
                </Label>
                <Select
                  value={periodoSeleccionado}
                  onValueChange={(v) => {
                    if (v) {
                      setPeriodoSeleccionado(v);
                      setNotas({});
                      setNotasOriginales({});
                    }
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumen de filtros + botón limpiar */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {nivelSeleccionado && (
                  <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {niveles.find(n => n.id === nivelSeleccionado)?.nombre.replace('Educación ', '')}
                  </span>
                )}
                {gradoSeleccionado && (
                  <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre}
                  </span>
                )}
                {seccionSeleccionada && (
                  <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Secc: {seccionSeleccionada}
                  </span>
                )}
                {materiaSeleccionada && (
                  <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {materiaSeleccionada}
                  </span>
                )}
                <span className="text-[0.65rem] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {periodoSeleccionado}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={limpiarTodo}
                className="border-white/10 text-gray-400 hover:bg-white/5 hover:border-emerald-500/40 h-8 text-xs"
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CONTENIDO PRINCIPAL */}
        {!filtrosCompletos ? (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Selecciona los filtros para comenzar
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Elige el <strong className="text-emerald-400">nivel</strong>, <strong className="text-emerald-400">grado</strong>, <strong className="text-emerald-400">materia</strong> y <strong className="text-emerald-400">período</strong> para cargar la lista de estudiantes y asignar sus calificaciones.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Card className="bg-emerald-500/10 border-emerald-500/30 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-black text-emerald-400">
                    {estadisticas.promedio}
                  </div>
                  <div className="text-[0.65rem] uppercase text-emerald-400/70 font-bold mt-1">
                    Promedio
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/30 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-black text-green-400">
                    {estadisticas.aprobados}
                  </div>
                  <div className="text-[0.65rem] uppercase text-green-400/70 font-bold mt-1">
                    Aprobados (≥10)
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/30 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-black text-red-400">
                    {estadisticas.reprobados}
                  </div>
                  <div className="text-[0.65rem] uppercase text-red-400/70 font-bold mt-1">
                    Reprobados (&lt;10)
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/30 backdrop-blur">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-black text-blue-400">
                    {estadisticas.total}/{estudiantesFiltrados.length}
                  </div>
                  <div className="text-[0.65rem] uppercase text-blue-400/70 font-bold mt-1">
                    Calificados
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* LISTA DE ESTUDIANTES */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-emerald-400 text-xl flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Lista de Estudiantes
                  </CardTitle>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-semibold">
                    {estudiantesFiltrados.length} {estudiantesFiltrados.length === 1 ? 'estudiante' : 'estudiantes'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {hayCambios && (
                    <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Cambios sin guardar
                    </Badge>
                  )}
                  <Button
                    onClick={guardarNotas}
                    disabled={!hayCambios || guardando}
                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {guardando ? 'Guardando...' : 'Guardar Notas'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, apellido o cédula..."
                    value={busquedaEstudiante}
                    onChange={(e) => setBusquedaEstudiante(e.target.value)}
                    className="bg-black/30 border-white/10 text-white pl-11 pr-11 h-11 text-sm"
                  />
                  {busquedaEstudiante && (
                    <button
                      onClick={() => setBusquedaEstudiante('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Separator className="bg-white/5" />

                {/* Tabla de estudiantes */}
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
                      {busquedaEstudiante
                        ? 'Prueba con otra búsqueda'
                        : 'No hay estudiantes en este grado/sección'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/5 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-black/30 hover:bg-black/30">
                          <TableHead className="text-emerald-400 font-bold text-xs uppercase w-12 text-center">
                            #
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-xs uppercase">
                            Cédula
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-xs uppercase">
                            Estudiante
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-xs uppercase w-32 text-center">
                            Sección
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-xs uppercase w-36 text-center">
                            Nota (0-20)
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-xs uppercase w-64">
                            Observación
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estudiantesFiltrados.map((estudiante, index) => {
                          const notaActual = notas[estudiante.id]?.nota || '';
                          const numNota = parseFloat(notaActual);
                          const aprobado = !isNaN(numNota) && numNota >= 10;
                          const reprobado = !isNaN(numNota) && numNota < 10;

                          return (
                            <TableRow
                              key={estudiante.id}
                              className="border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <TableCell className="text-center text-gray-500 text-sm font-mono">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono font-semibold text-emerald-400 text-sm">
                                  {estudiante.cedulaIdentidad}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="text-white font-medium">
                                  {estudiante.apellidos}, {estudiante.nombres}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                  {estudiante.seccion}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.01}
                                    value={notaActual}
                                    onChange={(e) => handleNotaChange(estudiante.id, e.target.value)}
                                    placeholder="—"
                                    className={`bg-black/40 border-white/10 text-white text-center h-10 font-bold text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                      aprobado
                                        ? 'border-green-500/50 text-green-400'
                                        : reprobado
                                        ? 'border-red-500/50 text-red-400'
                                        : ''
                                    }`}
                                  />
                                  {aprobado && (
                                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                                  )}
                                  {reprobado && (
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  value={notas[estudiante.id]?.observacion || ''}
                                  onChange={(e) => handleObservacionChange(estudiante.id, e.target.value)}
                                  placeholder="Observación opcional..."
                                  className="bg-black/40 border-white/10 text-white text-sm h-10"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Nota informativa */}
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400 leading-relaxed m-0 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Nota:</strong> Las calificaciones deben estar entre <strong>0 y 20 puntos</strong>.
                      Una nota mayor o igual a <strong>10</strong> se considera aprobatoria. Los cambios se guardan al hacer clic en <strong>"Guardar Notas"</strong>.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
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

export default NotasPage;