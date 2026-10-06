// app/dashboard/control-estudios/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { sileo } from 'sileo';

// ============ SHADCN UI ============
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  X,
  LogOut,
  Users,
  GraduationCap,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Save,
  FileDown,
  Pencil,
  Trash2,
  Plus,
  Check,
} from "lucide-react";

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  white: '#ffffff',
  darkText: '#1a2e26'
};

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  fechaNacimiento: string;
  nivel: string;
  grado: string;
  seccion: string;
  numeroTelefonoCelular: string;
  correoElectronico: string;
  userId?: string;
}

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  email: string;
  telefono: string;
  nivel: string;
  seccion: string;
  fechaContratacion: string;
  activo: boolean;
  userId?: string;
}

interface Nota {
  id: string;
  estudianteId: string;
  cedulaIdentidad?: string;
  nombres?: string;
  apellidos?: string;
  materia: string;
  nivel: string;
  grado: string;
  seccion: string;
  periodo: string;
  nota: number;
  observacion?: string | null;
  docente?: string | null;
}

type TabType = 'estudiantes' | 'docentes' | 'notas' | 'actualizar';

const MATERIAS_POR_NIVEL: Record<string, string[]> = {
  inicial: ['Lenguaje y Comunicación', 'Matemáticas', 'Expresión Artística', 'Educación Física'],
  primaria: ['Castellano', 'Matemáticas', 'Ciencias Sociales', 'Ciencias Naturales', 'Inglés', 'Educación Artística', 'Educación Física'],
  media: ['Castellano', 'Matemáticas', 'Historia', 'Geografía', 'Biología', 'Química', 'Física', 'Inglés', 'G.H.C', 'Ciencias de la Tierra', 'Educación Física', 'Arte y Patrimonio', 'Informática']
};

const GestionInstitutoPage: React.FC = () => {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState<TabType>('estudiantes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroGrado, setFiltroGrado] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // ✅ Estados para el modal de confirmación
  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

  // ============ ESTADOS PARA NOTAS / NÓMINAS ============
  const [notas, setNotas] = useState<Nota[]>([]);
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [filtroMateria, setFiltroMateria] = useState<string>('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('1er Lapso');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [notasEnEdicion, setNotasEnEdicion] = useState<Record<string, { nota: number; observacion: string }>>({});
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [exportando, setExportando] = useState(false);

  // ============ ESTADOS PARA CREAR NÓMINA ============
  const [modoCrearNomina, setModoCrearNomina] = useState(false);
  const [crearNivel, setCrearNivel] = useState('media');
  const [crearGrado, setCrearGrado] = useState('');
  const [crearSeccion, setCrearSeccion] = useState('');
  const [crearMateria, setCrearMateria] = useState('');
  const [crearPeriodo, setCrearPeriodo] = useState('1er Lapso');
  const [crearNotas, setCrearNotas] = useState<Record<string, { nota: string; observacion: string }>>({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resEstudiantes = await fetch('/api/estudiantes');
      if (resEstudiantes.ok) {
        const data = await resEstudiantes.json();
        setEstudiantes(data);
      }

      const resDocentes = await fetch('/api/docentes');
      if (resDocentes.ok) {
        const data = await resDocentes.json();
        setDocentes(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      sileo.error({ title: 'Error al cargar datos', description: 'No se pudieron obtener los datos del servidor' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cargar notas cuando cambian los filtros (solo si hay curso completo)
  useEffect(() => {
    if (tabActiva === 'notas' && filtroNivel && filtroGrado && filtroSeccion) {
      cargarNotas();
    } else if (tabActiva === 'notas') {
      setNotas([]);
    }
  }, [tabActiva, filtroNivel, filtroGrado, filtroSeccion, filtroMateria, filtroPeriodo]);

  const cargarNotas = async () => {
    if (!filtroNivel || !filtroGrado || !filtroSeccion) return;
    setCargandoNotas(true);
    try {
      const params = new URLSearchParams({
        nivel: filtroNivel,
        grado: filtroGrado,
        seccion: filtroSeccion,
      });
      if (filtroMateria) params.set('materia', filtroMateria);
      if (filtroPeriodo) params.set('periodo', filtroPeriodo);

      const res = await fetch(`/api/notas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotas(data);
        setNotasEnEdicion({});
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
      sileo.error({ title: 'Error al cargar notas' });
    } finally {
      setCargandoNotas(false);
    }
  };

  const handleCerrarSesion = () => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Cerrar sesión?',
      descripcion: 'Se cerrará tu sesión actual',
      onConfirm: async () => {
        setConfirmacion(null);
        await signOut({ callbackUrl: '/' });
      },
    });
  };

  const niveles = [
    { id: 'inicial', nombre: 'Educacion Inicial' },
    { id: 'primaria', nombre: 'Educacion Primaria' },
    { id: 'media', nombre: 'Educacion Media' }
  ];

  const gradosPorNivel = {
    inicial: [
      { id: 'Pre-Kinder', nombre: 'Pre-Kinder' },
      { id: 'Kinder', nombre: 'Kinder' },
      { id: 'Preparatorio', nombre: 'Preparatorio' }
    ],
    primaria: [
      { id: '1er Grado', nombre: '1er Grado' },
      { id: '2do Grado', nombre: '2do Grado' },
      { id: '3er Grado', nombre: '3er Grado' },
      { id: '4to Grado', nombre: '4to Grado' },
      { id: '5to Grado', nombre: '5to Grado' },
      { id: '6to Grado', nombre: '6to Grado' }
    ],
    media: [
      { id: '1er Año', nombre: '1er Año' },
      { id: '2do Año', nombre: '2do Año' },
      { id: '3er Año', nombre: '3er Año' },
      { id: '4to Año', nombre: '4to Año' },
      { id: '5to Año', nombre: '5to Año' }
    ]
  };

  const periodos = ['1er Lapso', '2do Lapso', '3er Lapso'];
  const secciones = ['A', 'B', 'C', 'D', 'E'];

  // ✅ Grados y materias para el formulario de creación
  const gradosCrear = gradosPorNivel[crearNivel as keyof typeof gradosPorNivel] || [];
  const materiasCrear = MATERIAS_POR_NIVEL[crearNivel] || [];

  // ✅ Estudiantes filtrados del curso seleccionado (para la lista de notas)
  const estudiantesDelCurso = useMemo(() => {
    if (!filtroNivel || !filtroGrado || !filtroSeccion) return [];
    return estudiantes
      .filter(
        (e) =>
          e.nivel === filtroNivel &&
          e.grado === filtroGrado &&
          e.seccion === filtroSeccion
      )
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  }, [estudiantes, filtroNivel, filtroGrado, filtroSeccion]);

  // ✅ Estudiantes del curso para el formulario de creación
  const estudiantesCrear = useMemo(() => {
    if (!crearNivel || !crearGrado || !crearSeccion) return [];
    return estudiantes
      .filter(
        (e) =>
          e.nivel === crearNivel &&
          e.grado === crearGrado &&
          e.seccion === crearSeccion
      )
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  }, [estudiantes, crearNivel, crearGrado, crearSeccion]);

  // ✅ Notas agrupadas por estudiante (para editar y mostrar)
  const notasMap = useMemo(() => {
    const map: Record<string, Nota> = {};
    notas.forEach((n) => {
      map[n.estudianteId] = n;
    });
    return map;
  }, [notas]);

  const notasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return notas;
    const t = searchTerm.toLowerCase().trim();
    return notas.filter(
      (n) =>
        (n.nombres || '').toLowerCase().includes(t) ||
        (n.apellidos || '').toLowerCase().includes(t) ||
        (n.cedulaIdentidad || '').toLowerCase().includes(t)
    );
  }, [notas, searchTerm]);

  // ✅ Guardar todas las notas editadas (masivo)
  const guardarNotasMasivo = async () => {
    const cambios = Object.entries(notasEnEdicion);
    if (cambios.length === 0) {
      return sileo.warning({ title: 'No hay cambios para guardar' });
    }
    if (!filtroMateria) {
      return sileo.warning({ title: 'Selecciona una materia para guardar' });
    }

    setGuardandoNotas(true);
    try {
      const payload = cambios.map(([estudianteId, valor]) => ({
        estudianteId,
        materia: filtroMateria,
        nivel: filtroNivel,
        grado: filtroGrado,
        seccion: filtroSeccion,
        periodo: filtroPeriodo,
        nota: valor.nota,
        observacion: valor.observacion,
      }));

      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        sileo.error({ title: 'Error al guardar', description: err.error });
        return;
      }

      const data = await res.json();
      sileo.success({
        title: 'Notas actualizadas',
        description: `${data.guardadas} nota${data.guardadas === 1 ? '' : 's'} guardada${data.guardadas === 1 ? '' : 's'}`,
      });
      setNotasEnEdicion({});
      cargarNotas();
    } catch (error) {
      console.error('Error al guardar notas:', error);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardandoNotas(false);
    }
  };

  // ✅ Crear nómina nueva
  const crearNomina = async () => {
    if (!crearNivel || !crearGrado || !crearSeccion || !crearMateria) {
      return sileo.warning({
        title: 'Datos incompletos',
        description: 'Selecciona nivel, grado, sección y materia',
      });
    }

    const notasAGuardar = Object.entries(crearNotas)
      .map(([estudianteId, valor]) => ({
        estudianteId,
        nota: parseFloat(valor.nota),
        observacion: valor.observacion,
      }))
      .filter((n) => !isNaN(n.nota) && n.nota >= 0 && n.nota <= 20);

    if (notasAGuardar.length === 0) {
      return sileo.warning({
        title: 'Sin notas',
        description: 'Ingresa al menos una nota',
      });
    }

    setGuardandoNotas(true);
    try {
      const payload = notasAGuardar.map((n) => ({
        estudianteId: n.estudianteId,
        materia: crearMateria,
        nivel: crearNivel,
        grado: crearGrado,
        seccion: crearSeccion,
        periodo: crearPeriodo,
        nota: n.nota,
        observacion: n.observacion || '',
      }));

      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        sileo.error({ title: 'Error al crear', description: err.error });
        return;
      }

      const data = await res.json();
      sileo.success({
        title: 'Nómina creada',
        description: `${data.guardadas} nota${data.guardadas === 1 ? '' : 's'} registrada${data.guardadas === 1 ? '' : 's'}`,
      });

      // Resetear formulario
      setModoCrearNomina(false);
      setCrearGrado('');
      setCrearSeccion('');
      setCrearMateria('');
      setCrearNotas({});

      // Cargar la nómina recién creada
      setFiltroNivel(crearNivel);
      setFiltroGrado(crearGrado);
      setFiltroSeccion(crearSeccion);
      setFiltroMateria(crearMateria);
      setFiltroPeriodo(crearPeriodo);
    } catch (error) {
      console.error('Error al crear nómina:', error);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardandoNotas(false);
    }
  };

  // ✅ Eliminar nota
  const eliminarNota = (notaId: string) => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Eliminar nota?',
      descripcion: 'Esta acción no se puede deshacer',
      onConfirm: async () => {
        setConfirmacion(null);
        try {
          const res = await fetch(`/api/notas/${notaId}`, { method: 'DELETE' });
          if (res.ok) {
            sileo.success({ title: 'Nota eliminada' });
            cargarNotas();
          }
        } catch (error) {
          sileo.error({ title: 'Error al eliminar' });
        }
      },
    });
  };

  // ✅ Exportar a Excel
  const exportarAExcel = async () => {
    if (!filtroNivel || !filtroGrado || !filtroSeccion) {
      return sileo.warning({
        title: 'Filtros incompletos',
        description: 'Selecciona nivel, grado y sección para exportar',
      });
    }

    try {
      setExportando(true);
      const params = new URLSearchParams({
        nivel: filtroNivel,
        grado: filtroGrado,
        seccion: filtroSeccion,
      });
      if (filtroMateria) params.set('materia', filtroMateria);
      if (filtroPeriodo) params.set('periodo', filtroPeriodo);

      const res = await fetch(`/api/notas/exportar?${params}`);

      if (!res.ok) {
        sileo.error({ title: 'Error al exportar' });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const partes = ['Notas', filtroGrado, `Seccion-${filtroSeccion}`];
      if (filtroMateria) partes.push(filtroMateria);
      if (filtroPeriodo) partes.push(filtroPeriodo.replace(/\s+/g, '-'));
      a.download = `${partes.join('_')}.xlsx`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sileo.success({ title: 'Excel descargado correctamente' });
    } catch (error) {
      console.error('Error al exportar:', error);
      sileo.error({ title: 'Error al exportar' });
    } finally {
      setExportando(false);
    }
  };

  const handleEditarEstudianteIndividual = async (estudiante: Estudiante) => {
    try {
      const response = await fetch(`/api/estudiantes/${estudiante.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estudiante)
      });
      if (response.ok) {
        setEstudiantes(estudiantes.map(e => e.id === estudiante.id ? estudiante : e));
        sileo.success({ title: 'Estudiante actualizado correctamente' });
      }
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      sileo.error({ title: 'Error al actualizar estudiante' });
    }
  };

  const estudiantesFiltrados = useMemo(() => {
    let filtered = estudiantes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.nombres.toLowerCase().includes(term) ||
        e.apellidos.toLowerCase().includes(term) ||
        e.cedulaIdentidad.toLowerCase().includes(term) ||
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term)
      );
    }
    if (filtroNivel) filtered = filtered.filter(e => e.nivel === filtroNivel);
    if (filtroGrado) filtered = filtered.filter(e => e.grado === filtroGrado);
    if (filtroSeccion) filtered = filtered.filter(e => e.seccion === filtroSeccion);
    return filtered;
  }, [estudiantes, searchTerm, filtroNivel, filtroGrado, filtroSeccion]);

  const docentesFiltrados = useMemo(() => {
    let filtered = docentes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d =>
        d.nombres.toLowerCase().includes(term) ||
        d.apellidos.toLowerCase().includes(term) ||
        d.cedulaIdentidad.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        `${d.nombres} ${d.apellidos}`.toLowerCase().includes(term)
      );
    }
    if (filtroNivel) filtered = filtered.filter(d => d.nivel === filtroNivel);
    if (filtroSeccion) filtered = filtered.filter(d => d.seccion === filtroSeccion);
    return filtered;
  }, [docentes, searchTerm, filtroNivel, filtroSeccion]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroNivel('');
    setFiltroGrado('');
    setFiltroSeccion('');
    setFiltroMateria('');
    setNotasEnEdicion({});
  };

  const tieneFiltrosActivos = searchTerm || filtroNivel || filtroGrado || filtroSeccion || filtroMateria;

  const handleEdicionMasiva = async (estudianteIds: string[], nuevoNivel: string, nuevoGrado: string, nuevaSeccion: string) => {
    const estudiantesActualizados = estudiantes.map(e => {
      if (estudianteIds.includes(e.id)) {
        return { ...e, nivel: nuevoNivel || e.nivel, grado: nuevoGrado || e.grado, seccion: nuevaSeccion || e.seccion };
      }
      return e;
    });

    try {
      const response = await fetch('/api/estudiantes/masivo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudiantes: estudiantesActualizados.filter(e => estudianteIds.includes(e.id)) })
      });
      if (response.ok) {
        setEstudiantes(estudiantesActualizados);
        sileo.success({ title: `${estudianteIds.length} estudiantes actualizados` });
      }
    } catch (error) {
      console.error('Error en edicion masiva:', error);
      sileo.error({ title: 'Error en edición masiva' });
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a2e26] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'estudiantes' as const, label: 'Estudiantes', icon: <Users className="w-4 h-4" /> },
    { key: 'docentes' as const, label: 'Docentes', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'notas' as const, label: 'Nóminas de Notas', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'actualizar' as const, label: 'Actualizar Datos', icon: <RefreshCw className="w-4 h-4" /> }
  ];

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
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-white/70 hover:text-white hover:bg-white/5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="hidden sm:block text-emerald-400 font-extrabold tracking-widest text-xs">
            GESTIÓN INSTITUTO
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1.5 text-xs font-semibold">
            {tabActiva === 'estudiantes' && `${estudiantes.length} estudiantes`}
            {tabActiva === 'docentes' && `${docentes.length} docentes`}
            {tabActiva === 'notas' && `${notas.length} notas`}
            {tabActiva === 'actualizar' && 'Actualizar'}
          </Badge>
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

      {/* MAIN */}
      <main className="relative z-10 max-w-350 mx-auto px-4 sm:px-[8%] py-6">
        <Card className="bg-white/3 backdrop-blur-xl border-white/5 overflow-hidden rounded-3xl">
          {/* TABS */}
          <div className="flex gap-0 px-4 sm:px-10 border-b border-white/5 bg-black/10 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setTabActiva(tab.key); limpiarFiltros(); }}
                className={`px-6 sm:px-8 py-4 text-sm sm:text-base font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  tabActiva === tab.key
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                    : 'border-transparent text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            <button
              onClick={() => router.push('/dashboard/horarios')}
              className="px-6 sm:px-8 py-4 text-sm sm:text-base font-bold transition-all whitespace-nowrap flex items-center gap-2 bg-emerald-500 text-emerald-950 hover:bg-emerald-400 rounded-lg my-2 ml-2 shadow-lg shadow-emerald-500/20"
            >
              <CalendarDays className="w-4 h-4" />
              Horarios
            </button>
          </div>

          {/* HEADER */}
          <CardHeader className="px-4 sm:px-10 py-6 sm:py-8 bg-emerald-500/5 border-b border-white/5 flex flex-row justify-between items-center flex-wrap gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-black text-white m-0">
                {tabActiva === 'estudiantes' && 'Gestión de Estudiantes'}
                {tabActiva === 'docentes' && 'Gestión de Docentes'}
                {tabActiva === 'notas' && 'Nóminas de Notas'}
                {tabActiva === 'actualizar' && 'Actualizar Datos de Estudiantes'}
              </CardTitle>
              <p className="text-gray-400 text-sm sm:text-base m-0">
                {tabActiva === 'estudiantes' && `Total: ${estudiantes.length} estudiantes registrados`}
                {tabActiva === 'docentes' && `Total: ${docentes.length} docentes registrados`}
                {tabActiva === 'notas' && 'Crea, edita y exporta nóminas de calificaciones'}
                {tabActiva === 'actualizar' && `Seleccione los estudiantes para actualizar`}
              </p>
            </div>

            {tabActiva === 'notas' && (
              <Button
                onClick={() => setModoCrearNomina(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Nómina
              </Button>
            )}
          </CardHeader>

          <CardContent className="px-4 sm:px-10 py-6 sm:py-8 space-y-6">
            {/* FILTROS GENERALES (excepto en la pestaña notas) */}
            {tabActiva !== 'notas' && (
              <>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                    <Input
                      type="text"
                      placeholder={
                        tabActiva === 'estudiantes' ? 'Buscar por nombre, apellido o cedula...' :
                        tabActiva === 'docentes' ? 'Buscar por nombre, apellido, cedula o email...' :
                        'Buscar estudiantes por nombre, apellido o cedula...'
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-black/30 border-white/10 text-white pl-12 pr-12 h-14 text-base"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Select
                      value={filtroNivel || 'all'}
                      onValueChange={(v) => {
                        setFiltroNivel(v === 'all' ? '' : (v ?? ''));
                        setFiltroGrado('');
                      }}
                    >
                      <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                        <SelectValue placeholder="Todos los niveles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los niveles</SelectItem>
                        {niveles.map((n) => (
                          <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(tabActiva === 'estudiantes' || tabActiva === 'actualizar') && (
                      <Select
                        value={filtroGrado || 'all'}
                        onValueChange={(v) => setFiltroGrado(v === 'all' ? '' : (v ?? ''))}
                        disabled={!filtroNivel}
                      >
                        <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                          <SelectValue placeholder="Todos los grados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grados</SelectItem>
                          {filtroNivel && gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select
                      value={filtroSeccion || 'all'}
                      onValueChange={(v) => setFiltroSeccion(v === 'all' ? '' : (v ?? ''))}
                    >
                      <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                        <SelectValue placeholder="Todas las secciones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las secciones</SelectItem>
                        {secciones.map((s) => (
                          <SelectItem key={s} value={s}>Seccion {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {tieneFiltrosActivos && (
                      <Button
                        variant="outline"
                        onClick={limpiarFiltros}
                        className="border-white/10 text-gray-400 hover:bg-white/5 hover:border-emerald-500/40 h-11"
                      >
                        <X className="w-4 h-4 mr-2" /> Limpiar filtros
                      </Button>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm">
                    {tabActiva === 'estudiantes' && `Mostrando ${estudiantesFiltrados.length} de ${estudiantes.length} estudiantes`}
                    {tabActiva === 'docentes' && `Mostrando ${docentesFiltrados.length} de ${docentes.length} docentes`}
                    {tabActiva === 'actualizar' && `Mostrando ${estudiantesFiltrados.length} de ${estudiantes.length} estudiantes`}
                  </p>
                </div>

                <Separator className="bg-white/5" />
              </>
            )}

            {/* ==================== TAB NOTAS ==================== */}
            {tabActiva === 'notas' && (
              <div className="space-y-6">
                {/* FORMULARIO DE CREACIÓN (si modoCrearNomina) */}
                {modoCrearNomina && (
                  <Card className="bg-emerald-500/5 border-emerald-500/30 rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-emerald-400 text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          Nueva Nómina de Notas
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setModoCrearNomina(false);
                            setCrearGrado('');
                            setCrearSeccion('');
                            setCrearMateria('');
                            setCrearNotas({});
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Filtros de la nueva nómina */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Nivel</Label>
                          <Select value={crearNivel} onValueChange={(v) => {
                            if (v) {
                              setCrearNivel(v);
                              setCrearGrado('');
                              setCrearSeccion('');
                              setCrearMateria('');
                              setCrearNotas({});
                            }
                          }}>
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {niveles.map((n) => (
                                <SelectItem key={n.id} value={n.id}>{n.nombre.replace('Educacion ', '')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Grado / Año</Label>
                          <Select value={crearGrado || 'none'} onValueChange={(v) => {
                            if (v && v !== 'none') {
                              setCrearGrado(v);
                              setCrearSeccion('');
                              setCrearNotas({});
                            }
                          }}>
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Seleccionar</SelectItem>
                              {gradosCrear.map((g) => (
                                <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Sección</Label>
                          <Select value={crearSeccion || 'none'} onValueChange={(v) => {
                            if (v && v !== 'none') {
                              setCrearSeccion(v);
                              setCrearNotas({});
                            }
                          }}>
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Seleccionar</SelectItem>
                              {secciones.map((s) => (
                                <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Materia</Label>
                          <Select value={crearMateria || 'none'} onValueChange={(v) => {
                            if (v && v !== 'none') setCrearMateria(v);
                          }}>
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Seleccionar</SelectItem>
                              {materiasCrear.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Período</Label>
                          <Select value={crearPeriodo} onValueChange={(v) => {
                            if (v) setCrearPeriodo(v);
                          }}>
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {periodos.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tabla de estudiantes para crear la nómina */}
                      {estudiantesCrear.length > 0 ? (
                        <>
                          <div className="rounded-xl border border-white/10 overflow-auto max-h-[400px]">
                            <Table>
                              <TableHeader className="sticky top-0 bg-black/40 backdrop-blur">
                                <TableRow className="bg-black/30 hover:bg-black/30">
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Cédula</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Estudiante</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center w-32">Nota (0-20)</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase w-64">Observación</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {estudiantesCrear.map((est) => {
                                  const valor = crearNotas[est.id] || { nota: '', observacion: '' };
                                  return (
                                    <TableRow key={est.id} className="border-white/5">
                                      <TableCell className="font-mono text-emerald-400 text-sm">{est.cedulaIdentidad}</TableCell>
                                      <TableCell className="text-white">
                                        {est.apellidos}, {est.nombres}
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={20}
                                          step={0.01}
                                          value={valor.nota}
                                          onChange={(e) => setCrearNotas(prev => ({
                                            ...prev,
                                            [est.id]: { nota: e.target.value, observacion: prev[est.id]?.observacion || '' }
                                          }))}
                                          placeholder="—"
                                          className="bg-black/40 border-white/10 text-white text-center h-10 font-bold"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="text"
                                          value={valor.observacion}
                                          onChange={(e) => setCrearNotas(prev => ({
                                            ...prev,
                                            [est.id]: { nota: prev[est.id]?.nota || '', observacion: e.target.value }
                                          }))}
                                          placeholder="Opcional..."
                                          className="bg-black/40 border-white/10 text-white text-sm h-10"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="flex gap-3 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setModoCrearNomina(false);
                                setCrearNotas({});
                              }}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={crearNomina}
                              disabled={guardandoNotas}
                              className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              {guardandoNotas ? 'Guardando...' : 'Guardar Nómina'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          Selecciona nivel, grado y sección para ver los estudiantes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* FILTROS DE NÓMINAS EXISTENTES */}
                <Card className="bg-black/30 border-white/10 backdrop-blur">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider">
                        Filtros de Nóminas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Nivel</Label>
                        <Select value={filtroNivel || 'none'} onValueChange={(v) => {
                          setFiltroNivel(v === 'none' || !v ? '' : v);
                          setFiltroGrado('');
                          setFiltroSeccion('');
                          setFiltroMateria('');
                        }}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Seleccionar</SelectItem>
                            {niveles.map((n) => (
                              <SelectItem key={n.id} value={n.id}>{n.nombre.replace('Educacion ', '')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Grado / Año</Label>
                        <Select value={filtroGrado || 'none'} onValueChange={(v) => {
                          setFiltroGrado(v === 'none' || !v ? '' : v);
                          setFiltroSeccion('');
                        }} disabled={!filtroNivel}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Seleccionar</SelectItem>
                            {filtroNivel && gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                              <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Sección</Label>
                        <Select value={filtroSeccion || 'none'} onValueChange={(v) => {
                          setFiltroSeccion(v === 'none' || !v ? '' : v);
                        }} disabled={!filtroGrado}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Seleccionar</SelectItem>
                            {secciones.map((s) => (
                              <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Materia</Label>
                        <Select value={filtroMateria || 'all'} onValueChange={(v) => setFiltroMateria(v === 'all' || !v ? '' : v)}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {filtroNivel && MATERIAS_POR_NIVEL[filtroNivel]?.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Período</Label>
                        <Select value={filtroPeriodo} onValueChange={(v) => v && setFiltroPeriodo(v)}>
                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {periodos.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Acciones */}
                    {filtroNivel && filtroGrado && filtroSeccion && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={exportarAExcel}
                          disabled={exportando}
                          className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          {exportando ? 'Exportando...' : 'Exportar Excel'}
                        </Button>
                        <Button
                          onClick={guardarNotasMasivo}
                          disabled={Object.keys(notasEnEdicion).length === 0 || guardandoNotas}
                          className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold disabled:opacity-40"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {guardandoNotas ? 'Guardando...' : `Guardar cambios (${Object.keys(notasEnEdicion).length})`}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TABLA DE NÓMINAS EXISTENTES */}
                {!filtroNivel || !filtroGrado || !filtroSeccion ? (
                  <Card className="bg-black/30 border-white/10 backdrop-blur">
                    <CardContent className="p-12 text-center">
                      <ClipboardList className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        Selecciona nivel, grado y sección para ver las nóminas
                      </p>
                    </CardContent>
                  </Card>
                ) : cargandoNotas ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                    <p>Cargando notas...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        {notas.length} nota{notas.length === 1 ? '' : 's'} en esta nómina
                      </Badge>
                      {Object.keys(notasEnEdicion).length > 0 && (
                        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                          {Object.keys(notasEnEdicion).length} sin guardar
                        </Badge>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        placeholder="Buscar por cédula o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/30 border-white/10 text-white pl-11 pr-11 h-11"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {notasFiltradas.length === 0 ? (
                      <Card className="bg-black/30 border-white/10 backdrop-blur">
                        <CardContent className="p-12 text-center">
                          <ClipboardList className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg mb-4">
                            No hay notas para los filtros seleccionados
                          </p>
                          <Button
                            onClick={() => setModoCrearNomina(true)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Nómina
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="rounded-xl border border-white/10 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Cédula</TableHead>
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Estudiante</TableHead>
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Materia</TableHead>
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Período</TableHead>
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center w-32">Nota</TableHead>
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Observación</TableHead>
                              <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center w-24">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {notasFiltradas.map((n) => {
                              const enEdicion = notasEnEdicion[n.id];
                              const notaMostrar = enEdicion ? enEdicion.nota : n.nota;
                              const obsMostrar = enEdicion ? enEdicion.observacion : (n.observacion || '');
                              const esAprobado = notaMostrar >= 10;

                              return (
                                <TableRow key={n.id} className="border-white/5 hover:bg-white/5">
                                  <TableCell className="font-mono text-emerald-400 text-sm">{n.cedulaIdentidad || '-'}</TableCell>
                                  <TableCell className="text-white">
                                    {n.apellidos}, {n.nombres}
                                  </TableCell>
                                  <TableCell className="text-gray-300 text-sm">{n.materia}</TableCell>
                                  <TableCell className="text-gray-300 text-sm">{n.periodo}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={20}
                                      step={0.01}
                                      value={notaMostrar}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= 20) {
                                          setNotasEnEdicion(prev => ({
                                            ...prev,
                                            [n.id]: { nota: val, observacion: obsMostrar }
                                          }));
                                        }
                                      }}
                                      className={`bg-black/40 border-white/10 text-center h-10 font-bold ${
                                        esAprobado ? 'text-green-400' : 'text-red-400'
                                      }`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="text"
                                      value={obsMostrar}
                                      onChange={(e) => {
                                        setNotasEnEdicion(prev => ({
                                          ...prev,
                                          [n.id]: { nota: notaMostrar, observacion: e.target.value }
                                        }));
                                      }}
                                      placeholder="Opcional..."
                                      className="bg-black/40 border-white/10 text-white text-sm h-10"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => eliminarNota(n.id)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                      title="Eliminar nota"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB ESTUDIANTES */}
            {tabActiva === 'estudiantes' && (
              <div className="rounded-xl border border-white/5 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/20 hover:bg-black/20">
                      {['Cedula', 'Nombres', 'Apellidos', 'Fecha Nac.', 'Nivel', 'Grado', 'Seccion', 'Telefono', 'Correo'].map((h) => (
                        <TableHead key={h} className="text-emerald-400 font-bold text-xs uppercase">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantesFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                          No se encontraron estudiantes
                        </TableCell>
                      </TableRow>
                    ) : (
                      estudiantesFiltrados.map((e) => (
                        <TableRow key={e.id} className="border-white/5 hover:bg-white/5">
                          <TableCell>
                            <span className="font-mono font-semibold text-emerald-400">{e.cedulaIdentidad}</span>
                          </TableCell>
                          <TableCell className="text-white">{e.nombres}</TableCell>
                          <TableCell className="text-white">{e.apellidos}</TableCell>
                          <TableCell className="text-white">{formatFecha(e.fechaNacimiento)}</TableCell>
                          <TableCell className="text-white">{niveles.find(n => n.id === e.nivel)?.nombre || '-'}</TableCell>
                          <TableCell className="text-white">{e.grado}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              {e.seccion}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{e.numeroTelefonoCelular || '-'}</TableCell>
                          <TableCell className="text-gray-400 text-sm">{e.correoElectronico}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* TAB DOCENTES */}
            {tabActiva === 'docentes' && (
              <div className="rounded-xl border border-white/5 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/20 hover:bg-black/20">
                      {['Cedula', 'Nombres', 'Apellidos', 'Email', 'Telefono', 'Nivel', 'Seccion', 'Contratacion', 'Estado'].map((h) => (
                        <TableHead key={h} className="text-emerald-400 font-bold text-xs uppercase">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docentesFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                          No se encontraron docentes
                        </TableCell>
                      </TableRow>
                    ) : (
                      docentesFiltrados.map((d) => (
                        <TableRow key={d.id} className="border-white/5 hover:bg-white/5">
                          <TableCell>
                            <span className="font-mono font-semibold text-emerald-400">{d.cedulaIdentidad}</span>
                          </TableCell>
                          <TableCell className="text-white">{d.nombres}</TableCell>
                          <TableCell className="text-white">{d.apellidos}</TableCell>
                          <TableCell className="text-gray-400 text-sm">{d.email}</TableCell>
                          <TableCell className="text-white">{d.telefono || '-'}</TableCell>
                          <TableCell className="text-white">{niveles.find(n => n.id === d.nivel)?.nombre || '-'}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              {d.seccion || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">{formatFecha(d.fechaContratacion)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                d.activo
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                              }
                            >
                              {d.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* TAB ACTUALIZAR */}
            {tabActiva === 'actualizar' && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <p className="text-gray-300 text-sm m-0">
                    Seleccione los estudiantes que desea actualizar y luego elija el nuevo nivel, grado o seccion
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-black/20 hover:bg-black/20">
                        <TableHead className="w-12.5 text-center">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const checkboxes = document.querySelectorAll('input[type="checkbox"][data-estudiante]');
                              checkboxes.forEach((cb: any) => cb.checked = e.target.checked);
                            }}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                        </TableHead>
                        {['Cedula', 'Nombres', 'Apellidos', 'Nivel', 'Grado', 'Seccion'].map((h) => (
                          <TableHead key={h} className="text-emerald-400 font-bold text-xs uppercase">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estudiantesFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                            No se encontraron estudiantes
                          </TableCell>
                        </TableRow>
                      ) : (
                        estudiantesFiltrados.map((e) => (
                          <TableRow key={e.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="text-center">
                              <input
                                type="checkbox"
                                data-estudiante={e.id}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="font-mono font-semibold text-emerald-400">{e.cedulaIdentidad}</span>
                            </TableCell>
                            <TableCell className="text-white">{e.nombres}</TableCell>
                            <TableCell className="text-white">{e.apellidos}</TableCell>
                            <TableCell className="text-white">{niveles.find(n => n.id === e.nivel)?.nombre || '-'}</TableCell>
                            <TableCell className="text-white">{e.grado}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                {e.seccion}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-wrap gap-4 p-6 bg-white/3 rounded-xl items-center justify-center border border-white/5">
                  <select
                    id="nuevoNivel"
                    defaultValue=""
                    className="bg-black/30 border border-white/10 rounded-lg text-white min-w-45 h-11 px-3 outline-none cursor-pointer focus:border-emerald-500/60"
                  >
                    <option value="" className="text-black">Mantener nivel</option>
                    {niveles.map((n) => (
                      <option key={n.id} value={n.id} className="text-black">{n.nombre}</option>
                    ))}
                  </select>

                  <select
                    id="nuevoGrado"
                    defaultValue=""
                    className="bg-black/30 border border-white/10 rounded-lg text-white min-w-45 h-11 px-3 outline-none cursor-pointer focus:border-emerald-500/60"
                  >
                    <option value="" className="text-black">Mantener grado</option>
                    {filtroNivel && gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                      <option key={g.id} value={g.id} className="text-black">{g.nombre}</option>
                    ))}
                  </select>

                  <select
                    id="nuevaSeccion"
                    defaultValue=""
                    className="bg-black/30 border border-white/10 rounded-lg text-white min-w-45 h-11 px-3 outline-none cursor-pointer focus:border-emerald-500/60"
                  >
                    <option value="" className="text-black">Mantener seccion</option>
                    {secciones.map((s) => (
                      <option key={s} value={s} className="text-black">Seccion {s}</option>
                    ))}
                  </select>

                  <Button
                    onClick={() => {
                      const checkboxes = document.querySelectorAll('input[type="checkbox"][data-estudiante]:checked');
                      const ids = Array.from(checkboxes).map((cb: any) => cb.dataset.estudiante);
                      if (ids.length === 0) {
                        sileo.warning({ title: 'Sin selección', description: 'Seleccione al menos un estudiante' });
                        return;
                      }
                      const nuevoNivel = (document.getElementById('nuevoNivel') as HTMLSelectElement)?.value;
                      const nuevoGrado = (document.getElementById('nuevoGrado') as HTMLSelectElement)?.value;
                      const nuevaSeccion = (document.getElementById('nuevaSeccion') as HTMLSelectElement)?.value;
                      if (!nuevoNivel && !nuevoGrado && !nuevaSeccion) {
                        sileo.warning({ title: 'Sin cambios', description: 'Seleccione al menos un campo para actualizar' });
                        return;
                      }
                      handleEdicionMasiva(ids, nuevoNivel, nuevoGrado, nuevaSeccion);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                  >
                    Actualizar Seleccionados
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de confirmación */}
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

// ========== COMPONENTE CONFIRM DIALOG ==========

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  abierto,
  titulo,
  descripcion,
  onConfirm,
  onCancel,
}) => {
  if (!abierto) return null;

  return (
    <div
      className="liquid-overlay fixed inset-0 z-2000 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="liquid-modal rounded-3xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content p-8 space-y-5">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-white font-bold text-xl m-0">{titulo}</h2>
            <p className="text-gray-400 text-sm m-0">{descripcion}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-white/15 text-white hover:bg-white/10 rounded-xl h-11"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl h-11"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionInstitutoPage;