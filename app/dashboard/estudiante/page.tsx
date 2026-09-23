// app/dashboard/estudiante/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { sileo } from 'sileo';

// ============ SHADCN UI ============
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Bell,
  FileText,
  Calendar,
  Target,
  User,
  ExternalLink,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  IdCard,
  LogOut,
  Search,
  Clock,
  Filter,
  GraduationCap,
} from "lucide-react";

const PALETTE = {
  sandBorder: '#5c7564',
  darkBanner: 'linear-gradient(160deg, #102d22 0%, #081a14 100%)',
  deepBg: '#1a2e26',
  textLight: '#f3f4f6',
  accent: '#00BB7E',
  glass: 'rgba(255, 255, 255, 0.08)',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e'
};

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
  docenteId: string;
  ano: string;
  secciones: string;
  nivel: string;
  grado: string;
  materia: string;
  filas: FilaPlan[];
  visto: boolean;
  fechaVisto: string | null;
  createdAt: string;
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: string;
  recursos: string;
  objetivos: string;
  ponderacion: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  visto: boolean;
  entregado: boolean;
  calificacion: number | null;
  createdAt: string;
}

interface Aviso {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  visto: boolean;
  fechaVisto: string | null;
  createdAt: string;
}

interface Material {
  id: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  fecha: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  visto: boolean;
  fechaVisto: string | null;
  createdAt: string;
}

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  grado: string;
  seccion: string;
  cedulaIdentidad: string;
  correoElectronico: string;
  nivel: string;
  telefono?: string;
}

interface MateriaConPlanes {
  id: string;
  nombre: string;
  profesor: string;
  horario: string;
  aula: string;
  color: string;
  tareasPendientes: Tarea[];
  avisos: Aviso[];
  materiales: Material[];
  planEvaluacion: PlanEvaluacion[];
}

type FiltroMaterias = 'todas' | 'novedades' | 'tareas' | 'planes_nuevos';

const MATERIAS_BASE = [
  { id: 'mat-001', nombre: 'Lengua Española', profesor: '', horario: '', aula: '', color: '#8b5cf6' },
  { id: 'mat-002', nombre: 'Matemáticas', profesor: '', horario: '', aula: '', color: '#3b82f6' },
  { id: 'mat-003', nombre: 'Historia', profesor: '', horario: '', aula: '', color: '#f59e0b' },
  { id: 'mat-004', nombre: 'Geografía', profesor: '', horario: '', aula: '', color: '#10b981' },
  { id: 'mat-005', nombre: 'Biología', profesor: '', horario: '', aula: '', color: '#22c55e' },
  { id: 'mat-006', nombre: 'Química', profesor: '', horario: '', aula: '', color: '#06b6d4' },
  { id: 'mat-007', nombre: 'Física', profesor: '', horario: '', aula: '', color: '#6366f1' },
  { id: 'mat-008', nombre: 'Inglés', profesor: '', horario: '', aula: '', color: '#ec4899' },
  { id: 'mat-009', nombre: 'Francés', profesor: '', horario: '', aula: '', color: '#f472b6' },
  { id: 'mat-010', nombre: 'Filosofía', profesor: '', horario: '', aula: '', color: '#8b5cf6' },
  { id: 'mat-011', nombre: 'Educación Física', profesor: '', horario: '', aula: '', color: '#14b8a6' },
  { id: 'mat-012', nombre: 'Arte', profesor: '', horario: '', aula: '', color: '#f43f5e' },
  { id: 'mat-013', nombre: 'Informática', profesor: '', horario: '', aula: '', color: '#0ea5e9' },
];

// ============================================
// Utilidades de normalización
// ============================================
const normalizarTexto = (valor: string): string => {
  if (!valor) return '';
  return valor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, ' ');
};

const variantesNivel = (nivel: string): string[] => {
  const n = normalizarTexto(nivel);
  const mapa: Record<string, string[]> = {
    inicial: ['inicial', 'preescolar', 'educacion inicial'],
    primaria: ['primaria', 'educacion primaria'],
    media: ['media', 'bachillerato', 'educacion media'],
  };
  return mapa[n] || [n];
};

const variantesGrado = (grado: string): string[] => {
  const g = normalizarTexto(grado);
  const mapa: Record<string, string[]> = {
    '1er ano': ['1er ano', '1ro', '1er año', '1'],
    '2do ano': ['2do ano', '2do', '2do año', '2'],
    '3er ano': ['3er ano', '3ro', '3er año', '3'],
    '4to ano': ['4to ano', '4to', '4to año', '4'],
    '5to ano': ['5to ano', '5to', '5to año', '5'],
    '1er grado': ['1er grado', '1ro', '1'],
    '2do grado': ['2do grado', '2do', '2'],
    '3er grado': ['3er grado', '3ro', '3'],
    '4to grado': ['4to grado', '4to', '4'],
    '5to grado': ['5to grado', '5to', '5'],
    '6to grado': ['6to grado', '6to', '6'],
    '1er nivel': ['1er nivel', '1er_nivel', '1ro nivel', '1ro_nivel'],
    '2do nivel': ['2do nivel', '2do_nivel'],
    '3er nivel': ['3er nivel', '3er_nivel', '3ro nivel', '3ro_nivel'],
  };
  return mapa[g] || [g];
};

const coincideNivel = (a: string, b: string) =>
  variantesNivel(a).includes(normalizarTexto(b)) ||
  variantesNivel(b).includes(normalizarTexto(a));

const coincideGrado = (a: string, b: string) =>
  variantesGrado(a).includes(normalizarTexto(b)) ||
  variantesGrado(b).includes(normalizarTexto(a));

const coincideSeccion = (a: string, b: string) => {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);

  if (
    na === 'unica' || na === 'única' || na === '' ||
    nb === 'unica' || nb === 'única' || nb === ''
  ) {
    return true;
  }

  return na === nb || na === `seccion ${nb}` || `seccion ${na}` === nb;
};

// ============================================
// Componente principal
// ============================================
const EstudianteDashboard: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedMateria, setSelectedMateria] = useState<MateriaConPlanes | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanEvaluacion | null>(null);
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [materias, setMaterias] = useState<MateriaConPlanes[]>([]);
  const [docentes, setDocentes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<FiltroMaterias>('todas');

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

        const planesResponse = await fetch(`/api/estudiantes/planes?estudianteId=${data.id}`);

        let planesData: PlanEvaluacion[] = [];

        if (planesResponse.ok) {
          const rawPlanes = await planesResponse.json();

          planesData = (rawPlanes || []).map((plan: any) => ({
            id: plan.id || '',
            areaFormacion: plan.areaFormacion || plan.titulo || 'Sin título',
            docente: plan.docente || 'Docente no asignado',
            docenteId: plan.docenteId || '',
            ano: plan.ano || plan.grado || 'N/A',
            secciones: plan.secciones || plan.seccion || 'A',
            nivel: plan.nivel || '',
            grado: plan.grado || '',
            materia: plan.materia || '',
            filas: Array.isArray(plan.filas) ? plan.filas : [],
            visto: plan.visto || false,
            fechaVisto: plan.fechaVisto || null,
            createdAt: plan.createdAt || new Date().toISOString()
          }));
        }

        let tareasData: Tarea[] = [];
        try {
          const tareasResponse = await fetch(`/api/tareas?estudianteId=${data.id}`);
          if (tareasResponse.ok) {
            const rawTareas = await tareasResponse.json();
            tareasData = (rawTareas || []).map((t: any) => ({
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
          }
        } catch (error) {
          console.error('Error al cargar tareas:', error);
        }

        let avisosData: Aviso[] = [];
        try {
          const avisosResponse = await fetch(`/api/avisos?estudianteId=${data.id}`);
          if (avisosResponse.ok) {
            const rawAvisos = await avisosResponse.json();
            avisosData = (rawAvisos || []).map((a: any) => ({
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
          }
        } catch (error) {
          console.error('Error al cargar avisos:', error);
        }

        let materialesData: Material[] = [];
        try {
          const materialesResponse = await fetch(`/api/materiales?estudianteId=${data.id}`);
          if (materialesResponse.ok) {
            const rawMateriales = await materialesResponse.json();
            materialesData = (rawMateriales || []).map((m: any) => ({
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
          }
        } catch (error) {
          console.error('Error al cargar materiales:', error);
        }

        const docentesMap: Record<string, string> = {};
        const docentesIds = [...new Set(planesData.map(p => p.docenteId).filter(Boolean))];

        for (const docenteId of docentesIds) {
          try {
            const docenteRes = await fetch(`/api/docentes?id=${docenteId}`);
            if (docenteRes.ok) {
              const docenteData = await docenteRes.json();
              const nombreCompleto = `${docenteData.nombres || ''} ${docenteData.apellidos || ''}`.trim();
              docentesMap[docenteId] = nombreCompleto || docenteData.email || 'Docente';
            }
          } catch (error) {
            console.error(`Error al obtener docente ${docenteId}:`, error);
          }
        }

        setDocentes(docentesMap);

        const materiasConstruidas: MateriaConPlanes[] = MATERIAS_BASE.map((base) => {
          const planesMateria = planesData.filter((plan: PlanEvaluacion) => {
            const materiaOk = plan.materia === base.nombre || plan.areaFormacion === base.nombre;
            if (!materiaOk) return false;
            if (!coincideNivel(plan.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(plan.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(plan.secciones || '', estudianteData.seccion)) return false;
            return true;
          });

          const tareasMateria = tareasData.filter((t) => {
            if (t.materia !== base.nombre) return false;
            if (!coincideNivel(t.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(t.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(t.seccion || '', estudianteData.seccion)) return false;
            return true;
          });

          const avisosMateria = avisosData.filter((a) => {
            if (a.materia !== base.nombre) return false;
            if (!coincideNivel(a.nivel || '', estudianteData.nivel)) return false;
            if (!coincideGrado(a.grado || '', estudianteData.grado)) return false;
            if (!coincideSeccion(a.seccion || '', estudianteData.seccion)) return false;
            return true;
          });

          const materialesMateria = materialesData.filter((m) => {
            if (m.materia !== base.nombre) return false;
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

          return {
            ...base,
            profesor: profesor,
            planEvaluacion: planesMateria,
            tareasPendientes: tareasMateria,
            avisos: avisosMateria,
            materiales: materialesMateria
          };
        });

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

  const marcarPlanComoVisto = async (planId: string) => {
    if (!estudiante) return;

    try {
      const response = await fetch('/api/estudiantes/planes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudianteId: estudiante.id,
          planId: planId
        }),
      });

      if (response.ok) {
        setMaterias((prev) =>
          prev.map((materia) => ({
            ...materia,
            planEvaluacion: materia.planEvaluacion.map((plan) =>
              plan.id === planId
                ? { ...plan, visto: true, fechaVisto: new Date().toISOString() }
                : plan
            )
          }))
        );

        if (selectedPlan && selectedPlan.id === planId) {
          setSelectedPlan({ ...selectedPlan, visto: true, fechaVisto: new Date().toISOString() });
        }

        sileo.success({
          title: 'Plan marcado como visto',
          description: 'Se registró tu lectura correctamente',
        });
      } else {
        sileo.error({
          title: 'Error',
          description: 'No se pudo marcar el plan como visto',
        });
      }
    } catch (error) {
      console.error('Error al marcar plan como visto:', error);
      sileo.error({
        title: 'Error de conexión',
        description: 'No se pudo marcar el plan como visto',
      });
    }
  };

  // ✅ CORREGIDO: sin 'cancel' (tu versión de Sileo no lo soporta)
  const handleLogout = async () => {
    if (!window.confirm('¿Está seguro de que desea cerrar sesión?')) {
      return;
    }
    await signOut({ redirect: false });
    router.push('/');
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

  const proximasEntregas = useMemo(() => {
    const tareas = materias.flatMap(m =>
      m.tareasPendientes.map(t => ({
        ...t,
        colorMateria: m.color,
        nombreMateria: m.nombre
      }))
    );

    return tareas
      .filter(t => t.fechaEntrega)
      .sort((a, b) => {
        const dateA = new Date(a.fechaEntrega).getTime();
        const dateB = new Date(b.fechaEntrega).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [materias]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#1a2e26] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  if (error || !estudiante) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-5 relative">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
        />
        <div className="absolute inset-0 bg-[#0a1410]/40 z-0" />

        <div className="liquid-login-card rounded-[40px] p-8 max-w-md w-full relative z-10">
          <div className="liquid-login-content text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">No se encontró tu perfil</h2>
            <p className="text-gray-400 leading-relaxed">
              {error || 'No se encontraron datos del estudiante'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Volver al Inicio
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    const nombreInicial = estudiante.nombres && estudiante.nombres.length > 0 ? estudiante.nombres[0] : '?';
    const apellidoInicial = estudiante.apellidos && estudiante.apellidos.length > 0 ? estudiante.apellidos[0] : '';
    return `${nombreInicial}${apellidoInicial}`;
  };

  const nombreCompleto = `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim() || 'Estudiante';

  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif", background: PALETTE.deepBg }}
    >
      {/* Fondo: imagen original sin filtro + overlay oscuro sutil */}
      <div
        className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
      />
      <div className="fixed inset-0 bg-[#0a1410]/45 z-0 pointer-events-none" />

      {/* NAVBAR compacto */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-[8%] py-3 bg-[#1a2e26]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-[#081a14] font-bold text-sm shadow-[0_0_20px_rgba(0,187,126,0.35)]">
            {getInitials()}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm">{nombreCompleto}</span>
            <span className="text-gray-400 text-[0.7rem]">
              {estudiante.grado || '?'}° Grado • Sección {estudiante.seccion || ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {planesNoVistos > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500/15 rounded-full border border-red-500/30 animate-pulse">
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-bold text-xs">
                {planesNoVistos} {planesNoVistos === 1 ? 'nuevo' : 'nuevos'}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Salir</span>
          </Button>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL estilo login card */}
      <main className="relative z-10 px-4 sm:px-[8%] py-6">
        <div className="liquid-login-card rounded-[35px] p-6 sm:p-8">
          <div className="liquid-login-content space-y-6">

            {/* Saludo */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white m-0 tracking-tight">
                Hola, {estudiante.nombres}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Bienvenido de nuevo a tu panel
              </p>
            </div>

            {/* Datos del estudiante */}
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
              <DataCard icon={<Mail className="w-4 h-4" />} label="Correo" value={estudiante.correoElectronico || 'No registrado'} />
              <DataCard icon={<IdCard className="w-4 h-4" />} label="Cédula" value={estudiante.cedulaIdentidad || 'No registrada'} />
              <DataCard icon={<Phone className="w-4 h-4" />} label="Teléfono" value={estudiante.telefono || 'No registrado'} />
              <DataCard icon={<GraduationCap className="w-4 h-4" />} label="Nivel" value={estudiante.nivel ? estudiante.nivel.charAt(0).toUpperCase() + estudiante.nivel.slice(1) : 'No asignado'} />
            </div>

            {/* STATS */}
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
              <StatCard icon={<BookOpen className="w-5 h-5" />} label="Materias" value={materiasConPlanes} color="#00BB7E" />
              <StatCard icon={<FileText className="w-5 h-5" />} label="Tareas" value={totalTareas} color="#00BB7E" />
              <StatCard icon={<Bell className="w-5 h-5" />} label="Avisos" value={totalAvisos} color="#00BB7E" />
              <StatCard icon={<BookOpen className="w-5 h-5" />} label="Materiales" value={totalMateriales} color="#00BB7E" />
            </div>

            {/* PRÓXIMAS ENTREGAS */}
            {proximasEntregas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold m-0">Próximas Entregas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {proximasEntregas.map((tarea) => (
                    <div
                      key={tarea.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md hover:bg-white/10 transition-all"
                      style={{ borderLeftColor: tarea.colorMateria, borderLeftWidth: '4px' }}
                    >
                      <div className="text-[0.7rem] font-bold uppercase tracking-wider mb-2" style={{ color: tarea.colorMateria }}>
                        {tarea.nombreMateria}
                      </div>
                      <div className="text-white text-sm font-semibold mb-2 line-clamp-2">
                        {tarea.titulo}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <Calendar className="w-3 h-3" />
                        {tarea.fechaEntrega}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MATERIAS */}
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold m-0">Mis Materias</h2>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    {materiasFiltradas.length}
                  </Badge>
                </div>
              </div>

              {/* Búsqueda y filtros */}
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <Input
                    type="text"
                    placeholder="Buscar materias o profesores..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pl-11 h-11 rounded-2xl backdrop-blur-md focus:border-emerald-500/60"
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'todas' as const, label: 'Todas' },
                    { id: 'novedades' as const, label: 'Con novedades' },
                    { id: 'tareas' as const, label: 'Con tareas' },
                    { id: 'planes_nuevos' as const, label: 'Planes nuevos' },
                  ].map((filtro) => (
                    <Button
                      key={filtro.id}
                      onClick={() => setFiltroActivo(filtro.id)}
                      variant={filtroActivo === filtro.id ? 'default' : 'outline'}
                      size="sm"
                      className={
                        filtroActivo === filtro.id
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold rounded-xl'
                          : 'border-white/15 text-gray-300 hover:bg-white/10 hover:border-emerald-500/40 rounded-xl backdrop-blur-md'
                      }
                    >
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      {filtro.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Grid de materias */}
              {materiasFiltradas.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
                  <Search className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg m-0">
                    No se encontraron materias con esos criterios
                  </p>
                </div>
              ) : (
                <MateriaGrid
                  materias={materiasFiltradas}
                  onSelectMateria={setSelectedMateria}
                  onSelectPlan={setSelectedPlan}
                />
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-white/30 text-xs pt-6 border-t border-white/5">
              U.E Ciudad Cuatricentenaria 2026 • Portal Estudiantil
            </p>

          </div>
        </div>
      </main>

      {/* MODAL MATERIA */}
      {selectedMateria && (
        <MateriaDetalle
          materia={selectedMateria}
          onClose={() => setSelectedMateria(null)}
          onSelectPlan={setSelectedPlan}
          onMarcarVisto={marcarPlanComoVisto}
        />
      )}

      {/* MODAL PLAN */}
      {selectedPlan && (
        <PlanEvaluacionDetalle
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onMarcarVisto={() => marcarPlanComoVisto(selectedPlan.id)}
          estudiante={estudiante}
        />
      )}
    </div>
  );
};

// ============================================
// DataCard
// ============================================
const DataCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 rounded-2xl p-4 backdrop-blur-md transition-all">
    <div className="flex items-center gap-2 text-emerald-400/80 text-[0.65rem] uppercase tracking-wider mb-1.5">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-white text-sm font-semibold truncate">
      {value}
    </div>
  </div>
);

// ============================================
// StatCard
// ============================================
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string }> = ({ icon, label, value, color = PALETTE.accent }) => (
  <div className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 rounded-2xl p-5 text-center backdrop-blur-md transition-all">
    <div className="flex justify-center mb-2" style={{ color }}>
      {icon}
    </div>
    <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
    <div className="text-emerald-400/70 text-xs font-medium uppercase tracking-wide">{label}</div>
  </div>
);

// ============================================
// MateriaGrid (Liquid Glass cards)
// ============================================
const MateriaGrid: React.FC<{
  materias: MateriaConPlanes[];
  onSelectMateria: (materia: MateriaConPlanes) => void;
  onSelectPlan: (plan: PlanEvaluacion) => void;
}> = ({ materias, onSelectMateria, onSelectPlan }) => {
  const getPlanesNuevos = (planes: PlanEvaluacion[]) => {
    return planes.filter((p: PlanEvaluacion) => p.visto === false).length;
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 w-full">
      {materias.map((materia, index) => {
        const planesNuevos = getPlanesNuevos(materia.planEvaluacion);
        const tienePlanes = materia.planEvaluacion.length > 0;
        const tieneTareas = materia.tareasPendientes.length > 0;
        const tieneAvisos = materia.avisos.length > 0;
        const tieneMateriales = materia.materiales.length > 0;
        const primerPlan = tienePlanes ? materia.planEvaluacion[0] : null;

        return (
          <div
            key={materia.id}
            onClick={() => onSelectMateria(materia)}
            className="liquid-materia-card border border-white/10 rounded-2xl cursor-pointer relative overflow-hidden"
            style={{
              borderTopColor: materia.color,
              borderTopWidth: '4px',
              animationDelay: `${index * 60}ms`
            }}
          >
            <div className="p-5">
              <h3 className="text-white text-lg font-bold mb-1">{materia.nombre}</h3>
              <p className="text-white/50 text-sm mb-3">
                {materia.profesor || 'Sin profesor asignado'}
              </p>

              <div className="flex gap-2 flex-wrap mb-3">
                {tieneTareas && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                    {materia.tareasPendientes.length} {materia.tareasPendientes.length === 1 ? 'tarea' : 'tareas'}
                  </Badge>
                )}
                {tieneAvisos && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                    {materia.avisos.length} {materia.avisos.length === 1 ? 'aviso' : 'avisos'}
                  </Badge>
                )}
                {tieneMateriales && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                    {materia.materiales.length} {materia.materiales.length === 1 ? 'material' : 'materiales'}
                  </Badge>
                )}
                {tienePlanes && (
                  <Badge
                    className={
                      planesNuevos > 0
                        ? "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    }
                  >
                    {planesNuevos > 0 ? `${planesNuevos} nuevos` : `${materia.planEvaluacion.length} planes`}
                  </Badge>
                )}
              </div>

              {tienePlanes && primerPlan && (
                <Button
                  onClick={(e) => { e.stopPropagation(); onSelectPlan(primerPlan); }}
                  className={`w-full font-semibold rounded-xl ${
                    planesNuevos > 0
                      ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/40'
                  }`}
                  variant="outline"
                >
                  {planesNuevos > 0 ? 'Ver plan nuevo' : 'Ver plan'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// MateriaDetalle (Modal)
// ============================================
const MateriaDetalle: React.FC<{
  materia: MateriaConPlanes | null;
  onClose: () => void;
  onSelectPlan: (plan: PlanEvaluacion) => void;
  onMarcarVisto: (planId: string) => void;
}> = ({ materia, onClose, onSelectPlan }) => {
  const [activeTab, setActiveTab] = useState<'tareas' | 'avisos' | 'materiales' | 'evaluacion'>('tareas');

  if (!materia) return null;

  const hasPlanesNuevos = (): boolean => {
    return materia.planEvaluacion.some((p: PlanEvaluacion) => p.visto === false);
  };

  const tabs = [
    { key: 'tareas' as const, label: `Tareas${materia.tareasPendientes.length > 0 ? ` (${materia.tareasPendientes.length})` : ''}` },
    { key: 'avisos' as const, label: `Avisos${materia.avisos.length > 0 ? ` (${materia.avisos.length})` : ''}` },
    { key: 'materiales' as const, label: `Materiales${materia.materiales.length > 0 ? ` (${materia.materiales.length})` : ''}` },
    { key: 'evaluacion' as const, label: 'Evaluación' }
  ];

  return (
    <div
      className="liquid-overlay fixed inset-0 z-1000 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="liquid-modal rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        style={{ borderColor: `${materia.color}66` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content h-full flex flex-col overflow-hidden">
          <div
            className="px-8 py-6 border-b"
            style={{
              background: `linear-gradient(135deg, rgba(16,45,34,0.9), ${materia.color}44)`,
              borderColor: `${materia.color}44`
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: materia.color,
                      boxShadow: `0 0 20px ${materia.color}66`
                    }}
                  />
                  <h2 className="text-white text-3xl font-bold m-0">{materia.nombre}</h2>
                  {hasPlanesNuevos() && (
                    <Badge className="bg-red-500 text-white border-red-500">
                      Nuevos
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 mt-1 ml-6">
                  {materia.profesor || 'Sin profesor'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-1.5 px-5 py-3.5 bg-black/30 border-b border-white/5 flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.key)}
                className={
                  activeTab === tab.key
                    ? "text-[#081a14] font-bold"
                    : "text-white hover:bg-white/5"
                }
                style={activeTab === tab.key ? { background: materia.color } : undefined}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* TAREAS */}
            {activeTab === 'tareas' && (
              <div>
                {materia.tareasPendientes.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay tareas asignadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materia.tareasPendientes.map((tarea) => (
                      <Card
                        key={tarea.id}
                        className={`border ${
                          tarea.visto
                            ? 'bg-white/3 border-white/5'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <CardContent className="p-5">
                          <h4 className="text-white text-base font-semibold mb-2">
                            {tarea.titulo}
                          </h4>
                          {tarea.descripcion && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                              {tarea.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Entrega: <strong className="text-emerald-400">{tarea.fechaEntrega}</strong>
                            </span>
                            {tarea.ponderacion && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5" />
                                Ponderación: {tarea.ponderacion}%
                              </span>
                            )}
                            {tarea.recursos && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                {tarea.recursos}
                              </span>
                            )}
                          </div>
                          {tarea.objetivos && (
                            <div className="mt-2 text-xs text-gray-400">
                              <strong className="text-emerald-400">Objetivos:</strong> {tarea.objetivos}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AVISOS */}
            {activeTab === 'avisos' && (
              <div>
                {materia.avisos.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay avisos disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materia.avisos.map((aviso) => (
                      <Card key={aviso.id} className="bg-emerald-500/5 border-emerald-500/20">
                        <CardContent className="p-5">
                          <h4 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-emerald-400" />
                            {aviso.titulo}
                          </h4>
                          {aviso.descripcion && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                              {aviso.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {aviso.fecha}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {aviso.docente}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MATERIALES */}
            {activeTab === 'materiales' && (
              <div>
                {materia.materiales.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay materiales disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materia.materiales.map((material) => (
                      <Card key={material.id} className="bg-emerald-500/5 border-emerald-500/20">
                        <CardContent className="p-5">
                          <h4 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            {material.titulo}
                          </h4>
                          {material.descripcion && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                              {material.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400 items-center">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {material.fecha}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {material.docente}
                            </span>
                            {material.enlace && (
                              <a
                                href={material.enlace}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/25 transition text-xs font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Abrir enlace
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EVALUACIÓN */}
            {activeTab === 'evaluacion' && (
              <div>
                {materia.planEvaluacion.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay plan de evaluación disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materia.planEvaluacion.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`flex flex-row items-center justify-between gap-4 ${
                          plan.visto
                            ? 'bg-white/3 border-white/5'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <CardContent className="p-4 flex flex-row items-center justify-between w-full gap-4">
                          <div className="flex-1 min-w-50">
                            <div className="text-white font-semibold mb-1">
                              {plan.areaFormacion}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {plan.docente} • {plan.ano} • Sección {plan.secciones}
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              onClose();
                              setTimeout(() => onSelectPlan(plan), 100);
                            }}
                            className={
                              plan.visto
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/40'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950'
                            }
                            variant={plan.visto ? 'outline' : 'default'}
                            size="sm"
                          >
                            {plan.visto ? 'Ver plan' : 'Ver nuevo'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PlanEvaluacionDetalle (Modal)
// ============================================
const PlanEvaluacionDetalle: React.FC<{
  plan: PlanEvaluacion;
  onClose: () => void;
  onMarcarVisto: () => void;
  estudiante: Estudiante | null;
}> = ({ plan, onClose, onMarcarVisto, estudiante }) => {
  const [exportando, setExportando] = useState(false);

  const filas: FilaPlan[] = Array.isArray(plan?.filas) ? plan.filas : [];

  const exportarAPDF = async () => {
    try {
      setExportando(true);

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
      doc.text('Estudiante:', 14, yPos);
      doc.text('Cédula:', 100, yPos);
      doc.text('Grado:', 180, yPos);

      doc.setFont('helvetica', 'normal');
      doc.text(estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'N/A', 40, yPos);
      doc.text(estudiante?.cedulaIdentidad || 'N/A', 120, yPos);
      doc.text(estudiante?.grado || 'N/A', 195, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), 30, yPos);

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
        headStyles: { fillColor: [0, 187, 126] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
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
    } finally {
      setExportando(false);
    }
  };

  return (
    <div
      className="liquid-overlay fixed inset-0 z-2000 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="liquid-modal rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        style={{ borderColor: 'rgba(16, 185, 129, 0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content h-full flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-emerald-500/30 shrink-0"
               style={{ background: 'linear-gradient(135deg, rgba(16,45,34,0.9), rgba(16,185,129,0.2))' }}>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-emerald-400 text-2xl font-bold m-0">
                  Plan de Evaluación - {plan.areaFormacion}
                </h2>
                <p className="text-gray-400 mt-1">
                  {plan.docente} • {plan.ano} • Sección(es): {plan.secciones}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {!plan.visto && (
                  <Button
                    onClick={onMarcarVisto}
                    className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como visto
                  </Button>
                )}
                <Button
                  onClick={exportarAPDF}
                  disabled={exportando}
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportando ? 'Exportando...' : 'Exportar PDF'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="mr-2 h-4 w-4" /> Cerrar
                </Button>
              </div>
            </div>
            {plan.visto && (
              <Badge className="mt-3 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                Visto el {plan.fechaVisto ? new Date(plan.fechaVisto).toLocaleDateString('es-ES') : 'recientemente'}
              </Badge>
            )}
          </div>

          <div className="overflow-auto p-6 flex-1">
            {filas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-xl text-white m-0">Este plan no tiene filas registradas</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                        {['#', 'FECHA', 'REFERENTE', 'ESTRATEGIA', 'TÉCNICA', 'INSTRUMENTO', 'PTOS', '%', 'CRITERIOS'].map((header) => (
                          <TableHead
                            key={header}
                            className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center"
                          >
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filas.map((fila, index) => (
                        <TableRow
                          key={fila.id}
                          className={index % 2 === 0 ? 'bg-white/2' : ''}
                        >
                          <TableCell className="text-center text-emerald-400 font-bold">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-center text-white">{fila.fecha || '-'}</TableCell>
                          <TableCell className="text-white">{fila.referenteTeorico || '-'}</TableCell>
                          <TableCell className="text-white">{fila.estrategiaEvaluacion || '-'}</TableCell>
                          <TableCell className="text-white">{fila.tecnicaEvaluacion || '-'}</TableCell>
                          <TableCell className="text-white">{fila.instrumentoEvaluacion || '-'}</TableCell>
                          <TableCell className="text-center text-emerald-400 font-bold">
                            {fila.ptos || '-'}
                          </TableCell>
                          <TableCell className="text-center text-emerald-400 font-bold">
                            {fila.porcentaje || '-'}
                          </TableCell>
                          <TableCell className="text-white">{fila.criteriosEvaluacion || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-5 px-5 py-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex justify-between items-center flex-wrap gap-3">
                  <div className="text-white text-sm">
                    <strong>Total de filas:</strong> {filas.length}
                  </div>
                  <div className="text-emerald-400 text-sm font-bold">
                    <strong>Puntos totales:</strong> {filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstudianteDashboard;