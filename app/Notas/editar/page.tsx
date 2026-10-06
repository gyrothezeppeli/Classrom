// app/Notas/editar/page.tsx
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
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  danger: '#ef4444'
};

const MATERIAS_POR_NIVEL = {
  inicial: ['Lenguaje y Comunicación', 'Matemáticas', 'Expresión Artística', 'Educación Física'],
  primaria: ['Castellano', 'Matemáticas', 'Ciencias Sociales', 'Ciencias Naturales', 'Inglés', 'Educación Artística', 'Educación Física'],
  media: ['Castellano', 'Matemáticas', 'Historia', 'Geografía', 'Biología', 'Química', 'Física', 'Inglés', 'G.H.C', 'Ciencias de la Tierra', 'Educación Física', 'Arte y Patrimonio', 'Informática']
};

const PERIODOS = ['1er Lapso', '2do Lapso', '3er Lapso'];

// ============ TIPOS ============
interface Nota {
  id: string;
  estudianteId: string;
  materia: string;
  nivel: string;
  grado: string;
  seccion: string;
  periodo: string;
  nota: number;
  observacion?: string;
  docenteId?: string;
  createdAt: string;
  updatedAt: string;
  estudiante?: {
    id: string;
    nombres: string;
    apellidos: string;
    cedulaIdentidad: string;
  };
}

interface DocenteInfo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

const EditarNotasPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ============ ESTADOS ============
  const [docenteInfo, setDocenteInfo] = useState<DocenteInfo | null>(null);
  const [cargandoDocente, setCargandoDocente] = useState(true);

  const [notas, setNotas] = useState<Nota[]>([]);
  const [cargandoNotas, setCargandoNotas] = useState(true);

  // Filtros
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroGrado, setFiltroGrado] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('');
  const [filtroMateria, setFiltroMateria] = useState<string>('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');

  // Edición inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [notaEditada, setNotaEditada] = useState<string>('');
  const [observacionEditada, setObservacionEditada] = useState<string>('');
  const [guardando, setGuardando] = useState(false);

  // Confirmación
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

  const gradosPorNivel = {
    inicial: ['1er nivel', '2do nivel', '3er nivel'],
    primaria: ['1ro', '2do', '3ro', '4to', '5to', '6to'],
    media: ['1ro', '2do', '3ro', '4to', '5to']
  };

  const gradosDisponibles = filtroNivel ? gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel] || [] : [];
  const materiasDisponibles = filtroNivel ? MATERIAS_POR_NIVEL[filtroNivel as keyof typeof MATERIAS_POR_NIVEL] || [] : [];

  // ============ CARGA DE DOCENTE ============
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
            email: data.email || ''
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

  // ============ CARGA DE NOTAS ============
  const cargarNotas = async () => {
    try {
      setCargandoNotas(true);
      const params = new URLSearchParams();
      if (filtroNivel) params.append('nivel', filtroNivel);
      if (filtroGrado) params.append('grado', filtroGrado);
      if (filtroSeccion) params.append('seccion', filtroSeccion);
      if (filtroMateria) params.append('materia', filtroMateria);
      if (filtroPeriodo) params.append('periodo', filtroPeriodo);

      const url = `/api/notas${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        // Cargar estudiantes para enriquecer las notas
        const estudiantesRes = await fetch('/api/estudiantes');
        const estudiantes = estudiantesRes.ok ? await estudiantesRes.json() : [];

        const notasConEstudiante = data.map((nota: any) => {
          const est = estudiantes.find((e: any) => e.id === nota.estudianteId);
          return {
            ...nota,
            estudiante: est ? {
              id: est.id,
              nombres: est.nombres,
              apellidos: est.apellidos,
              cedulaIdentidad: est.cedulaIdentidad
            } : undefined
          };
        });

        setNotas(notasConEstudiante);
      } else {
        setNotas([]);
      }
    } catch (error) {
      console.error('Error al cargar notas:', error);
      sileo.error({ title: 'Error al cargar notas' });
      setNotas([]);
    } finally {
      setCargandoNotas(false);
    }
  };

  useEffect(() => {
    cargarNotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroNivel, filtroGrado, filtroSeccion, filtroMateria, filtroPeriodo]);

  // ============ FILTRADO LOCAL ============
  const notasFiltradas = useMemo(() => {
    let filtradas = [...notas];

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      filtradas = filtradas.filter(n => {
        const nombreCompleto = `${n.estudiante?.nombres || ''} ${n.estudiante?.apellidos || ''}`.toLowerCase();
        const cedula = (n.estudiante?.cedulaIdentidad || '').toLowerCase();
        return nombreCompleto.includes(term) || cedula.includes(term);
      });
    }

    return filtradas.sort((a, b) => {
      const apA = a.estudiante?.apellidos || '';
      const apB = b.estudiante?.apellidos || '';
      return apA.localeCompare(apB);
    });
  }, [notas, busqueda]);

  // ============ EDICIÓN ============
  const iniciarEdicion = (nota: Nota) => {
    setEditandoId(nota.id);
    setNotaEditada(nota.nota.toString());
    setObservacionEditada(nota.observacion || '');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNotaEditada('');
    setObservacionEditada('');
  };

  const guardarEdicion = async (nota: Nota) => {
    const numNota = parseFloat(notaEditada.replace(',', '.'));
    if (isNaN(numNota) || numNota < 0 || numNota > 20) {
      sileo.warning({ title: 'Nota inválida', description: 'Debe estar entre 0 y 20' });
      return;
    }

    try {
      setGuardando(true);
      const response = await fetch(`/api/notas/${nota.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nota: numNota,
          observacion: observacionEditada
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        sileo.error({ title: 'Error al guardar', description: errorData.error || 'Intente de nuevo' });
        return;
      }

      sileo.success({ title: 'Nota actualizada correctamente' });

      // Actualizar localmente sin recargar
      setNotas(prev => prev.map(n =>
        n.id === nota.id
          ? { ...n, nota: numNota, observacion: observacionEditada, updatedAt: new Date().toISOString() }
          : n
      ));

      cancelarEdicion();
    } catch (error) {
      console.error('Error al guardar edición:', error);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardando(false);
    }
  };

  // ============ ELIMINAR ============
  const eliminarNota = (nota: Nota) => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Eliminar esta nota?',
      descripcion: `${nota.estudiante?.nombres} ${nota.estudiante?.apellidos} — ${nota.materia} — ${nota.periodo}`,
      onConfirm: async () => {
        setConfirmacion(null);
        try {
          const response = await fetch(`/api/notas/${nota.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            sileo.success({ title: 'Nota eliminada' });
            setNotas(prev => prev.filter(n => n.id !== nota.id));
          } else {
            sileo.error({ title: 'Error al eliminar' });
          }
        } catch (error) {
          console.error('Error al eliminar:', error);
          sileo.error({ title: 'Error de conexión' });
        }
      }
    });
  };

  // ============ LIMPIAR FILTROS ============
  const limpiarFiltros = () => {
    setFiltroNivel('');
    setFiltroGrado('');
    setFiltroSeccion('');
    setFiltroMateria('');
    setFiltroPeriodo('');
    setBusqueda('');
  };

  const hayFiltrosActivos = filtroNivel || filtroGrado || filtroSeccion || filtroMateria || filtroPeriodo || busqueda;

  // ============ ESTADÍSTICAS ============
  const estadisticas = useMemo(() => {
    if (notasFiltradas.length === 0) {
      return { promedio: 0, aprobados: 0, reprobados: 0, total: 0 };
    }
    const valores = notasFiltradas.map(n => n.nota);
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    return {
      promedio: promedio.toFixed(2),
      aprobados: valores.filter(v => v >= 10).length,
      reprobados: valores.filter(v => v < 10).length,
      total: valores.length
    };
  }, [notasFiltradas]);

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

  if (status === 'unauthenticated') return null;

  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif", background: PALETTE.deepBg }}
    >
      <div className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }} />
      <div className="fixed inset-0 bg-[#0a1410]/50 z-0 pointer-events-none" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-[8%] py-3 bg-[#1a2e26]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/Notas')}
            className="border-white/20 text-white hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-xl h-9 w-9 transition-all"
            title="Volver a gestión de notas">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-emerald-400 font-extrabold tracking-widest text-xs">EDITAR NOTAS</div>
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
          <Button variant="ghost" size="sm" onClick={handleCerrarSesion}
            className="text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Salir</span>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-350 mx-auto px-4 sm:px-[8%] py-6">
        {/* HEADER */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight flex items-center justify-center gap-3">
            <Pencil className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            EDITAR NOTAS
          </h1>
          <p className="text-white/60 text-base">
            Consulta, edita y elimina las notas guardadas
          </p>
        </header>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-emerald-500/10 border-emerald-500/30 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{estadisticas.promedio}</div>
              <div className="text-[0.65rem] uppercase text-emerald-400/70 font-bold mt-1">Promedio</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-green-400">{estadisticas.aprobados}</div>
              <div className="text-[0.65rem] uppercase text-green-400/70 font-bold mt-1">Aprobados (≥10)</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-red-400">{estadisticas.reprobados}</div>
              <div className="text-[0.65rem] uppercase text-red-400/70 font-bold mt-1">Reprobados (&lt;10)</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-black text-blue-400">{estadisticas.total}</div>
              <div className="text-[0.65rem] uppercase text-blue-400/70 font-bold mt-1">Total notas</div>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS */}
        <Card className="bg-black/30 border-white/10 backdrop-blur mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider">
                Filtros de búsqueda
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Nivel */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Nivel</Label>
                <Select value={filtroNivel || 'all'} onValueChange={(v) => {
                  setFiltroNivel(v === 'all' ? '' : (v ?? ''));
                  setFiltroGrado('');
                  setFiltroMateria('');
                }}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    {niveles.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.nombre.replace('Educación ', '')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grado */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Grado</Label>
                <Select value={filtroGrado || 'all'} onValueChange={(v) => setFiltroGrado(v === 'all' ? '' : (v ?? ''))}
                  disabled={!filtroNivel}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grados</SelectItem>
                    {gradosDisponibles.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sección */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Sección</Label>
                <Select value={filtroSeccion || 'all'} onValueChange={(v) => setFiltroSeccion(v === 'all' ? '' : (v ?? ''))}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {['A', 'B', 'C', 'D', 'E'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Materia */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Materia</Label>
                <Select value={filtroMateria || 'all'} onValueChange={(v) => setFiltroMateria(v === 'all' ? '' : (v ?? ''))}
                  disabled={!filtroNivel}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las materias</SelectItem>
                    {materiasDisponibles.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Período</Label>
                <Select value={filtroPeriodo || 'all'} onValueChange={(v) => setFiltroPeriodo(v === 'all' ? '' : (v ?? ''))}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {PERIODOS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {hayFiltrosActivos && (
                  <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {notasFiltradas.length} {notasFiltradas.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                )}
                {!hayFiltrosActivos && (
                  <span className="text-[0.65rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {notas.length} notas totales
                  </span>
                )}
              </div>
              {hayFiltrosActivos && (
                <Button variant="outline" size="sm" onClick={limpiarFiltros}
                  className="border-white/10 text-gray-400 hover:bg-white/5 hover:border-emerald-500/40 h-8 text-xs">
                  <X className="w-3.5 h-3.5 mr-1.5" /> Limpiar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TABLA DE NOTAS */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-emerald-400 text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Notas Registradas
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarNotas}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Recargar
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o cédula del estudiante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-black/30 border-white/10 text-white pl-11 pr-11 h-11 text-sm"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Separator className="bg-white/5" />

            {cargandoNotas ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p>Cargando notas...</p>
              </div>
            ) : notasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                <p className="text-lg">No hay notas registradas</p>
                <p className="text-sm mt-2">
                  {hayFiltrosActivos
                    ? 'Prueba cambiando los filtros de búsqueda'
                    : 'Ve a "Gestión de Notas" para crear las primeras'}
                </p>
                <Button onClick={() => router.push('/Notas')}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Ir a Gestión de Notas
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/30 hover:bg-black/30">
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase">Estudiante</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase">Cédula</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase">Materia</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase text-center">Nivel/Grado</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase text-center">Secc</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase text-center">Período</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase text-center w-32">Nota</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase">Observación</TableHead>
                      <TableHead className="text-emerald-400 font-bold text-xs uppercase text-center w-32">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notasFiltradas.map((nota) => {
                      const estaEditando = editandoId === nota.id;
                      const numNota = estaEditando ? parseFloat(notaEditada) : nota.nota;
                      const aprobado = !isNaN(numNota) && numNota >= 10;
                      const reprobado = !isNaN(numNota) && numNota < 10;

                      return (
                        <TableRow key={nota.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell>
                            <div className="text-white font-medium">
                              {nota.estudiante?.apellidos}, {nota.estudiante?.nombres}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-emerald-400 text-sm">
                              {nota.estudiante?.cedulaIdentidad || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-white text-sm">{nota.materia}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-300 text-xs">{nota.grado}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                              {nota.seccion}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-300 text-xs">{nota.periodo}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {estaEditando ? (
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                step={0.01}
                                value={notaEditada}
                                onChange={(e) => setNotaEditada(e.target.value)}
                                autoFocus
                                className={`bg-black/60 border-emerald-500/50 text-white text-center h-9 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  aprobado ? 'text-green-400' : reprobado ? 'text-red-400' : ''
                                }`}
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className={`font-bold text-lg ${
                                  aprobado ? 'text-green-400' : reprobado ? 'text-red-400' : 'text-white'
                                }`}>
                                  {nota.nota.toFixed(2)}
                                </span>
                                {aprobado && <Check className="w-4 h-4 text-green-400" />}
                                {reprobado && <AlertCircle className="w-4 h-4 text-red-400" />}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {estaEditando ? (
                              <Input
                                type="text"
                                value={observacionEditada}
                                onChange={(e) => setObservacionEditada(e.target.value)}
                                placeholder="Observación..."
                                className="bg-black/60 border-emerald-500/50 text-white text-sm h-9"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">
                                {nota.observacion || <span className="italic opacity-50">Sin observación</span>}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-center">
                              {estaEditando ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => guardarEdicion(nota)}
                                    disabled={guardando}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 h-8 w-8 p-0"
                                    title="Guardar"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelarEdicion}
                                    disabled={guardando}
                                    className="border-white/20 text-white h-8 w-8 p-0"
                                    title="Cancelar"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => iniciarEdicion(nota)}
                                    className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-8 w-8 p-0"
                                    title="Editar"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => eliminarNota(nota)}
                                    className="h-8 w-8 p-0"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Info */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 leading-relaxed m-0 flex items-start gap-2">
                <Pencil className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Haz clic en el ícono <Pencil className="inline w-3 h-3" /> para editar una nota o en <Trash2 className="inline w-3 h-3" /> para eliminarla.
                  Los cambios se guardan individualmente.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
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

export default EditarNotasPage;