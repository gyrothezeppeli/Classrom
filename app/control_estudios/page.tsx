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

type TabType = 'estudiantes' | 'docentes' | 'actualizar';

const GestionInstitutoPage: React.FC = () => {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState<TabType>('estudiantes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroGrado, setFiltroGrado] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // ✅ Estado para el modal de confirmación
  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

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

  // ✅ Cierre de sesión con modal de confirmación
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

  const secciones = ['A', 'B', 'C', 'D', 'E'];

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
  };

  const tieneFiltrosActivos = searchTerm || filtroNivel || filtroGrado || filtroSeccion;

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
    { key: 'actualizar' as const, label: 'Actualizar Datos', icon: <RefreshCw className="w-4 h-4" /> }
  ];

  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif", background: PALETTE.deepBg }}
    >
      {/* Fondo: imagen nítida + overlay oscuro */}
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

            {/* ✅ BOTÓN DE HORARIOS */}
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
                {tabActiva === 'actualizar' && 'Actualizar Datos de Estudiantes'}
              </CardTitle>
              <p className="text-gray-400 text-sm sm:text-base m-0">
                {tabActiva === 'estudiantes' && `Total: ${estudiantes.length} estudiantes registrados`}
                {tabActiva === 'docentes' && `Total: ${docentes.length} docentes registrados`}
                {tabActiva === 'actualizar' && `Seleccione los estudiantes para actualizar`}
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-10 py-6 sm:py-8 space-y-6">
            {/* FILTROS */}
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

      {/* ✅ Modal de confirmación */}
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