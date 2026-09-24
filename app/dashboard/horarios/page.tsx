// app/dashboard/horarios/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
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
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Calendar,
  Clock,
  FileDown,
  User,
  ArrowLeft,
} from "lucide-react";

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  white: '#ffffff',
  darkText: '#1a2e26'
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const MATERIAS_POR_NIVEL = {
  inicial: [
    'Lenguaje y Comunicación',
    'Matemáticas',
    'Expresión Artística',
    'Educación Física',
  ],
  primaria: [
    'Lengua Española',
    'Matemáticas',
    'Ciencias Sociales',
    'Ciencias Naturales',
    'Inglés',
    'Educación Artística',
    'Educación Física',
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
    'Informática',
  ],
};

const SECCIONES_DISPONIBLES = ['A', 'B', 'C', 'D', 'E'];

interface Horario {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  materia: string;
  docenteId: string;
  docente: string;
  docenteEmail?: string;
  nivel: string;
  grado: string;
  seccion: string;
  aula: string;
  anioAcademico: string;
  createdAt: string;
  updatedAt: string;
}

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

// ============================================
// Componente principal
// ============================================
const HorariosPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<string>('');
  const [filtroGrado, setFiltroGrado] = useState<string>('');
  const [filtroSeccion, setFiltroSeccion] = useState<string>('');
  const [filtroDia, setFiltroDia] = useState<string>('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [horarioEditando, setHorarioEditando] = useState<Horario | null>(null);

  const [confirmacion, setConfirmacion] = useState<{
    abierto: boolean;
    titulo: string;
    descripcion: string;
    onConfirm: () => void;
  } | null>(null);

  const niveles = [
    { id: 'inicial', nombre: 'Educación Inicial' },
    { id: 'primaria', nombre: 'Educación Primaria' },
    { id: 'media', nombre: 'Educación Media' },
  ];

  const gradosPorNivel = {
    inicial: [
      { id: '1er nivel', nombre: '1er Nivel' },
      { id: '2do nivel', nombre: '2do Nivel' },
      { id: '3er nivel', nombre: '3er Nivel' },
    ],
    primaria: [
      { id: '1ro', nombre: '1er Grado' },
      { id: '2do', nombre: '2do Grado' },
      { id: '3ro', nombre: '3er Grado' },
      { id: '4to', nombre: '4to Grado' },
      { id: '5to', nombre: '5to Grado' },
      { id: '6to', nombre: '6to Grado' },
    ],
    media: [
      { id: '1ro', nombre: '1er Año' },
      { id: '2do', nombre: '2do Año' },
      { id: '3ro', nombre: '3er Año' },
      { id: '4to', nombre: '4to Año' },
      { id: '5to', nombre: '5to Año' },
    ],
  };

  // ============ CARGA DE DATOS ============

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      cargarDatos();
    }
  }, [status]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resHorarios, resDocentes] = await Promise.all([
        fetch('/api/horarios'),
        fetch('/api/docentes'),
      ]);

      if (resHorarios.ok) {
        const data = await resHorarios.json();
        setHorarios(data);
      }

      if (resDocentes.ok) {
        const data = await resDocentes.json();
        setDocentes(
          data.map((d: any) => ({
            id: d.id,
            nombres: d.nombres || d.nombre || '',
            apellidos: d.apellidos || d.apellido || '',
            email: d.email || '',
          }))
        );
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      sileo.error({ title: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  // ============ FILTRADO ============

  const horariosFiltrados = useMemo(() => {
    let filtered = horarios;

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (h) =>
          h.materia.toLowerCase().includes(term) ||
          h.docente.toLowerCase().includes(term) ||
          (h.aula || '').toLowerCase().includes(term) ||
          h.diaSemana.toLowerCase().includes(term)
      );
    }

    if (filtroNivel) filtered = filtered.filter((h) => h.nivel === filtroNivel);
    if (filtroGrado) filtered = filtered.filter((h) => h.grado === filtroGrado);
    if (filtroSeccion) filtered = filtered.filter((h) => h.seccion === filtroSeccion);
    if (filtroDia) filtered = filtered.filter((h) => h.diaSemana === filtroDia);

    return filtered;
  }, [horarios, searchTerm, filtroNivel, filtroGrado, filtroSeccion, filtroDia]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroNivel('');
    setFiltroGrado('');
    setFiltroSeccion('');
    setFiltroDia('');
  };

  const tieneFiltrosActivos =
    searchTerm || filtroNivel || filtroGrado || filtroSeccion || filtroDia;

  // ============ CRUD ============

  const handleCrear = () => {
    setHorarioEditando(null);
    setModoEdicion(false);
    setMostrarModal(true);
  };

  const handleEditar = (horario: Horario) => {
    setHorarioEditando(horario);
    setModoEdicion(true);
    setMostrarModal(true);
  };

  const handleGuardar = async () => {
    setMostrarModal(false);
    setHorarioEditando(null);
    await cargarDatos();
  };

  const handleEliminar = (id: string) => {
    setConfirmacion({
      abierto: true,
      titulo: '¿Eliminar horario?',
      descripcion: 'Esta acción no se puede deshacer',
      onConfirm: async () => {
        setConfirmacion(null);
        try {
          const response = await fetch(`/api/horarios/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            sileo.success({ title: 'Horario eliminado' });
            await cargarDatos();
          } else {
            sileo.error({ title: 'Error al eliminar horario' });
          }
        } catch (error) {
          console.error('Error:', error);
          sileo.error({ title: 'Error de conexión' });
        }
      },
    });
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

  // ============ EXPORTAR PDF (TABLA COMPLETA) ============

  const exportarAPDF = async () => {
    try {
      const jsPDFModule = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');

      const JsPDFClass = (jsPDFModule as any).default || (jsPDFModule as any).jsPDF;
      const autoTableFn = (autoTableModule as any).default || autoTableModule;

      const doc = new JsPDFClass({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(0, 187, 126);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HORARIOS', pageWidth / 2, 12, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('U.E Ciudad Cuatricentenaria', pageWidth / 2, 19, { align: 'center' });

      const tableData = horariosFiltrados.map((h, index) => [
        (index + 1).toString(),
        h.diaSemana,
        `${h.horaInicio} - ${h.horaFin}`,
        h.materia,
        h.docente,
        h.grado,
        h.seccion,
        h.aula || '-',
      ]);

      const tableConfig = {
        startY: 32,
        head: [['#', 'DÍA', 'HORA', 'MATERIA', 'DOCENTE', 'GRADO', 'SECCIÓN', 'AULA']],
        body:
          tableData.length > 0
            ? tableData
            : [['-', '-', '-', 'Sin horarios', '-', '-', '-', '-']],
        theme: 'grid' as const,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [0, 0, 0] as [number, number, number],
        },
        headStyles: {
          fillColor: [0, 187, 126] as [number, number, number],
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: 'bold' as const,
        },
        alternateRowStyles: { fillColor: [240, 250, 245] as [number, number, number] },
        margin: { top: 10, right: 10, bottom: 15, left: 10 },
      };

      if (typeof autoTableFn === 'function') {
        autoTableFn(doc, tableConfig);
      } else if ((doc as any).autoTable) {
        (doc as any).autoTable(tableConfig);
      }

      const nombreArchivo = `Horarios_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);

      sileo.success({ title: 'PDF exportado', description: nombreArchivo });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      sileo.error({ title: 'Error al exportar PDF' });
    }
  };

  // ============ EXPORTAR PDF INDIVIDUAL (FORMATO CUADRÍCULA) ============
  const exportarHorarioIndividualPDF = async (h: Horario) => {
    try {
      const jsPDFModule = await import('jspdf');
      const JsPDFClass = (jsPDFModule as any).default || (jsPDFModule as any).jsPDF;

      const doc = new JsPDFClass({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- Título general ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HORARIO DE CLASES', pageWidth / 2, 15, { align: 'center' });

      // --- Subtítulo (Datos del aula) ---
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const subtitulo = `${niveles.find((n) => n.id === h.nivel)?.nombre || h.nivel} | ${h.grado} | Sección ${h.seccion} | Año: ${h.anioAcademico || '2024-2025'}`;
      doc.text(subtitulo, pageWidth / 2, 22, { align: 'center' });

      // --- Configuración de la cuadrícula ---
      const startY = 30;
      const marginX = 15;
      const tableWidth = pageWidth - marginX * 2;

      // Ancho de columnas: primera (HORAS) 30mm, resto dividido en partes iguales
      const colWidths = [
        30,
        (tableWidth - 30) / 5,
        (tableWidth - 30) / 5,
        (tableWidth - 30) / 5,
        (tableWidth - 30) / 5,
        (tableWidth - 30) / 5,
      ];

      const rowHeightHeader = 10;
      const rowHeightData = 20;
      const diasSemana = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
      const horasFilas = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];

      // --- Función auxiliar para dibujar celdas ---
      const drawCell = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        isHeader: boolean = false,
        fontSize: number = 8
      ) => {
        // Fondo
        if (isHeader) {
          doc.setFillColor(0, 187, 126);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(x, y, w, h, 'F');

        // Borde negro
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, w, h, 'S');

        // Texto
        doc.setTextColor(isHeader ? 255 : 0, isHeader ? 255 : 0, isHeader ? 255 : 0);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isHeader ? 'bold' : 'normal');

        const textY = y + h / 2 + fontSize / 3;
        doc.text(text, x + w / 2, textY, { align: 'center', maxWidth: w - 2 });
      };

      // --- Dibujar Encabezados ---
      let currentX = marginX;
      drawCell('HORAS', currentX, startY, colWidths[0], rowHeightHeader, true, 9);
      currentX += colWidths[0];

      diasSemana.forEach((dia, i) => {
        drawCell(dia, currentX, startY, colWidths[i + 1], rowHeightHeader, true, 9);
        currentX += colWidths[i + 1];
      });

      // --- Filtrar todos los horarios del mismo nivel/grado/sección ---
      const horariosDelAula = horarios.filter(
        (x) =>
          x.nivel === h.nivel &&
          x.grado === h.grado &&
          x.seccion === h.seccion
      );

      // --- Dibujar Filas de Datos ---
      horasFilas.forEach((hora, rowIndex) => {
        const y = startY + rowHeightHeader + rowIndex * rowHeightData;
        let x = marginX;

        // Columna HORAS
        drawCell(hora, x, y, colWidths[0], rowHeightData, false, 8);
        x += colWidths[0];

        // Columnas de Días
        diasSemana.forEach((dia, colIndex) => {
          // Buscar si hay un bloque en esta celda (día + hora)
          const bloque = horariosDelAula.find((b) => {
            const diaCoincide = b.diaSemana.toUpperCase() === dia;
            const horaCoincide = b.horaInicio === hora;
            return diaCoincide && horaCoincide;
          });

          // Dibujar celda blanca con borde
          doc.setFillColor(255, 255, 255);
          doc.rect(x, y, colWidths[colIndex + 1], rowHeightData, 'F');

          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(x, y, colWidths[colIndex + 1], rowHeightData, 'S');

          // Si hay un bloque, escribir su contenido
          if (bloque) {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');

            const lineas = [
              bloque.materia,
              bloque.docente,
              bloque.aula ? `Aula: ${bloque.aula}` : '',
            ].filter(Boolean);

            const lineHeight = 3.5;
            const totalHeight = lineas.length * lineHeight;
            const startTextY = y + (rowHeightData - totalHeight) / 2 + 2.5;
            const maxWidth = colWidths[colIndex + 1] - 2;

            lineas.forEach((linea, i) => {
              const splitText = doc.splitTextToSize(linea, maxWidth);
              doc.text(splitText, x + colWidths[colIndex + 1] / 2, startTextY + i * lineHeight, {
                align: 'center',
              });
            });
          }

          x += colWidths[colIndex + 1];
        });
      });

      // --- Pie de página ---
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // --- Guardar PDF ---
      const nombreArchivo = `Horario_${h.grado}_${h.seccion}_${h.diaSemana}.pdf`;
      doc.save(nombreArchivo);

      sileo.success({
        title: 'PDF exportado con formato de cuadrícula',
        description: nombreArchivo,
      });
    } catch (error) {
      console.error('Error al exportar PDF individual:', error);
      sileo.error({ title: 'Error al exportar PDF' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#1a2e26] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Cargando horarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif", background: PALETTE.deepBg }}
    >
      {/* Fondo */}
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
            onClick={() => router.push('/control_estudios')}
            className="text-white/70 hover:text-white hover:bg-white/5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="hidden sm:block text-emerald-400 font-extrabold tracking-widest text-xs">
            GESTIÓN DE HORARIOS
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1.5 text-xs font-semibold">
            {horarios.length} bloques
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
        <Card className="relative z-10 bg-white/3 backdrop-blur-xl border-white/5 rounded-3xl">
          <CardHeader className="px-4 sm:px-10 py-6 sm:py-8 bg-emerald-500/5 border-b border-white/5 flex flex-row justify-between items-center flex-wrap gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-black text-white m-0 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-emerald-400" />
                Gestión de Horarios
              </CardTitle>
              <p className="text-gray-400 text-sm sm:text-base m-0">
                Crea, edita y organiza los horarios de clases
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={exportarAPDF}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <FileDown className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button
                onClick={handleCrear}
                className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                <Plus className="w-4 h-4 mr-2" /> Nuevo Horario
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-10 py-6 sm:py-8 space-y-6">
            {/* FILTROS */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <Input
                  type="text"
                  placeholder="Buscar por materia, docente, aula o día..."
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
                  <SelectContent className="z-9999">
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    {niveles.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filtroGrado || 'all'}
                  onValueChange={(v) => setFiltroGrado(v === 'all' ? '' : (v ?? ''))}
                  disabled={!filtroNivel}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                    <SelectValue placeholder="Todos los grados" />
                  </SelectTrigger>
                  <SelectContent className="z-9999">
                    <SelectItem value="all">Todos los grados</SelectItem>
                    {filtroNivel &&
                      gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filtroSeccion || 'all'}
                  onValueChange={(v) => setFiltroSeccion(v === 'all' ? '' : (v ?? ''))}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                    <SelectValue placeholder="Todas las secciones" />
                  </SelectTrigger>
                  <SelectContent className="z-9999">
                    <SelectItem value="all">Todas las secciones</SelectItem>
                    {SECCIONES_DISPONIBLES.map((s) => (
                      <SelectItem key={s} value={s}>
                        Sección {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filtroDia || 'all'}
                  onValueChange={(v) => setFiltroDia(v === 'all' ? '' : (v ?? ''))}
                >
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                    <SelectValue placeholder="Todos los días" />
                  </SelectTrigger>
                  <SelectContent className="z-9999">
                    <SelectItem value="all">Todos los días</SelectItem>
                    {DIAS_SEMANA.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {tieneFiltrosActivos && (
                  <Button
                    variant="outline"
                    onClick={limpiarFiltros}
                    className="border-white/10 text-gray-400 hover:bg-white/5 hover:border-emerald-500/40 h-11"
                  >
                    <X className="w-4 h-4 mr-2" /> Limpiar
                  </Button>
                )}
              </div>

              <p className="text-gray-400 text-sm">
                Mostrando {horariosFiltrados.length} de {horarios.length} bloques
              </p>
            </div>

            <Separator className="bg-white/5" />

            {/* TABLA */}
            {horariosFiltrados.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
                <Calendar className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
                <p className="text-gray-400 text-lg m-0">No se encontraron horarios</p>
                <p className="text-gray-500 text-sm mt-2">
                  {horarios.length === 0
                    ? 'Crea tu primer horario utilizando el botón "Nuevo Horario"'
                    : 'Prueba con otros filtros de búsqueda'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/20 hover:bg-black/20">
                      {[
                        'Día',
                        'Hora',
                        'Materia',
                        'Docente',
                        'Nivel',
                        'Grado',
                        'Sección',
                        'Aula',
                        'Acciones',
                      ].map((h) => (
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
                    {horariosFiltrados.map((h) => (
                      <TableRow key={h.id} className="border-white/5 hover:bg-white/5">
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            {h.diaSemana}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-mono text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            {h.horaInicio} - {h.horaFin}
                          </span>
                        </TableCell>
                        <TableCell className="text-white font-semibold">{h.materia}</TableCell>
                        <TableCell className="text-white">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            {h.docente}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {niveles.find((n) => n.id === h.nivel)?.nombre || h.nivel}
                        </TableCell>
                        <TableCell className="text-white">{h.grado}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            {h.seccion}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{h.aula || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {/* ✅ BOTÓN PDF INDIVIDUAL */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportarHorarioIndividualPDF(h)}
                              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/15 h-8 px-2"
                              title="Exportar cuadrícula de este grado/sección a PDF"
                            >
                              <FileDown className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditar(h)}
                              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/15 h-8 px-2"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEliminar(h.id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/15 h-8 px-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* MODAL */}
      {mostrarModal && (
        <HorarioModal
          horario={horarioEditando}
          modo={modoEdicion ? 'editar' : 'crear'}
          docentes={docentes}
          niveles={niveles}
          gradosPorNivel={gradosPorNivel}
          secciones={SECCIONES_DISPONIBLES}
          materiasPorNivel={MATERIAS_POR_NIVEL}
          onClose={() => {
            setMostrarModal(false);
            setHorarioEditando(null);
          }}
          onSave={handleGuardar}
        />
      )}

      {/* CONFIRM DIALOG */}
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
// HorarioModal — Cuadrícula estilo píldora
// ============================================

interface HorarioModalProps {
  horario: Horario | null;
  modo: 'crear' | 'editar';
  docentes: Docente[];
  niveles: { id: string; nombre: string }[];
  gradosPorNivel: { [key: string]: { id: string; nombre: string }[] };
  secciones: string[];
  materiasPorNivel: { [key: string]: string[] };
  onClose: () => void;
  onSave: (data: any) => void;
}

const HorarioModal: React.FC<HorarioModalProps> = ({
  horario,
  modo,
  docentes,
  niveles,
  gradosPorNivel,
  secciones,
  materiasPorNivel,
  onClose,
  onSave,
}) => {
  const [contexto, setContexto] = useState({
    nivel: horario?.nivel || 'media',
    grado: horario?.grado || '',
    seccion: horario?.seccion || 'A',
  });

  const [horas, setHoras] = useState<string[]>([
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00',
  ]);

  const [diasLocales, setDiasLocales] = useState<string[]>([
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes',
  ]);

  const [horariosLocales, setHorariosLocales] = useState<Horario[]>(
    horario ? [horario] : []
  );

  const [celdaActiva, setCeldaActiva] = useState<{ dia: string; hora: string } | null>(null);
  const [formCelda, setFormCelda] = useState({
    materia: '',
    docenteId: '',
    aula: '',
    duracion: 1,
  });

  const [bloqueEnEdicion, setBloqueEnEdicion] = useState<Horario | null>(null);

  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevoDia, setNuevoDia] = useState('');
  const [mostrarAgregarHora, setMostrarAgregarHora] = useState(false);
  const [mostrarAgregarDia, setMostrarAgregarDia] = useState(false);

  const gradosDisponibles = contexto.nivel
    ? gradosPorNivel[contexto.nivel as keyof typeof gradosPorNivel] || []
    : [];

  const materiasDisponibles = contexto.nivel
    ? materiasPorNivel[contexto.nivel as keyof typeof materiasPorNivel] || []
    : [];

  const horaFinPorBloque = (hora: string, duracion: number): string => {
    const [h, m] = hora.split(':').map(Number);
    const fin = h + duracion;
    return `${String(fin).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const obtenerHorarioEnCelda = (dia: string, hora: string): Horario | null => {
    return horariosLocales.find((h) => {
      if (h.diaSemana !== dia) return false;
      return hora >= h.horaInicio && hora < h.horaFin;
    }) || null;
  };

  const esInicioDeBloque = (dia: string, hora: string): boolean => {
    const h = obtenerHorarioEnCelda(dia, hora);
    return h !== null && h.horaInicio === hora;
  };

  const bloquesDeHorario = (h: Horario): number => {
    const [hIni] = h.horaInicio.split(':').map(Number);
    const [hFin] = h.horaFin.split(':').map(Number);
    return Math.max(1, hFin - hIni);
  };

  const handleAgregarHora = () => {
    if (!nuevaHora || !/^\d{2}:\d{2}$/.test(nuevaHora)) {
      sileo.warning({ title: 'Formato inválido', description: 'Usa el formato HH:MM' });
      return;
    }
    if (horas.includes(nuevaHora)) {
      sileo.warning({ title: 'Hora duplicada', description: 'Esa hora ya existe' });
      return;
    }
    const nuevas = [...horas, nuevaHora].sort();
    setHoras(nuevas);
    setNuevaHora('');
    setMostrarAgregarHora(false);
    sileo.success({ title: 'Hora agregada' });
  };

  const handleEliminarHora = (hora: string) => {
    const hayHorarios = horariosLocales.some((h) => h.horaInicio === hora);
    if (hayHorarios) {
      sileo.warning({
        title: 'Fila en uso',
        description: 'Elimina primero los bloques que empiezan a esa hora',
      });
      return;
    }
    setHoras(horas.filter((h) => h !== hora));
    sileo.success({ title: 'Hora eliminada' });
  };

  const handleAgregarDia = () => {
    const dia = nuevoDia.trim();
    if (!dia) {
      sileo.warning({ title: 'Nombre requerido' });
      return;
    }
    if (diasLocales.includes(dia)) {
      sileo.warning({ title: 'Día duplicado' });
      return;
    }
    setDiasLocales([...diasLocales, dia]);
    setNuevoDia('');
    setMostrarAgregarDia(false);
    sileo.success({ title: 'Día agregado' });
  };

  const handleEliminarDia = (dia: string) => {
    const hayHorarios = horariosLocales.some((h) => h.diaSemana === dia);
    if (hayHorarios) {
      sileo.warning({
        title: 'Columna en uso',
        description: 'Elimina primero los bloques de ese día',
      });
      return;
    }
    setDiasLocales(diasLocales.filter((d) => d !== dia));
    sileo.success({ title: 'Día eliminado' });
  };

  const handleClickCeldaVacia = (dia: string, hora: string) => {
    if (!contexto.grado) {
      sileo.warning({
        title: 'Falta información',
        description: 'Selecciona el nivel y el grado antes de asignar horarios',
      });
      return;
    }

    setCeldaActiva({ dia, hora });
    setBloqueEnEdicion(null);
    setFormCelda({ materia: '', docenteId: '', aula: '', duracion: 1 });
  };

  const handleClickBloque = (h: Horario) => {
    const [hIni] = h.horaInicio.split(':').map(Number);
    const [hFin] = h.horaFin.split(':').map(Number);
    const duracion = hFin - hIni || 1;

    setCeldaActiva({ dia: h.diaSemana, hora: h.horaInicio });
    setBloqueEnEdicion(h);
    setFormCelda({
      materia: h.materia,
      docenteId: h.docenteId,
      aula: h.aula || '',
      duracion,
    });
  };

  const handleGuardarBloque = () => {
    if (!celdaActiva) return;

    if (!formCelda.materia || !formCelda.docenteId) {
      sileo.warning({
        title: 'Datos incompletos',
        description: 'Selecciona la materia y el docente',
      });
      return;
    }

    const horaFin = horaFinPorBloque(celdaActiva.hora, formCelda.duracion);

    const choca = horariosLocales.some((h) => {
      if (h.id === bloqueEnEdicion?.id) return false;
      if (h.diaSemana !== celdaActiva.dia) return false;
      return (
        (celdaActiva.hora >= h.horaInicio && celdaActiva.hora < h.horaFin) ||
        (horaFin > h.horaInicio && horaFin <= h.horaFin) ||
        (celdaActiva.hora <= h.horaInicio && horaFin >= h.horaFin)
      );
    });

    if (choca) {
      sileo.warning({
        title: 'Choque de horarios',
        description: 'Ya existe un bloque en ese rango de horas',
      });
      return;
    }

    if (bloqueEnEdicion) {
      setHorariosLocales((prev) =>
        prev.map((h) =>
          h.id === bloqueEnEdicion.id
            ? {
                ...h,
                materia: formCelda.materia,
                docenteId: formCelda.docenteId,
                aula: formCelda.aula,
                horaInicio: celdaActiva.hora,
                horaFin,
              }
            : h
        )
      );
      sileo.success({ title: 'Bloque actualizado' });
    } else {
      const docente = docentes.find((d) => d.id === formCelda.docenteId);
      const nuevo: Horario = {
        id: `local-${Date.now()}`,
        diaSemana: celdaActiva.dia,
        horaInicio: celdaActiva.hora,
        horaFin,
        materia: formCelda.materia,
        docenteId: formCelda.docenteId,
        docente: `${docente?.nombres || ''} ${docente?.apellidos || ''}`.trim() || 'Docente',
        nivel: contexto.nivel,
        grado: contexto.grado,
        seccion: contexto.seccion,
        aula: formCelda.aula,
        anioAcademico: '2024-2025',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setHorariosLocales((prev) => [...prev, nuevo]);
      sileo.success({ title: 'Bloque agregado' });
    }

    setCeldaActiva(null);
    setBloqueEnEdicion(null);
  };

  const handleEliminarBloque = () => {
    if (!bloqueEnEdicion) return;
    setHorariosLocales((prev) => prev.filter((h) => h.id !== bloqueEnEdicion.id));
    setCeldaActiva(null);
    setBloqueEnEdicion(null);
    sileo.success({ title: 'Bloque eliminado' });
  };

  const handleCancelarCelda = () => {
    setCeldaActiva(null);
    setBloqueEnEdicion(null);
  };

  const handleGuardarTodo = async () => {
    if (!contexto.grado) {
      sileo.warning({
        title: 'Falta información',
        description: 'Selecciona el grado y la sección',
      });
      return;
    }

    if (horariosLocales.length === 0) {
      sileo.warning({
        title: 'Sin bloques',
        description: 'Agrega al menos un bloque al horario',
      });
      return;
    }

    try {
      const payload = horariosLocales.map((h) => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        materia: h.materia,
        docenteId: h.docenteId,
        nivel: contexto.nivel,
        grado: contexto.grado,
        seccion: contexto.seccion,
        aula: h.aula,
        anioAcademico: '2024-2025',
      }));

      const response = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        sileo.error({
          title: 'Error al guardar',
          description: error.error || 'Revisa los datos',
        });
        return;
      }

      const data = await response.json();
      sileo.success({
        title: 'Horario guardado',
        description: `${data.total} bloques guardados correctamente`,
      });

      onSave(payload[0]);
    } catch (error) {
      console.error('Error:', error);
      sileo.error({ title: 'Error de conexión' });
    }
  };

  return (
    <div
      className="liquid-overlay fixed inset-0 z-1000 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="liquid-modal rounded-3xl max-w-7xl w-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content h-full flex flex-col overflow-hidden">
          <div className="px-8 py-5 bg-emerald-500/5 border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-white font-bold text-2xl m-0 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-emerald-400" />
              {modo === 'crear' ? 'Nuevo Horario' : 'Editar Horario'}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/10 text-gray-400 hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardarTodo}
                className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                Guardar Horario
              </Button>
            </div>
          </div>

          <div className="px-8 py-5 bg-black/20 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Nivel *</Label>
              <Select
                value={contexto.nivel}
                onValueChange={(v) =>
                  setContexto({ ...contexto, nivel: v ?? 'media', grado: '' })
                }
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent className="z-9999">
                  {niveles.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Grado *</Label>
              <Select
                value={contexto.grado || 'none'}
                onValueChange={(v) =>
                  setContexto({ ...contexto, grado: v === 'none' ? '' : (v ?? '') })
                }
                disabled={!contexto.nivel}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar grado" />
                </SelectTrigger>
                <SelectContent className="z-9999">
                  <SelectItem value="none">Seleccionar grado</SelectItem>
                  {gradosDisponibles.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Sección *</Label>
              <Select
                value={contexto.seccion}
                onValueChange={(v) => setContexto({ ...contexto, seccion: v ?? 'A' })}
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent className="z-9999">
                  {secciones.map((s) => (
                    <SelectItem key={s} value={s}>
                      Sección {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end justify-between gap-2">
              <p className="text-gray-400 text-xs mb-2">
                Bloques: <strong className="text-emerald-400">{horariosLocales.length}</strong>
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarAgregarHora(true)}
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-8 px-2"
                  title="Agregar fila (hora)"
                >
                  <Plus className="w-3 h-3" /> Hora
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarAgregarDia(true)}
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-8 px-2"
                  title="Agregar columna (día)"
                >
                  <Plus className="w-3 h-3" /> Día
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="min-w-max">
              <div className="flex gap-2 mb-3 pl-28">
                {diasLocales.map((dia) => (
                  <div key={dia} className="w-44 shrink-0 relative group">
                    <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-center">
                      <span className="text-white font-bold text-sm uppercase tracking-wider">
                        {dia}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEliminarDia(dia)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                      title={`Eliminar ${dia}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {horas.map((hora) => (
                <div key={hora} className="flex gap-2 mb-2 items-stretch group/row">
                  <div className="w-28 shrink-0 relative">
                    <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 text-center h-full flex items-center justify-center">
                      <span className="text-white font-mono text-sm">{hora}</span>
                    </div>
                    <button
                      onClick={() => handleEliminarHora(hora)}
                      className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center z-10"
                      title={`Eliminar ${hora}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {diasLocales.map((dia) => {
                    const h = obtenerHorarioEnCelda(dia, hora);
                    const esInicio = esInicioDeBloque(dia, hora);

                    if (h && !esInicio) return null;

                    if (h && esInicio) {
                      return (
                        <div
                          key={`${dia}-${hora}`}
                          className="w-44 shrink-0 cursor-pointer"
                          onClick={() => handleClickBloque(h)}
                        >
                          <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl px-3 py-3 hover:bg-emerald-500/30 transition h-full flex flex-col">
                            <div className="text-emerald-300 text-[0.65rem] font-bold uppercase">
                              {h.horaInicio} - {h.horaFin}
                            </div>
                            <div className="text-white text-sm font-semibold mt-1 line-clamp-2">
                              {h.materia}
                            </div>
                            <div className="text-gray-300 text-[0.7rem] mt-1 line-clamp-1 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {h.docente}
                            </div>
                            {h.aula && (
                              <div className="text-gray-400 text-[0.65rem] mt-auto pt-1">
                                📍 {h.aula}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${dia}-${hora}`}
                        onClick={() => handleClickCeldaVacia(dia, hora)}
                        className={`w-44 shrink-0 bg-white/5 border border-white/10 rounded-2xl h-14 flex items-center justify-center transition ${
                          contexto.grado
                            ? 'hover:bg-emerald-500/10 hover:border-emerald-500/30 cursor-pointer'
                            : 'cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mostrarAgregarHora && (
        <div
          className="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setMostrarAgregarHora(false)}
        >
          <div
            className="bg-[#1a2e26] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg m-0">Agregar hora</h3>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Nueva hora (HH:MM)
              </Label>
              <Input
                type="time"
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
                className="bg-black/40 border-white/10 text-white mt-2"
                placeholder="07:00"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMostrarAgregarHora(false)}
                className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAgregarHora}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {mostrarAgregarDia && (
        <div
          className="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setMostrarAgregarDia(false)}
        >
          <div
            className="bg-[#1a2e26] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg m-0">Agregar día</h3>
            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Nombre del día
              </Label>
              <Input
                type="text"
                value={nuevoDia}
                onChange={(e) => setNuevoDia(e.target.value)}
                className="bg-black/40 border-white/10 text-white mt-2"
                placeholder="Ej: Sábado"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMostrarAgregarDia(false)}
                className="flex-1 border-white/10 text-gray-400 hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAgregarDia}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {celdaActiva && (
        <div
          className="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleCancelarCelda}
        >
          <div
            className="bg-[#1a2e26] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-bold text-lg m-0">
                {bloqueEnEdicion ? 'Editar bloque' : 'Agregar bloque'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelarCelda}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <strong>{celdaActiva.dia}</strong> · {celdaActiva.hora}
              </div>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Materia *</Label>
              <Select
                value={formCelda.materia || 'none'}
                onValueChange={(v) =>
                  setFormCelda({ ...formCelda, materia: v === 'none' ? '' : (v ?? '') })
                }
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent className="z-9999">
                  <SelectItem value="none">Seleccionar materia</SelectItem>
                  {materiasDisponibles.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Docente *</Label>
              <Select
                value={formCelda.docenteId || 'none'}
                onValueChange={(v) =>
                  setFormCelda({ ...formCelda, docenteId: v === 'none' ? '' : (v ?? '') })
                }
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Seleccionar docente" />
                </SelectTrigger>
                <SelectContent className="z-9999">
                  <SelectItem value="none">Seleccionar docente</SelectItem>
                  {docentes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombres} {d.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">
                Duración (horas)
              </Label>
              <Select
                value={String(formCelda.duracion)}
                onValueChange={(v) =>
                  setFormCelda({ ...formCelda, duracion: parseInt(v ?? '1') })
                }
              >
                <SelectTrigger className="bg-black/40 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Duración" />
                </SelectTrigger>
                <SelectContent className="z-9999">
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? 'hora' : 'horas'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-emerald-400 text-xs uppercase font-bold">Aula</Label>
              <Input
                type="text"
                value={formCelda.aula}
                onChange={(e) => setFormCelda({ ...formCelda, aula: e.target.value })}
                placeholder="Ej: Aula 12, Laboratorio..."
                className="bg-black/40 border-white/10 text-white mt-2"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {bloqueEnEdicion && (
                <Button
                  onClick={handleEliminarBloque}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              )}
              <Button
                onClick={handleGuardarBloque}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                {bloqueEnEdicion ? 'Guardar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorariosPage;