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
  Trash2,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
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

interface FilaPrevisualizacion {
  cedula: string;
  nota: string;
  observacion: string;
  estudianteId?: string;
  estudianteNombre?: string;
  valido: boolean;
  error?: string;
}

interface ArchivoPrevisualizacion {
  id: string;
  nombreArchivo: string;
  materiaDetectada: string;
  periodoDetectado: string;
  gradoDetectado: string;
  seccionDetectada: string;
  nivelDetectado: string;
  filas: FilaPrevisualizacion[];
  cargando: boolean;
  error?: string;
}

interface EstudianteConsolidado {
  estudianteId: string;
  cedula: string;
  nombre: string;
  apellido: string;
  notas: Record<string, number | null>;
  observaciones: Record<string, string>;
  curso: { nivel: string; grado: string; seccion: string };
}

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

  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

  const [notas, setNotas] = useState<Nota[]>([]);
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [filtroMateria, setFiltroMateria] = useState<string>('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('1er Lapso');
  const [notasEnEdicion, setNotasEnEdicion] = useState<Record<string, { nota: number; observacion: string }>>({});
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [exportando, setExportando] = useState(false);

  const [modoCrearNomina, setModoCrearNomina] = useState(false);
  const [crearNivel, setCrearNivel] = useState('media');
  const [crearGrado, setCrearGrado] = useState('');
  const [crearSeccion, setCrearSeccion] = useState('');
  const [crearMateria, setCrearMateria] = useState('');
  const [crearPeriodo, setCrearPeriodo] = useState('1er Lapso');
  const [crearNotas, setCrearNotas] = useState<Record<string, { nota: string; observacion: string }>>({});

  const [modoVerNotasDocentes, setModoVerNotasDocentes] = useState(false);
  const [notasDocentes, setNotasDocentes] = useState<Nota[]>([]);
  const [cargandoNotasDocentes, setCargandoNotasDocentes] = useState(false);
  const [filtroDocente, setFiltroDocente] = useState<string>('');
  const [docentesConNotas, setDocentesConNotas] = useState<string[]>([]);

  const [archivosPrevisualizacion, setArchivosPrevisualizacion] = useState<ArchivoPrevisualizacion[]>([]);
  const [importandoMasivo, setImportandoMasivo] = useState(false);
  const [guardandoMasivo, setGuardandoMasivo] = useState(false);

  const [verConsolidado, setVerConsolidado] = useState(false);

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

  useEffect(() => {
    if (tabActiva === 'notas' && filtroNivel && filtroGrado && filtroSeccion) {
      cargarNotas();
    } else if (tabActiva === 'notas') {
      setNotas([]);
    }
  }, [tabActiva, filtroNivel, filtroGrado, filtroSeccion, filtroMateria, filtroPeriodo]);

  useEffect(() => {
    if (modoVerNotasDocentes) {
      cargarNotasDocentes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoVerNotasDocentes]);

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

  const cargarNotasDocentes = async () => {
    setCargandoNotasDocentes(true);
    try {
      const res = await fetch('/api/notas/docentes');
      if (res.ok) {
        const data = await res.json();
        const listaNotas: Nota[] = data.notas || data;
        setNotasDocentes(listaNotas);

        const docentesUnicos = Array.from(
          new Set(
            listaNotas
              .map((n) => n.docente)
              .filter((d): d is string => Boolean(d))
          )
        );
        setDocentesConNotas(docentesUnicos);
      }
    } catch (error) {
      console.error('Error al cargar notas de docentes:', error);
      sileo.error({ title: 'Error al cargar notas de docentes' });
    } finally {
      setCargandoNotasDocentes(false);
    }
  };

  const exportarNotasDocentes = async () => {
    try {
      setExportando(true);

      const datos = notasDocentesFiltradas;

      if (datos.length === 0) {
        sileo.warning({
          title: 'Sin datos',
          description: 'No hay notas para exportar con los filtros actuales',
        });
        return;
      }

      const XLSX = await import('xlsx');

      const filas = datos.map((n) => ({
        'Cédula': n.cedulaIdentidad || '',
        'Apellidos': n.apellidos || '',
        'Nombres': n.nombres || '',
        'Materia': n.materia || '',
        'Nivel': n.nivel || '',
        'Grado': n.grado || '',
        'Sección': n.seccion || '',
        'Período': n.periodo || '',
        'Nota': n.nota ?? '',
        'Observación': n.observacion || '',
        'Docente': n.docente || 'No asignado',
      }));

      const worksheet = XLSX.utils.json_to_sheet(filas);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas Docentes');

      worksheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
        { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
        { wch: 8 }, { wch: 30 }, { wch: 25 },
      ];

      const partes = ['Notas-Docentes'];
      if (filtroNivel) partes.push(filtroNivel);
      if (filtroGrado) partes.push(filtroGrado.replace(/\s+/g, '-'));
      if (filtroSeccion) partes.push(`Seccion-${filtroSeccion}`);
      if (filtroMateria) partes.push(filtroMateria.replace(/\s+/g, '-'));
      if (filtroPeriodo) partes.push(filtroPeriodo.replace(/\s+/g, '-'));
      if (filtroDocente) partes.push(filtroDocente.replace(/\s+/g, '-'));
      const nombreArchivo = `${partes.join('_')}_${Date.now()}.xlsx`;

      XLSX.writeFile(workbook, nombreArchivo);

      sileo.success({
        title: 'Excel descargado',
        description: `${datos.length} nota${datos.length === 1 ? '' : 's'} exportada${datos.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      sileo.error({ title: 'Error al exportar' });
    } finally {
      setExportando(false);
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

  const gradosCrear = gradosPorNivel[crearNivel as keyof typeof gradosPorNivel] || [];
  const materiasCrear = MATERIAS_POR_NIVEL[crearNivel] || [];

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

  const notasDocentesFiltradas = useMemo(() => {
    let lista = notasDocentes;

    const norm = (s?: string | null) =>
      (s || '')
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const mapaGrados: Record<string, string> = {
      '1er ano': '1ro', '1er año': '1ro', '1ro': '1ro',
      '1ero': '1ro', 'primero': '1ro', '1': '1ro',
      '1° ano': '1ro', '1° año': '1ro',
      '2do ano': '2do', '2do año': '2do', '2do': '2do',
      '2da': '2do', 'segundo': '2do', '2': '2do',
      '2° ano': '2do', '2° año': '2do',
      '3er ano': '3ro', '3er año': '3ro', '3ro': '3ro',
      '3ero': '3ro', 'tercero': '3ro', '3': '3ro',
      '3° ano': '3ro', '3° año': '3ro',
      '4to ano': '4to', '4to año': '4to', '4to': '4to',
      '4ta': '4to', 'cuarto': '4to', '4': '4to',
      '4° ano': '4to', '4° año': '4to',
      '5to ano': '5to', '5to año': '5to', '5to': '5to',
      '5ta': '5to', 'quinto': '5to', '5': '5to',
      '5° ano': '5to', '5° año': '5to',
    };

    const normalizarGrado = (s?: string | null) => {
      const base = norm(s);
      return mapaGrados[base] ?? base;
    };

    if (filtroNivel) {
      lista = lista.filter((n) => norm(n.nivel) === norm(filtroNivel));
    }
    if (filtroGrado) {
      lista = lista.filter(
        (n) => normalizarGrado(n.grado) === normalizarGrado(filtroGrado)
      );
    }
    if (filtroSeccion) {
      lista = lista.filter((n) => norm(n.seccion) === norm(filtroSeccion));
    }
    if (filtroMateria) {
      lista = lista.filter((n) => norm(n.materia) === norm(filtroMateria));
    }
    if (filtroPeriodo) {
      lista = lista.filter((n) => norm(n.periodo) === norm(filtroPeriodo));
    }
    if (filtroDocente) {
      lista = lista.filter((n) => norm(n.docente) === norm(filtroDocente));
    }

    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase().trim();
      lista = lista.filter(
        (n) =>
          (n.nombres || '').toLowerCase().includes(t) ||
          (n.apellidos || '').toLowerCase().includes(t) ||
          (n.cedulaIdentidad || '').toLowerCase().includes(t) ||
          (n.docente || '').toLowerCase().includes(t)
      );
    }

    return lista;
  }, [
    notasDocentes,
    searchTerm,
    filtroNivel,
    filtroGrado,
    filtroSeccion,
    filtroMateria,
    filtroPeriodo,
    filtroDocente,
  ]);

  const detectarCursoPorCedulas = (
    cedulas: string[]
  ): { nivel: string; grado: string; seccion: string; confianza: number } | null => {
    if (cedulas.length === 0) return null;

    const cedulasSet = new Set(cedulas.map((c) => c.trim()));
    const cursosMap = new Map<string, { nivel: string; grado: string; seccion: string; coincidencias: number }>();

    estudiantes.forEach((est) => {
      if (!est.cedulaIdentidad) return;
      if (!cedulasSet.has(est.cedulaIdentidad.trim())) return;

      const key = `${est.nivel}|${est.grado}|${est.seccion}`;
      const actual = cursosMap.get(key);
      if (actual) {
        actual.coincidencias++;
      } else {
        cursosMap.set(key, {
          nivel: est.nivel,
          grado: est.grado,
          seccion: est.seccion,
          coincidencias: 1,
        });
      }
    });

    if (cursosMap.size === 0) return null;

    let mejor: { nivel: string; grado: string; seccion: string; coincidencias: number } | null = null;

    for (const valor of cursosMap.values()) {
      if (!mejor || valor.coincidencias > mejor.coincidencias) {
        mejor = valor;
      }
    }

    if (!mejor) return null;

    const mejorFinal = mejor as { nivel: string; grado: string; seccion: string; coincidencias: number };
    const confianza = mejorFinal.coincidencias / cedulas.length;

    return {
      nivel: mejorFinal.nivel,
      grado: mejorFinal.grado,
      seccion: mejorFinal.seccion,
      confianza,
    };
  };

  const extraerMateriaDelNombre = (nombreArchivo: string): string => {
    const nombreSinExt = nombreArchivo.replace(/\.(xlsx|xls)$/i, '');
    const nombreLower = nombreSinExt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const mapa: Record<string, string> = {
      'matem': 'Matemáticas',
      'castell': 'Castellano',
      'lengua': 'Castellano',
      'ingles': 'Inglés',
      'biolog': 'Biología',
      'quimic': 'Química',
      'fisic': 'Física',
      'histori': 'Historia',
      'geograf': 'Geografía',
      'informatic': 'Informática',
      'arte': 'Arte y Patrimonio',
      'patrimonio': 'Arte y Patrimonio',
      'educacion fisica': 'Educación Física',
      'ed fisica': 'Educación Física',
      'ed. fisica': 'Educación Física',
      'ghc': 'G.H.C',
      'ciencias de la tierra': 'Ciencias de la Tierra',
      'ciencias naturales': 'Ciencias Naturales',
      'ciencias sociales': 'Ciencias Sociales',
      'expresion': 'Expresión Artística',
      'educacion artistica': 'Educación Artística',
    };

    for (const [key, valor] of Object.entries(mapa)) {
      if (nombreLower.includes(key)) {
        return valor;
      }
    }

    const todasLasMaterias = Object.values(MATERIAS_POR_NIVEL).flat();
    for (const materia of todasLasMaterias) {
      const materiaNorm = materia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (nombreLower.includes(materiaNorm)) {
        return materia;
      }
    }

    return '';
  };

  const procesarArchivosMasivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (estudiantes.length === 0) {
      sileo.warning({
        title: 'Sin estudiantes',
        description: 'Espera a que carguen los estudiantes primero',
      });
      e.target.value = '';
      return;
    }

    setImportandoMasivo(true);

    try {
      const XLSX = await import('xlsx');
      const nuevosArchivos: ArchivoPrevisualizacion[] = [];

      for (const file of Array.from(files)) {
        const idTemp = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
          nuevosArchivos.push({
            id: idTemp,
            nombreArchivo: file.name,
            materiaDetectada: '',
            periodoDetectado: '1er Lapso',
            gradoDetectado: '',
            seccionDetectada: '',
            nivelDetectado: '',
            filas: [],
            cargando: false,
            error: 'Formato no válido (solo .xlsx o .xls)',
          });
          continue;
        }

        try {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
          const filasRaw: any[] = XLSX.utils.sheet_to_json(primeraHoja, { defval: '' });

          if (filasRaw.length === 0) {
            nuevosArchivos.push({
              id: idTemp,
              nombreArchivo: file.name,
              materiaDetectada: '',
              periodoDetectado: '1er Lapso',
              gradoDetectado: '',
              seccionDetectada: '',
              nivelDetectado: '',
              filas: [],
              cargando: false,
              error: 'Archivo vacío',
            });
            continue;
          }

          let materiaDelExcel = '';
          let periodoDelExcel = '';

          for (let i = 0; i < Math.min(5, filasRaw.length); i++) {
            const fila = filasRaw[i];
            const keys = Object.keys(fila);

            for (const k of keys) {
              const kLower = String(k).toLowerCase();
              const vLower = String(fila[k]).toLowerCase();

              if (kLower.includes('materia') && !materiaDelExcel) {
                materiaDelExcel = String(fila[k]);
              }
              if ((kLower.includes('periodo') || kLower.includes('período') || kLower.includes('lapso')) && !periodoDelExcel) {
                periodoDelExcel = String(fila[k]);
              }
              if (vLower === 'materia' && keys.length > 1) {
                const valor = fila[keys[1]];
                if (valor) materiaDelExcel = String(valor);
              }
            }
          }

          const materiaDelNombre = extraerMateriaDelNombre(file.name);
          const materiaDetectada = materiaDelExcel || materiaDelNombre || '';

          const periodoDetectado = (() => {
            if (periodoDelExcel) {
              if (periodoDelExcel.toLowerCase().includes('1')) return '1er Lapso';
              if (periodoDelExcel.toLowerCase().includes('2')) return '2do Lapso';
              if (periodoDelExcel.toLowerCase().includes('3')) return '3er Lapso';
            }
            if (file.name.toLowerCase().includes('1er') || file.name.toLowerCase().includes('1ro')) return '1er Lapso';
            if (file.name.toLowerCase().includes('2do')) return '2do Lapso';
            if (file.name.toLowerCase().includes('3er') || file.name.toLowerCase().includes('3ro')) return '3er Lapso';
            return '1er Lapso';
          })();

          const mapaEstudiantes = new Map<string, Estudiante>();
          estudiantes.forEach((est) => {
            if (est.cedulaIdentidad) {
              mapaEstudiantes.set(est.cedulaIdentidad.trim(), est);
            }
          });

          const filasProcesadas: FilaPrevisualizacion[] = [];
          const cedulasDetectadas: string[] = [];

          filasRaw.forEach((fila) => {
            const cedula = String(
              fila['Cédula'] ?? fila['cedula'] ?? fila['CEDULA'] ?? fila['Cedula'] ?? ''
            ).trim();
            const notaRaw = fila['Nota'] ?? fila['nota'] ?? fila['NOTA'] ?? '';
            const observacion = String(
              fila['Observación'] ?? fila['observacion'] ?? fila['Observacion'] ?? fila['OBSERVACIÓN'] ?? fila['obs'] ?? ''
            ).trim();

            if (!cedula && !notaRaw) return;

            if (cedula) cedulasDetectadas.push(cedula);

            const estudiante = mapaEstudiantes.get(cedula);

            if (!cedula) {
              filasProcesadas.push({
                cedula: '',
                nota: String(notaRaw),
                observacion,
                valido: false,
                error: 'Sin cédula',
              });
              return;
            }

            if (!estudiante) {
              filasProcesadas.push({
                cedula,
                nota: String(notaRaw),
                observacion,
                valido: false,
                error: 'Cédula no existe',
              });
              return;
            }

            if (notaRaw === '' || notaRaw === null || notaRaw === undefined) {
              filasProcesadas.push({
                cedula,
                nota: '',
                observacion,
                estudianteId: estudiante.id,
                estudianteNombre: `${estudiante.apellidos}, ${estudiante.nombres}`,
                valido: false,
                error: 'Sin nota',
              });
              return;
            }

            const nota = parseFloat(String(notaRaw).replace(',', '.'));
            if (isNaN(nota)) {
              filasProcesadas.push({
                cedula,
                nota: String(notaRaw),
                observacion,
                estudianteId: estudiante.id,
                estudianteNombre: `${estudiante.apellidos}, ${estudiante.nombres}`,
                valido: false,
                error: 'Nota no válida',
              });
              return;
            }

            if (nota < 0 || nota > 20) {
              filasProcesadas.push({
                cedula,
                nota: String(nota),
                observacion,
                estudianteId: estudiante.id,
                estudianteNombre: `${estudiante.apellidos}, ${estudiante.nombres}`,
                valido: false,
                error: 'Nota fuera de rango (0-20)',
              });
              return;
            }

            filasProcesadas.push({
              cedula,
              nota: String(nota),
              observacion,
              estudianteId: estudiante.id,
              estudianteNombre: `${estudiante.apellidos}, ${estudiante.nombres}`,
              valido: true,
            });
          });

          const cursoDetectado = detectarCursoPorCedulas(cedulasDetectadas);

          nuevosArchivos.push({
            id: idTemp,
            nombreArchivo: file.name,
            materiaDetectada,
            periodoDetectado,
            gradoDetectado: cursoDetectado?.grado || '',
            seccionDetectada: cursoDetectado?.seccion || '',
            nivelDetectado: cursoDetectado?.nivel || '',
            filas: filasProcesadas,
            cargando: false,
          });
        } catch (err) {
          console.error('Error procesando archivo:', file.name, err);
          nuevosArchivos.push({
            id: idTemp,
            nombreArchivo: file.name,
            materiaDetectada: '',
            periodoDetectado: '1er Lapso',
            gradoDetectado: '',
            seccionDetectada: '',
            nivelDetectado: '',
            filas: [],
            cargando: false,
            error: 'Error al leer el archivo',
          });
        }
      }

      setArchivosPrevisualizacion((prev) => [...prev, ...nuevosArchivos]);

      const totalValidas = nuevosArchivos.reduce(
        (acc, a) => acc + a.filas.filter((f) => f.valido).length,
        0
      );

      sileo.success({
        title: 'Archivos procesados',
        description: `${nuevosArchivos.length} archivo${nuevosArchivos.length === 1 ? '' : 's'}, ${totalValidas} nota${totalValidas === 1 ? '' : 's'} válida${totalValidas === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('Error general:', error);
      sileo.error({ title: 'Error al procesar archivos' });
    } finally {
      setImportandoMasivo(false);
      e.target.value = '';
    }
  };

  const eliminarArchivoPrevisualizacion = (id: string) => {
    setArchivosPrevisualizacion((prev) => prev.filter((a) => a.id !== id));
  };

  const actualizarArchivo = (
    id: string,
    campo: Partial<Record<'materiaDetectada' | 'periodoDetectado' | 'gradoDetectado' | 'seccionDetectada' | 'nivelDetectado', string>>
  ) => {
    setArchivosPrevisualizacion((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...campo } : a))
    );
  };

  const guardarTodoMasivo = async () => {
    const archivosValidos = archivosPrevisualizacion.filter(
      (a) => !a.error && a.filas.some((f) => f.valido)
    );

    if (archivosValidos.length === 0) {
      return sileo.warning({
        title: 'Nada para guardar',
        description: 'No hay archivos con notas válidas',
      });
    }

    for (const archivo of archivosValidos) {
      if (!archivo.materiaDetectada) {
        return sileo.warning({
          title: 'Falta materia',
          description: `El archivo "${archivo.nombreArchivo}" no tiene materia detectada.`,
        });
      }
      if (!archivo.nivelDetectado || !archivo.gradoDetectado || !archivo.seccionDetectada) {
        return sileo.warning({
          title: 'Falta curso',
          description: `El archivo "${archivo.nombreArchivo}" no tiene curso detectado.`,
        });
      }
    }

    const todasLasNotas: Array<{
      estudianteId: string;
      materia: string;
      nivel: string;
      grado: string;
      seccion: string;
      periodo: string;
      nota: number;
      observacion: string;
    }> = [];

    archivosValidos.forEach((archivo) => {
      archivo.filas
        .filter((f) => f.valido && f.estudianteId)
        .forEach((f) => {
          todasLasNotas.push({
            estudianteId: f.estudianteId!,
            materia: archivo.materiaDetectada,
            nivel: archivo.nivelDetectado,
            grado: archivo.gradoDetectado,
            seccion: archivo.seccionDetectada,
            periodo: archivo.periodoDetectado,
            nota: parseFloat(f.nota),
            observacion: f.observacion || '',
          });
        });
    });

    if (todasLasNotas.length === 0) {
      return sileo.warning({ title: 'Sin notas para guardar' });
    }

    setGuardandoMasivo(true);
    try {
      const res = await fetch('/api/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: todasLasNotas }),
      });

      if (!res.ok) {
        const err = await res.json();
        sileo.error({ title: 'Error al guardar', description: err.error });
        return;
      }

      const data = await res.json();
      sileo.success({
        title: 'Nóminas guardadas',
        description: `${data.guardadas} nota${data.guardadas === 1 ? '' : 's'} registrada${data.guardadas === 1 ? '' : 's'}`,
      });

      setArchivosPrevisualizacion([]);
      setVerConsolidado(false);
    } catch (error) {
      console.error('Error al guardar masivo:', error);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardandoMasivo(false);
    }
  };

  const cancelarImportacionMasiva = () => {
    setArchivosPrevisualizacion([]);
    setVerConsolidado(false);
  };

  const generarConsolidado = useMemo(() => {
    const archivosValidos = archivosPrevisualizacion.filter(
      (a) => !a.error && a.filas.some((f) => f.valido) && a.materiaDetectada
    );

    if (archivosValidos.length === 0) {
      return { materias: [] as string[], estudiantes: [] as EstudianteConsolidado[] };
    }

    const materias = Array.from(new Set(archivosValidos.map((a) => a.materiaDetectada)));

    const estudiantesMap = new Map<string, EstudianteConsolidado>();

    archivosValidos.forEach((archivo) => {
      archivo.filas
        .filter((f) => f.valido && f.estudianteId)
        .forEach((f) => {
          const est = estudiantes.find((e) => e.id === f.estudianteId);
          if (!est) return;

          if (!estudiantesMap.has(f.estudianteId!)) {
            estudiantesMap.set(f.estudianteId!, {
              estudianteId: f.estudianteId!,
              cedula: est.cedulaIdentidad || '',
              nombre: est.nombres || '',
              apellido: est.apellidos || '',
              notas: {},
              observaciones: {},
              curso: {
                nivel: archivo.nivelDetectado,
                grado: archivo.gradoDetectado,
                seccion: archivo.seccionDetectada,
              },
            });
          }

          const entry = estudiantesMap.get(f.estudianteId!)!;
          entry.notas[archivo.materiaDetectada] = parseFloat(f.nota);
          entry.observaciones[archivo.materiaDetectada] = f.observacion || '';
        });
    });

    const estudiantesConsolidados = Array.from(estudiantesMap.values()).sort((a, b) =>
      a.apellido.localeCompare(b.apellido)
    );

    return { materias, estudiantes: estudiantesConsolidados };
  }, [archivosPrevisualizacion, estudiantes]);

  const calcularPromedio = (notas: Record<string, number | null>, materias: string[]) => {
    const validas = materias
      .map((m) => notas[m])
      .filter((n): n is number => n !== null && n !== undefined && !isNaN(n));
    if (validas.length === 0) return null;
    return validas.reduce((a, b) => a + b, 0) / validas.length;
  };

  const exportarConsolidado = async () => {
    const { materias, estudiantes: listaEst } = generarConsolidado;

    if (listaEst.length === 0) {
      return sileo.warning({
        title: 'Sin datos',
        description: 'No hay notas consolidadas para exportar',
      });
    }

    try {
      setExportando(true);
      const XLSX = await import('xlsx');

      const filas = listaEst.map((est) => {
        const fila: Record<string, string | number | null> = {
          'Cédula': est.cedula,
          'Apellidos': est.apellido,
          'Nombres': est.nombre,
        };

        materias.forEach((m) => {
          fila[m] = est.notas[m] ?? '';
        });

        const promedio = calcularPromedio(est.notas, materias);
        fila['Promedio'] = promedio !== null ? Number(promedio.toFixed(2)) : '';

        return fila;
      });

      const worksheet = XLSX.utils.json_to_sheet(filas);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Nómina Consolidada');

      const cols = [
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        ...materias.map(() => ({ wch: 14 })),
        { wch: 12 },
      ];
      worksheet['!cols'] = cols;

      const cursoInfo = listaEst[0]?.curso;
      const sufijo = cursoInfo
        ? `${cursoInfo.grado.replace(/\s+/g, '-')}_${cursoInfo.seccion}`
        : 'General';

      const nombreArchivo = `Nomina_Consolidada_${sufijo}_${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);

      sileo.success({
        title: 'Nómina consolidada descargada',
        description: `${listaEst.length} estudiantes x ${materias.length} materias`,
      });
    } catch (error) {
      console.error('Error al exportar consolidado:', error);
      sileo.error({ title: 'Error al exportar' });
    } finally {
      setExportando(false);
    }
  };

  const guardarConsolidado = async () => {
    const { estudiantes: listaEst } = generarConsolidado;

    if (listaEst.length === 0) {
      return sileo.warning({ title: 'Sin datos para guardar' });
    }

    const archivosValidos = archivosPrevisualizacion.filter(
      (a) => !a.error && a.filas.some((f) => f.valido)
    );

    for (const archivo of archivosValidos) {
      if (!archivo.nivelDetectado || !archivo.gradoDetectado || !archivo.seccionDetectada) {
        return sileo.warning({
          title: 'Falta curso',
          description: `El archivo "${archivo.nombreArchivo}" no tiene curso detectado.`,
        });
      }
      if (!archivo.materiaDetectada) {
        return sileo.warning({
          title: 'Falta materia',
          description: `El archivo "${archivo.nombreArchivo}" no tiene materia detectada.`,
        });
      }
    }

    const payload: Array<{
      estudianteId: string;
      materia: string;
      nivel: string;
      grado: string;
      seccion: string;
      periodo: string;
      nota: number;
      observacion: string;
    }> = [];

    archivosValidos.forEach((archivo) => {
      archivo.filas
        .filter((f) => f.valido && f.estudianteId)
        .forEach((f) => {
          payload.push({
            estudianteId: f.estudianteId!,
            materia: archivo.materiaDetectada,
            nivel: archivo.nivelDetectado,
            grado: archivo.gradoDetectado,
            seccion: archivo.seccionDetectada,
            periodo: archivo.periodoDetectado,
            nota: parseFloat(f.nota),
            observacion: f.observacion || '',
          });
        });
    });

    if (payload.length === 0) {
      return sileo.warning({ title: 'Sin notas para guardar' });
    }

    setGuardandoMasivo(true);
    try {
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
        title: 'Consolidado guardado',
        description: `${data.guardadas} nota${data.guardadas === 1 ? '' : 's'} registrada${data.guardadas === 1 ? '' : 's'}`,
      });

      setArchivosPrevisualizacion([]);
      setVerConsolidado(false);
    } catch (error) {
      console.error('Error al guardar consolidado:', error);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardandoMasivo(false);
    }
  };

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

      setModoCrearNomina(false);
      setCrearGrado('');
      setCrearSeccion('');
      setCrearMateria('');
      setCrearNotas({});

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
    setFiltroDocente('');
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

      <main className="relative z-10 max-w-350 mx-auto px-4 sm:px-[8%] py-6">
        <Card className="bg-white/3 backdrop-blur-xl border-white/5 overflow-hidden rounded-3xl">
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
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setModoCrearNomina(true);
                    setModoVerNotasDocentes(false);
                    setVerConsolidado(false);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Nómina
                </Button>

                <label
                  className={`inline-flex items-center justify-center gap-2 rounded-md px-4 h-9 text-sm font-bold cursor-pointer transition-colors bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-lg shadow-emerald-500/20 ${importandoMasivo ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {importandoMasivo ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4" />
                      Importar varias nóminas
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    multiple
                    onChange={procesarArchivosMasivo}
                    className="hidden"
                    disabled={importandoMasivo}
                  />
                </label>

                <Button
                  onClick={() => {
                    setModoVerNotasDocentes(true);
                    setModoCrearNomina(false);
                    setVerConsolidado(false);
                    setFiltroNivel('');
                    setFiltroGrado('');
                    setFiltroSeccion('');
                    setFiltroMateria('');
                    setFiltroDocente('');
                    setSearchTerm('');
                  }}
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Ver Notas de Docentes
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-4 sm:px-10 py-6 sm:py-8 space-y-6">
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
                        setFiltroNivel(v === 'all' || !v ? '' : v);
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
                        onValueChange={(v) => setFiltroGrado(v === 'all' || !v ? '' : v)}
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
                      onValueChange={(v) => setFiltroSeccion(v === 'all' || !v ? '' : v)}
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

            {tabActiva === 'notas' && (
              <div className="space-y-6">
                {archivosPrevisualizacion.length > 0 && (
                  <Card className="bg-emerald-500/5 border-emerald-500/30 rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-emerald-400 text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Layers className="w-5 h-5" />
                          Importación Masiva ({archivosPrevisualizacion.length} archivo{archivosPrevisualizacion.length === 1 ? '' : 's'})
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelarImportacionMasiva}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          {archivosPrevisualizacion.length} archivo(s)
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {archivosPrevisualizacion.reduce((acc, a) => acc + a.filas.filter((f) => f.valido).length, 0)} notas válidas
                        </Badge>
                        {archivosPrevisualizacion.reduce((acc, a) => acc + a.filas.filter((f) => !f.valido).length, 0) > 0 && (
                          <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {archivosPrevisualizacion.reduce((acc, a) => acc + a.filas.filter((f) => !f.valido).length, 0)} errores
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        {archivosPrevisualizacion.map((archivo) => {
                          const validas = archivo.filas.filter((f) => f.valido).length;
                          const invalidas = archivo.filas.filter((f) => !f.valido).length;

                          return (
                            <Card key={archivo.id} className="bg-black/30 border-white/10 backdrop-blur">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <span className="text-white font-medium text-sm truncate">{archivo.nombreArchivo}</span>
                                    {archivo.error ? (
                                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[0.6rem] flex-shrink-0">
                                        {archivo.error}
                                      </Badge>
                                    ) : (
                                      <>
                                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[0.6rem] flex-shrink-0">
                                          {validas} válidas
                                        </Badge>
                                        {invalidas > 0 && (
                                          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[0.6rem] flex-shrink-0">
                                            {invalidas} con error
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => eliminarArchivoPrevisualizacion(archivo.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 flex-shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                {!archivo.error && (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                      <div>
                                        <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">Nivel</Label>
                                        <Select
                                          value={archivo.nivelDetectado || 'none'}
                                          onValueChange={(v) => actualizarArchivo(archivo.id, { nivelDetectado: v === 'none' || !v ? '' : v })}
                                        >
                                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-8 text-xs">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Seleccionar</SelectItem>
                                            {niveles.map((n) => (
                                              <SelectItem key={n.id} value={n.id}>{n.nombre.replace('Educacion ', '')}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">Grado</Label>
                                        <Select
                                          value={archivo.gradoDetectado || 'none'}
                                          onValueChange={(v) => actualizarArchivo(archivo.id, { gradoDetectado: v === 'none' || !v ? '' : v })}
                                        >
                                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-8 text-xs">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Seleccionar</SelectItem>
                                            {archivo.nivelDetectado &&
                                              gradosPorNivel[archivo.nivelDetectado as keyof typeof gradosPorNivel]?.map((g) => (
                                                <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">Sección</Label>
                                        <Select
                                          value={archivo.seccionDetectada || 'none'}
                                          onValueChange={(v) => actualizarArchivo(archivo.id, { seccionDetectada: v === 'none' || !v ? '' : v })}
                                        >
                                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-8 text-xs">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Seleccionar</SelectItem>
                                            {secciones.map((s) => (
                                              <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">Materia</Label>
                                        <Select
                                          value={archivo.materiaDetectada || 'none'}
                                          onValueChange={(v) => actualizarArchivo(archivo.id, { materiaDetectada: v === 'none' || !v ? '' : v })}
                                        >
                                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-8 text-xs">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Seleccionar</SelectItem>
                                            {archivo.nivelDetectado &&
                                              MATERIAS_POR_NIVEL[archivo.nivelDetectado]?.map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label className="text-[0.6rem] uppercase text-emerald-400/80 font-bold mb-1 block">Período</Label>
                                        <Select
                                          value={archivo.periodoDetectado}
                                          onValueChange={(v) => actualizarArchivo(archivo.id, { periodoDetectado: v || '1er Lapso' })}
                                        >
                                          <SelectTrigger className="bg-black/40 border-white/10 text-white h-8 text-xs">
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

                                    {(!archivo.materiaDetectada || !archivo.gradoDetectado || !archivo.seccionDetectada || !archivo.nivelDetectado) && (
                                      <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Faltan datos por detectar. Complétalos manualmente.</span>
                                      </div>
                                    )}

                                    <div className="rounded-lg border border-white/10 overflow-auto max-h-[200px]">
                                      <Table>
                                        <TableHeader className="sticky top-0 bg-black/60 backdrop-blur">
                                          <TableRow className="bg-black/40 hover:bg-black/40">
                                            <TableHead className="text-emerald-400 font-bold text-[0.6rem] uppercase">Cédula</TableHead>
                                            <TableHead className="text-emerald-400 font-bold text-[0.6rem] uppercase">Estudiante</TableHead>
                                            <TableHead className="text-emerald-400 font-bold text-[0.6rem] uppercase text-center">Nota</TableHead>
                                            <TableHead className="text-emerald-400 font-bold text-[0.6rem] uppercase">Observación</TableHead>
                                            <TableHead className="text-emerald-400 font-bold text-[0.6rem] uppercase text-center">Estado</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {archivo.filas.map((fila, idx) => (
                                            <TableRow
                                              key={idx}
                                              className={`border-white/5 text-xs ${fila.valido ? '' : 'bg-red-500/5'}`}
                                            >
                                              <TableCell className="font-mono text-white py-1.5">{fila.cedula || '-'}</TableCell>
                                              <TableCell className="text-white py-1.5">{fila.estudianteNombre || '-'}</TableCell>
                                              <TableCell className="text-center py-1.5">
                                                <span className={`font-bold ${
                                                  !fila.valido ? 'text-red-400' :
                                                  parseFloat(fila.nota) >= 10 ? 'text-emerald-400' : 'text-yellow-400'
                                                }`}>
                                                  {fila.nota || '-'}
                                                </span>
                                              </TableCell>
                                              <TableCell className="text-gray-400 py-1.5">{fila.observacion || '-'}</TableCell>
                                              <TableCell className="text-center py-1.5">
                                                {fila.valido ? (
                                                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[0.55rem] px-1.5 py-0">
                                                    Válida
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[0.55rem] px-1.5 py-0">
                                                    {fila.error}
                                                  </Badge>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {verConsolidado && generarConsolidado.estudiantes.length > 0 && (
                        <Card className="bg-emerald-500/5 border-emerald-500/30 rounded-xl mt-4">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-emerald-400 text-base flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Nómina Consolidada - {generarConsolidado.materias.length} materia(s)
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setVerConsolidado(false)}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                {generarConsolidado.estudiantes.length} estudiantes
                              </Badge>
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                {generarConsolidado.materias.length} materias
                              </Badge>
                              {generarConsolidado.estudiantes[0]?.curso && (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                  Curso: {generarConsolidado.estudiantes[0].curso.grado} - {generarConsolidado.estudiantes[0].curso.seccion}
                                </Badge>
                              )}
                            </div>

                            <div className="rounded-lg border border-white/10 overflow-auto max-h-[500px]">
                              <Table>
                                <TableHeader className="sticky top-0 bg-black/60 backdrop-blur z-10">
                                  <TableRow className="bg-black/40 hover:bg-black/40">
                                    <TableHead className="text-emerald-400 font-bold text-[0.65rem] uppercase sticky left-0 bg-black/80 z-20">
                                      Cédula
                                    </TableHead>
                                    <TableHead className="text-emerald-400 font-bold text-[0.65rem] uppercase sticky left-20 bg-black/80 z-20 min-w-[180px]">
                                      Estudiante
                                    </TableHead>
                                    {generarConsolidado.materias.map((m) => (
                                      <TableHead key={m} className="text-emerald-400 font-bold text-[0.65rem] uppercase text-center min-w-[110px]">
                                        {m}
                                      </TableHead>
                                    ))}
                                    <TableHead className="text-emerald-400 font-bold text-[0.65rem] uppercase text-center bg-emerald-500/10 min-w-[100px]">
                                      Promedio
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {generarConsolidado.estudiantes.map((est) => {
                                    const promedio = calcularPromedio(est.notas, generarConsolidado.materias);
                                    return (
                                      <TableRow key={est.estudianteId} className="border-white/5 hover:bg-emerald-500/5">
                                        <TableCell className="font-mono text-emerald-400 text-sm sticky left-0 bg-[#0d1a15]/90 z-10">
                                          {est.cedula}
                                        </TableCell>
                                        <TableCell className="text-white text-sm sticky left-20 bg-[#0d1a15]/90 z-10 min-w-[180px]">
                                          {est.apellido}, {est.nombre}
                                        </TableCell>
                                        {generarConsolidado.materias.map((m) => {
                                          const nota = est.notas[m];
                                          const tieneNota = nota !== null && nota !== undefined;
                                          return (
                                            <TableCell key={m} className="text-center">
                                              {tieneNota ? (
                                                <Badge
                                                  className={
                                                    nota! >= 10
                                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                                                      : 'bg-red-500/15 text-red-400 border-red-500/30 font-bold'
                                                  }
                                                >
                                                  {nota}
                                                </Badge>
                                              ) : (
                                                <span className="text-gray-600 text-xs">-</span>
                                              )}
                                            </TableCell>
                                          );
                                        })}
                                        <TableCell className="text-center bg-emerald-500/10">
                                          {promedio !== null ? (
                                            <span className={`font-bold text-sm ${
                                              promedio >= 10 ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                              {promedio.toFixed(2)}
                                            </span>
                                          ) : (
                                            <span className="text-gray-600 text-xs">-</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>

                            <div className="text-xs text-gray-400">
                              <p className="m-0">
                                Celdas con <span className="text-gray-600">-</span> significan que el estudiante no tiene nota en esa materia.
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-white/5">
                              <Button
                                variant="outline"
                                onClick={exportarConsolidado}
                                disabled={exportando}
                                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <FileDown className="mr-2 h-4 w-4" />
                                {exportando ? 'Exportando...' : 'Descargar Excel consolidado'}
                              </Button>
                              <Button
                                onClick={guardarConsolidado}
                                disabled={guardandoMasivo}
                                className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                {guardandoMasivo ? 'Guardando...' : 'Guardar en el sistema'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-white/5">
                        <Button
                          variant="outline"
                          onClick={cancelarImportacionMasiva}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar todo
                        </Button>

                        <Button
                          onClick={() => setVerConsolidado(true)}
                          disabled={archivosPrevisualizacion.every((a) => a.error || !a.materiaDetectada || a.filas.filter((f) => f.valido).length === 0)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold disabled:opacity-40"
                        >
                          <Layers className="mr-2 h-4 w-4" />
                          Ver nómina consolidada
                        </Button>

                        <Button
                          onClick={guardarTodoMasivo}
                          disabled={guardandoMasivo || archivosPrevisualizacion.every((a) => a.error || a.filas.filter((f) => f.valido).length === 0)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold disabled:opacity-40"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {guardandoMasivo ? 'Guardando...' : `Guardar todas las notas`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {modoVerNotasDocentes && (
                  <Card className="bg-emerald-500/5 border-emerald-500/30 rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-emerald-400 text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" />
                          Notas Subidas por Docentes
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setModoVerNotasDocentes(false);
                            setNotasDocentes([]);
                            setFiltroDocente('');
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Nivel</Label>
                          <Select
                            value={filtroNivel || 'none'}
                            onValueChange={(v) => {
                              setFiltroNivel(v === 'none' || !v ? '' : v);
                              setFiltroGrado('');
                              setFiltroSeccion('');
                              setFiltroMateria('');
                            }}
                          >
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Todos</SelectItem>
                              {niveles.map((n) => (
                                <SelectItem key={n.id} value={n.id}>
                                  {n.nombre.replace('Educacion ', '')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Grado</Label>
                          <Select
                            value={filtroGrado || 'none'}
                            onValueChange={(v) => {
                              setFiltroGrado(v === 'none' || !v ? '' : v);
                              setFiltroSeccion('');
                            }}
                            disabled={!filtroNivel}
                          >
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Todos</SelectItem>
                              {filtroNivel &&
                                gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                                  <SelectItem key={g.id} value={g.id}>
                                    {g.nombre}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Sección</Label>
                          <Select
                            value={filtroSeccion || 'none'}
                            onValueChange={(v) => setFiltroSeccion(v === 'none' || !v ? '' : v)}
                            disabled={!filtroGrado}
                          >
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Todas</SelectItem>
                              {secciones.map((s) => (
                                <SelectItem key={s} value={s}>
                                  Sección {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Materia</Label>
                          <Select
                            value={filtroMateria || 'all'}
                            onValueChange={(v) => setFiltroMateria(v === 'all' || !v ? '' : v)}
                          >
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              {filtroNivel &&
                                MATERIAS_POR_NIVEL[filtroNivel]?.map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[0.65rem] uppercase text-emerald-400/80 font-bold mb-1.5 block">Docente</Label>
                          <Select
                            value={filtroDocente || 'all'}
                            onValueChange={(v) => setFiltroDocente(v === 'all' || !v ? '' : v)}
                          >
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 text-sm">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              {docentesConNotas.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
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
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={cargarNotasDocentes}
                          disabled={cargandoNotasDocentes}
                          className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${cargandoNotasDocentes ? 'animate-spin' : ''}`} />
                          Actualizar
                        </Button>
                        <Button
                          onClick={exportarNotasDocentes}
                          disabled={exportando || notasDocentesFiltradas.length === 0}
                          className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold disabled:opacity-40"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          {exportando ? 'Exportando...' : `Descargar Excel (${notasDocentesFiltradas.length})`}
                        </Button>
                      </div>

                      {notasDocentes.length > 0 && (
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                          <Input
                            placeholder="Buscar por cédula, nombre o docente..."
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
                      )}

                      {cargandoNotasDocentes ? (
                        <div className="text-center py-12 text-gray-400">
                          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                          <p>Cargando notas de docentes...</p>
                        </div>
                      ) : notasDocentes.length === 0 ? (
                        <div className="text-center py-12">
                          <GraduationCap className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg">
                            No hay notas subidas por docentes
                          </p>
                        </div>
                      ) : notasDocentesFiltradas.length === 0 ? (
                        <div className="text-center py-12">
                          <Search className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                          <p className="text-gray-400 text-lg">
                            No hay coincidencias con los filtros aplicados
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setFiltroNivel('');
                              setFiltroGrado('');
                              setFiltroSeccion('');
                              setFiltroMateria('');
                              setFiltroDocente('');
                              setSearchTerm('');
                            }}
                            className="mt-4 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Limpiar filtros
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              {notasDocentesFiltradas.length} de {notasDocentes.length} nota{notasDocentes.length === 1 ? '' : 's'}
                            </Badge>
                            {filtroDocente && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                Docente: {filtroDocente}
                              </Badge>
                            )}
                          </div>

                          <div className="rounded-xl border border-white/10 overflow-auto max-h-[500px]">
                            <Table>
                              <TableHeader className="sticky top-0 bg-black/40 backdrop-blur">
                                <TableRow className="bg-black/30 hover:bg-black/30">
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Cédula</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Estudiante</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Materia</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Curso</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Período</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center">Nota</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Observación</TableHead>
                                  <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Docente</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {notasDocentesFiltradas.map((n) => (
                                  <TableRow key={n.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-mono text-emerald-400 text-sm">
                                      {n.cedulaIdentidad || '-'}
                                    </TableCell>
                                    <TableCell className="text-white">
                                      {n.apellidos}, {n.nombres}
                                    </TableCell>
                                    <TableCell className="text-gray-300 text-sm">{n.materia}</TableCell>
                                    <TableCell className="text-gray-300 text-sm">
                                      {n.grado} - {n.seccion}
                                    </TableCell>
                                    <TableCell className="text-gray-300 text-sm">{n.periodo}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge
                                        className={
                                          n.nota >= 10
                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                                            : 'bg-red-500/15 text-red-400 border-red-500/30 font-bold'
                                        }
                                      >
                                        {n.nota}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-sm">
                                      {n.observacion || '-'}
                                    </TableCell>
                                    <TableCell className="text-emerald-400 text-sm font-medium">
                                      {n.docente || 'No asignado'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                                          placeholder="-"
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

                {!modoCrearNomina && !modoVerNotasDocentes && archivosPrevisualizacion.length === 0 && (
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
                )}

                {!modoCrearNomina && !modoVerNotasDocentes && archivosPrevisualizacion.length === 0 && (
                  <>
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
                                            esAprobado ? 'text-emerald-400' : 'text-red-400'
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
                  </>
                )}
              </div>
            )}

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