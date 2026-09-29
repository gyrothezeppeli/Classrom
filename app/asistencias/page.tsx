// app/asistencia/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { sileo } from 'sileo';

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Check,
  X,
  Save,
  Users,
  Search,
  LogOut,
  ArrowLeft,
  Trash2,
  BarChart3,
  History,
  Download,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';

const PALETTE = { deepBg: '#1a2e26' };

const MATERIAS_POR_NIVEL = {
  inicial: ['Lenguaje y Comunicación', 'Matemáticas', 'Expresión Artística', 'Educación Física'],
  primaria: ['Castellano', 'Matemáticas', 'Ciencias Sociales', 'Ciencias Naturales', 'Inglés', 'Educación Artística', 'Educación Física'],
  media: ['Castellano', 'Matemáticas', 'Historia', 'Geografía', 'Biología', 'Química', 'Física', 'Inglés', 'G.H.C', 'Ciencias de la Tierra', 'Educación Física', 'Arte y Patrimonio', 'Informática'],
};

const gradosPorNivel = {
  inicial: [
    { id: '1er nivel', nombre: '1er Nivel', secciones: [] as string[] },
    { id: '2do nivel', nombre: '2do Nivel', secciones: [] as string[] },
    { id: '3er nivel', nombre: '3er Nivel', secciones: [] as string[] },
  ],
  primaria: [
    { id: '1ro', nombre: '1er Grado', secciones: ['A', 'B', 'C', 'D'] },
    { id: '2do', nombre: '2do Grado', secciones: ['A', 'B', 'C', 'D'] },
    { id: '3ro', nombre: '3er Grado', secciones: ['A', 'B', 'C'] },
    { id: '4to', nombre: '4to Grado', secciones: ['A', 'B', 'C'] },
    { id: '5to', nombre: '5to Grado', secciones: ['A', 'B', 'C'] },
    { id: '6to', nombre: '6to Grado', secciones: ['A', 'B', 'C'] },
  ],
  media: [
    { id: '1ro', nombre: '1er Año', secciones: ['A', 'B', 'C', 'D'] },
    { id: '2do', nombre: '2do Año', secciones: ['A', 'B', 'C', 'D'] },
    { id: '3ro', nombre: '3er Año', secciones: ['A', 'B', 'C'] },
    { id: '4to', nombre: '4to Año', secciones: ['A', 'B', 'C'] },
    { id: '5to', nombre: '5to Año', secciones: ['A', 'B'] },
  ],
};

type Vista = 'pasar-lista' | 'reporte' | 'historial';

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  correoElectronico: string;
}

interface DocenteInfo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

interface ReporteItem {
  estudianteId: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  totalClases: number;
  presentes: number;
  ausentes: number;
  porcentajeInasistencia: number;
}

interface Asistencia {
  id: string;
  fecha: string;
  nivel: string;
  grado: string;
  seccion: string;
  materia: string;
  hora: string | null;
  totalEstudiantes: number;
  docente: string;
}

export default function AsistenciaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [docenteInfo, setDocenteInfo] = useState<DocenteInfo | null>(null);
  const [cargandoDocente, setCargandoDocente] = useState(true);

  const [vista, setVista] = useState<Vista>('pasar-lista');

  // Filtros comunes
  const [nivel, setNivel] = useState('media');
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [materia, setMateria] = useState('');

  // Pasar lista
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [asistencia, setAsistencia] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [asistenciaExistente, setAsistenciaExistente] = useState(false);

  // Reporte
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [reporte, setReporte] = useState<{ mes: string; totalSesiones: number; totalEstudiantes: number; reporte: ReporteItem[] } | null>(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);

  // Historial
  const [historial, setHistorial] = useState<Asistencia[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  // ============ Cargar docente ============
  useEffect(() => {
    if (status !== 'authenticated') return;
    const cargar = async () => {
      try {
        setCargandoDocente(true);
        const res = await fetch('/api/docentes?me=true');
        if (res.ok) {
          const data = await res.json();
          setDocenteInfo({
            id: data.id,
            nombres: data.nombre || data.nombres || '',
            apellidos: data.apellido || data.apellidos || '',
            email: data.email || '',
          });
        }
      } catch (error) {
        console.error('Error al cargar docente:', error);
      } finally {
        setCargandoDocente(false);
      }
    };
    cargar();
  }, [status]);

  const gradosActuales = gradosPorNivel[nivel as keyof typeof gradosPorNivel] || [];
  const seccionesActuales = grado ? gradosActuales.find(g => g.id === grado)?.secciones || [] : [];
  const materiasDisponibles = MATERIAS_POR_NIVEL[nivel as keyof typeof MATERIAS_POR_NIVEL] || [];

  // ============ Cargar estudiantes + asistencia existente del día ============
  const cargarEstudiantes = async () => {
    if (!nivel || !grado || !seccion) return;
    try {
      setCargandoEstudiantes(true);

      // 1. Cargar estudiantes del curso
      const res = await fetch(`/api/asistencia/estudiantes?nivel=${nivel}&grado=${grado}&seccion=${seccion}`);
      if (!res.ok) return;
      const data: Estudiante[] = await res.json();
      setEstudiantes(data);

      // 2. Buscar si ya hay asistencia guardada para ese día
      let asistenciasExistentes: Record<string, boolean> = {};
      let existeRegistro = false;

      if (materia && fecha) {
        const params = new URLSearchParams({
          nivel, grado, seccion, materia,
          fechaDesde: fecha,
          fechaHasta: fecha,
        });
        const asistenciaRes = await fetch(`/api/asistencia?${params}`);

        if (asistenciaRes.ok) {
          const asistenciasGuardadas = await asistenciaRes.json();
          if (asistenciasGuardadas.length > 0) {
            existeRegistro = true;
            const asistenciaDelDia = asistenciasGuardadas[0];
            const detalleRes = await fetch(`/api/asistencia/${asistenciaDelDia.id}`);

            if (detalleRes.ok) {
              const detalle = await detalleRes.json();
              detalle.estudiantes?.forEach((ae: any) => {
                asistenciasExistentes[ae.estudianteId] = ae.asistio;
              });
            }
          }
        }
      }

      setAsistenciaExistente(existeRegistro);

      // 3. Inicializar estado: si había registro previo, usarlo; si no, todos presentes
      const iniciales: Record<string, boolean> = {};
      data.forEach((e) => {
        iniciales[e.id] = asistenciasExistentes[e.id] ?? true;
      });
      setAsistencia(iniciales);
    } catch (error) {
      console.error(error);
      sileo.error({ title: 'Error al cargar estudiantes' });
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  useEffect(() => {
    if (vista === 'pasar-lista' && nivel && grado && seccion) cargarEstudiantes();
  }, [vista, nivel, grado, seccion, materia, fecha]);

  // ============ Cargar historial ============
  const cargarHistorial = async () => {
    if (!docenteInfo?.id) return;
    try {
      setCargandoHistorial(true);
      const params = new URLSearchParams({ docenteId: docenteInfo.id });
      if (nivel) params.set('nivel', nivel);
      if (grado) params.set('grado', grado);
      if (seccion) params.set('seccion', seccion);
      if (materia) params.set('materia', materia);

      const res = await fetch(`/api/asistencia?${params}`);
      if (res.ok) setHistorial(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    if (vista === 'historial') cargarHistorial();
  }, [vista, nivel, grado, seccion, materia, docenteInfo]);

  // ============ Cargar reporte ============
  const cargarReporte = async () => {
    if (!nivel || !grado || !seccion || !mes) return;
    try {
      setCargandoReporte(true);
      const params = new URLSearchParams({ nivel, grado, seccion, mes });
      if (materia) params.set('materia', materia);

      const res = await fetch(`/api/asistencia/reporte?${params}`);
      if (res.ok) setReporte(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoReporte(false);
    }
  };

  useEffect(() => {
    if (vista === 'reporte' && nivel && grado && seccion) cargarReporte();
  }, [vista, nivel, grado, seccion, materia, mes]);

  // ============ Acciones ============
  const toggleAsistencia = (id: string) => {
    setAsistencia(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const marcarTodos = (valor: boolean) => {
    const nuevos: Record<string, boolean> = {};
    estudiantes.forEach((e) => { nuevos[e.id] = valor; });
    setAsistencia(nuevos);
  };

  const guardar = async () => {
    if (!docenteInfo?.id) return sileo.error({ title: 'Docente no identificado' });
    if (!materia) return sileo.error({ title: 'Selecciona una materia' });
    if (estudiantes.length === 0) return sileo.error({ title: 'No hay estudiantes' });

    try {
      setGuardando(true);
      const asistencias = estudiantes.map((e) => ({
        estudianteId: e.id,
        asistio: asistencia[e.id] ?? true,
      }));

      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivel, grado, seccion, materia, docenteId: docenteInfo.id,
          fecha, hora, observaciones,
          asistencias,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        sileo.error({ title: 'Error al guardar', description: err.error });
        return;
      }

      const data = await res.json();

      // ✅ Mensaje diferenciado según si fue creada o actualizada
      sileo.success({
        title: data.actualizada ? 'Asistencia actualizada' : 'Asistencia guardada',
        description: `${data.presentes} presentes, ${data.ausentes} ausentes`,
      });

      cargarEstudiantes();
    } catch (error) {
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardando(false);
    }
  };

  const eliminarAsistencia = (id: string) => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Eliminar registro?',
      descripcion: 'Esta acción no se puede deshacer',
      onConfirm: async () => {
        setConfirmacion(null);
        const res = await fetch(`/api/asistencia/${id}`, { method: 'DELETE' });
        if (res.ok) {
          sileo.success({ title: 'Registro eliminado' });
          cargarHistorial();
        }
      },
    });
  };

  const exportarCSV = () => {
    if (!reporte) return;
    const headers = ['Cédula', 'Apellidos', 'Nombres', 'Total Clases', 'Presentes', 'Ausentes', '% Inasistencia'];
    const rows = reporte.reporte.map(r => [
      r.cedulaIdentidad,
      r.apellidos,
      r.nombres,
      r.totalClases,
      r.presentes,
      r.ausentes,
      r.porcentajeInasistencia.toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_asistencia_${reporte.mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  // ============ Cálculos ============
  const totales = useMemo(() => {
    const values = Object.values(asistencia);
    return {
      presentes: values.filter(v => v).length,
      ausentes: values.filter(v => !v).length,
      total: values.length,
    };
  }, [asistencia]);

  const estudiantesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return estudiantes;
    const t = busqueda.toLowerCase();
    return estudiantes.filter(e =>
      e.nombres.toLowerCase().includes(t) ||
      e.apellidos.toLowerCase().includes(t) ||
      e.cedulaIdentidad.toLowerCase().includes(t)
    );
  }, [estudiantes, busqueda]);

  // ============ Loader ============
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

  // ============ Render ============
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/editar')}
            className="border-white/20 text-white hover:bg-emerald-500/20 h-9 w-9 rounded-xl"
            title="Volver al editor"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-emerald-400 font-extrabold tracking-widest text-xs">
            ASISTENCIA
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-[#081a14] font-bold text-sm">
              {docenteInfo?.nombres?.[0] || 'D'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {docenteInfo?.nombres || 'Docente'}
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
        <header className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
            Control de Asistencia
          </h1>
          <p className="text-white/60 text-base">
            Pasa lista y consulta el historial y reportes mensuales.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {[
            { id: 'pasar-lista' as const, label: 'Pasar Lista', icon: CalendarCheck },
            { id: 'historial' as const, label: 'Historial', icon: History },
            { id: 'reporte' as const, label: 'Reporte Mensual', icon: BarChart3 },
          ].map((t) => {
            const IconComponent = t.icon;
            return (
              <Button
                key={t.id}
                onClick={() => setVista(t.id)}
                variant={vista === t.id ? 'default' : 'outline'}
                className={
                  vista === t.id
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold rounded-xl'
                    : 'border-white/15 text-gray-300 hover:bg-white/10 hover:border-emerald-500/40 rounded-xl backdrop-blur-md'
                }
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {t.label}
              </Button>
            );
          })}
        </div>

        {/* Filtros comunes */}
        <Card className="bg-black/30 border-white/10 backdrop-blur mb-6">
          <CardContent className="p-5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase mb-4">
              Curso
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1 block">
                  Nivel
                </Label>
                <Select value={nivel} onValueChange={(v) => { setNivel(v ?? ''); setGrado(''); setSeccion(''); setMateria(''); }}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inicial">Inicial</SelectItem>
                    <SelectItem value="primaria">Primaria</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1 block">
                  {nivel === 'media' ? 'Año' : 'Grado'}
                </Label>
                <Select value={grado || 'none'} onValueChange={(v) => { setGrado(v === 'none' || !v ? '' : v); setSeccion(''); }}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Seleccionar</SelectItem>
                    {gradosActuales.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1 block">
                  Sección
                </Label>
                <Select value={seccion || 'none'} onValueChange={(v) => setSeccion(v === 'none' || !v ? '' : v)} disabled={!grado}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Seleccionar</SelectItem>
                    {seccionesActuales.map((s) => (
                      <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1 block">
                  Materia
                </Label>
                <Select value={materia || 'none'} onValueChange={(v) => setMateria(v === 'none' || !v ? '' : v)}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Seleccionar</SelectItem>
                    {materiasDisponibles.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============ VISTA PASAR LISTA ============ */}
        {vista === 'pasar-lista' && (
          <>
            {!nivel || !grado || !seccion ? (
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    Selecciona un nivel, grado y sección para comenzar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Aviso: asistencia ya guardada */}
                {asistenciaExistente && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-amber-400 font-bold text-sm">
                        Ya existe un registro para esta fecha
                      </p>
                      <p className="text-amber-400/70 text-xs mt-0.5">
                        Al guardar se actualizará el registro existente. No se duplicará.
                      </p>
                    </div>
                  </div>
                )}

                {/* Datos de la sesión */}
                <Card className="bg-black/30 border-white/10 backdrop-blur mb-4">
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-emerald-400 text-xs uppercase font-bold">
                          Fecha
                        </Label>
                        <Input
                          type="date"
                          value={fecha}
                          onChange={(e) => setFecha(e.target.value)}
                          className="bg-black/40 border-white/10 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-emerald-400 text-xs uppercase font-bold">
                          Hora (opcional)
                        </Label>
                        <Input
                          type="text"
                          value={hora}
                          onChange={(e) => setHora(e.target.value)}
                          placeholder="Ej: 07:00 - 07:45"
                          className="bg-black/40 border-white/10 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-emerald-400 text-xs uppercase font-bold">
                          Observaciones (opcional)
                        </Label>
                        <Input
                          type="text"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Ej: Actividad especial"
                          className="bg-black/40 border-white/10 text-white mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <div className="text-emerald-400 text-2xl font-bold">{totales.presentes}</div>
                    <div className="text-emerald-400/70 text-xs uppercase font-semibold">Presentes</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                    <div className="text-red-400 text-2xl font-bold">{totales.ausentes}</div>
                    <div className="text-red-400/70 text-xs uppercase font-semibold">Ausentes</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-white text-2xl font-bold">{totales.total}</div>
                    <div className="text-white/70 text-xs uppercase font-semibold">Total</div>
                  </div>
                </div>

                {/* Acciones rápidas y búsqueda */}
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => marcarTodos(true)}
                    className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Todos presentes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => marcarTodos(false)}
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Todos ausentes
                  </Button>

                  <div className="relative flex-1 min-w-48 ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      placeholder="Buscar estudiante..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="bg-black/40 border-white/10 text-white pl-9 h-10"
                    />
                  </div>
                </div>

                {/* Lista de estudiantes */}
                <Card className="bg-black/30 border-white/10 backdrop-blur overflow-hidden mb-4">
                  <CardContent className="p-0">
                    {cargandoEstudiantes ? (
                      <div className="text-center py-12 text-gray-400">
                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                        <p>Cargando estudiantes...</p>
                      </div>
                    ) : estudiantesFiltrados.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 text-emerald-500/30" />
                        <p>No hay estudiantes en este curso</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                            <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">
                              Cédula
                            </TableHead>
                            <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">
                              Nombres y Apellidos
                            </TableHead>
                            <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center w-32">
                              Asistió
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estudiantesFiltrados.map((e) => {
                            const asistio = asistencia[e.id] ?? true;
                            return (
                              <TableRow
                                key={e.id}
                                className={`border-white/5 transition-colors ${
                                  asistio ? 'hover:bg-emerald-500/5' : 'bg-red-500/5 hover:bg-red-500/10'
                                }`}
                              >
                                <TableCell>
                                  <span className="font-mono text-emerald-400 text-sm font-semibold">
                                    {e.cedulaIdentidad || '-'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-white font-medium">
                                  {e.apellidos}, {e.nombres}
                                </TableCell>
                                <TableCell className="text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleAsistencia(e.id)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center mx-auto ${
                                      asistio
                                        ? 'bg-emerald-500 border-emerald-500 text-emerald-950 shadow-[0_0_15px_rgba(0,187,126,0.4)]'
                                        : 'bg-transparent border-red-500/60 text-red-400 hover:bg-red-500/10'
                                    }`}
                                    title={asistio ? 'Asistió — click para marcar ausente' : 'Ausente — click para marcar presente'}
                                  >
                                    {asistio ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-5 h-5" strokeWidth={3} />}
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Botón guardar */}
                {estudiantes.length > 0 && (
                  <Button
                    onClick={guardar}
                    disabled={guardando}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black text-base uppercase shadow-lg shadow-emerald-500/30 h-14"
                  >
                    <Save className="mr-2 h-5 w-5" />
                    {guardando
                      ? 'Guardando...'
                      : asistenciaExistente
                      ? 'Actualizar lista de asistencia'
                      : 'Guardar lista de asistencia'}
                  </Button>
                )}
              </>
            )}
          </>
        )}

        {/* ============ VISTA HISTORIAL ============ */}
        {vista === 'historial' && (
          <>
            {!docenteInfo?.id ? (
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-400">Cargando docente...</p>
                </CardContent>
              </Card>
            ) : cargandoHistorial ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p>Cargando historial...</p>
              </div>
            ) : historial.length === 0 ? (
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <History className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No hay registros de asistencia</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Los registros aparecerán aquí cuando pases lista.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {historial.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 rounded-xl bg-black/30 border border-white/10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center hover:border-emerald-500/30 transition"
                  >
                    <div>
                      <div className="font-bold text-lg text-emerald-400">
                        {a.materia}
                      </div>
                      <div className="text-sm text-gray-400 mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-white/20 text-gray-300">
                          {new Date(a.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'long', year: 'numeric'
                          })}
                        </Badge>
                        <Badge variant="outline" className="border-white/20 text-gray-300">
                          {a.nivel} • {a.grado} • Sección {a.seccion}
                        </Badge>
                        {a.hora && (
                          <Badge variant="outline" className="border-white/20 text-gray-300">
                            {a.hora}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                          {a.totalEstudiantes} estudiantes
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminarAsistencia(a.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ VISTA REPORTE ============ */}
        {vista === 'reporte' && (
          <>
            <Card className="bg-black/30 border-white/10 backdrop-blur mb-4">
              <CardContent className="p-5">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-48">
                    <Label className="text-emerald-400 text-xs uppercase font-bold">
                      Mes
                    </Label>
                    <Input
                      type="month"
                      value={mes}
                      onChange={(e) => setMes(e.target.value)}
                      className="bg-black/40 border-white/10 text-white mt-2"
                    />
                  </div>
                  {reporte && (
                    <Button
                      variant="outline"
                      onClick={exportarCSV}
                      className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {!nivel || !grado || !seccion ? (
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    Selecciona un nivel, grado y sección para ver el reporte
                  </p>
                </CardContent>
              </Card>
            ) : cargandoReporte ? (
              <div className="text-center py-12 text-gray-400">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p>Cargando reporte...</p>
              </div>
            ) : !reporte || reporte.reporte.length === 0 ? (
              <Card className="bg-black/30 border-white/10 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No hay datos para este mes</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <div className="text-emerald-400 text-2xl font-bold">{reporte.totalSesiones}</div>
                    <div className="text-emerald-400/70 text-xs uppercase font-semibold">Clases en el mes</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-white text-2xl font-bold">{reporte.totalEstudiantes}</div>
                    <div className="text-white/70 text-xs uppercase font-semibold">Estudiantes</div>
                  </div>
                </div>

                <Card className="bg-black/30 border-white/10 backdrop-blur overflow-hidden">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                          <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">
                            Cédula
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">
                            Nombres y Apellidos
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center">
                            Clases
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center">
                            Presentes
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center">
                            Ausentes
                          </TableHead>
                          <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center">
                            % Inasistencia
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reporte.reporte.map((r) => {
                          const critico = r.porcentajeInasistencia >= 25;
                          return (
                            <TableRow key={r.estudianteId} className="border-white/5 hover:bg-white/5">
                              <TableCell>
                                <span className="font-mono text-emerald-400 text-sm font-semibold">
                                  {r.cedulaIdentidad || '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-white font-medium">
                                {r.apellidos}, {r.nombres}
                              </TableCell>
                              <TableCell className="text-center text-white">
                                {r.totalClases}
                              </TableCell>
                              <TableCell className="text-center text-emerald-400 font-semibold">
                                {r.presentes}
                              </TableCell>
                              <TableCell className="text-center text-red-400 font-semibold">
                                {r.ausentes}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={
                                    critico
                                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                      : r.porcentajeInasistencia > 0
                                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  }
                                >
                                  {r.porcentajeInasistencia.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <p className="text-center text-white/30 text-xs pt-6">
                  * El porcentaje de inasistencia se calcula sobre el total de clases registradas en el mes.
                </p>
              </>
            )}
          </>
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
}