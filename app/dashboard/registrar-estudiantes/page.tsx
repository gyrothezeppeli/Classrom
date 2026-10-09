// app/dashboard/registrar-estudiantes/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  Save,
  X,
  Trash2,
} from "lucide-react";

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  white: '#ffffff',
};

interface FilaEstudiante {
  cedulaIdentidad: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: string;
  seccion: string;
  correoElectronico: string;
  numeroTelefonoCelular: string;
  fechaNacimiento: string;
  password: string;
  valido: boolean;
  error?: string;
}

const NIVELES_VALIDOS = ['inicial', 'primaria', 'media'];

const GRADOS_POR_NIVEL: Record<string, string[]> = {
  inicial: ['Pre-Kinder', 'Kinder', 'Preparatorio'],
  primaria: ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'],
  media: ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'],
};

const SECCIONES_VALIDAS = ['A', 'B', 'C', 'D', 'E'];

export default function RegistrarEstudiantesPage() {
  const router = useRouter();

  const [filas, setFilas] = useState<FilaEstudiante[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const validas = useMemo(() => filas.filter((f) => f.valido), [filas]);
  const invalidas = useMemo(() => filas.filter((f) => !f.valido), [filas]);

  // Normaliza un grado: convierte variantes a la forma estándar
  const normalizarGrado = (grado: string, nivel: string): string => {
    const gradosPosibles = GRADOS_POR_NIVEL[nivel] || [];
    const norm = (s: string) =>
      s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const gradoNorm = norm(grado);

    // Intento directo
    for (const g of gradosPosibles) {
      if (norm(g) === gradoNorm) return g;
    }

    // Intento por coincidencia de número y palabra clave
    const match = gradoNorm.match(/(\d+)/);
    if (match) {
      const num = match[1];
      for (const g of gradosPosibles) {
        if (g.includes(num)) return g;
      }
    }

    return grado; // devolver tal cual si no matchea
  };

  // Normaliza nivel
  const normalizarNivel = (nivel: string): string => {
    const n = nivel.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const nv of NIVELES_VALIDOS) {
      if (n.includes(nv)) return nv;
    }
    return n;
  };

  // Procesar el Excel subido
  const procesarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      sileo.error({ title: 'Formato no válido', description: 'Solo .xlsx o .xls' });
      e.target.value = '';
      return;
    }

    setProcesando(true);
    setNombreArchivo(file.name);

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datos: any[] = XLSX.utils.sheet_to_json(hoja, { defval: '' });

      if (datos.length === 0) {
        sileo.error({ title: 'Archivo vacío' });
        setProcesando(false);
        return;
      }

      // Detectar duplicados dentro del archivo
      const cedulasEnArchivo = new Set<string>();

      const procesadas: FilaEstudiante[] = datos.map((fila) => {
        const cedulaIdentidad = String(
          fila['Cédula'] ?? fila['Cedula'] ?? fila['cedula'] ?? fila['CEDULA'] ?? fila['CI'] ?? ''
        ).trim();

        const nombres = String(
          fila['Nombres'] ?? fila['nombres'] ?? fila['NOMBRES'] ?? fila['Nombre'] ?? ''
        ).trim();

        const apellidos = String(
          fila['Apellidos'] ?? fila['apellidos'] ?? fila['APELLIDOS'] ?? fila['Apellido'] ?? ''
        ).trim();

        const nivelRaw = String(
          fila['Nivel'] ?? fila['nivel'] ?? fila['NIVEL'] ?? ''
        ).trim();

        const gradoRaw = String(
          fila['Grado'] ?? fila['grado'] ?? fila['GRADO'] ?? fila['Año'] ?? fila['Ano'] ?? ''
        ).trim();

        const seccionRaw = String(
          fila['Sección'] ?? fila['Seccion'] ?? fila['seccion'] ?? fila['SECCION'] ?? fila['Sección'] ?? ''
        ).trim();

        const correoElectronico = String(
          fila['Email'] ?? fila['Correo'] ?? fila['correo'] ?? fila['correoElectronico'] ?? fila['CORREO'] ?? ''
        ).trim();

        const numeroTelefonoCelular = String(
          fila['Teléfono'] ?? fila['Telefono'] ?? fila['telefono'] ?? fila['numeroTelefonoCelular'] ?? ''
        ).trim();

        const fechaNacimiento = String(
          fila['Fecha Nacimiento'] ?? fila['fechaNacimiento'] ?? fila['FechaNac'] ?? ''
        ).trim();

        const password = String(fila['Password'] ?? fila['Contraseña'] ?? '').trim();

        // Validaciones
        if (!cedulaIdentidad) {
          return {
            cedulaIdentidad: '',
            nombres,
            apellidos,
            nivel: '',
            grado: '',
            seccion: '',
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Sin cédula',
          };
        }

        if (cedulasEnArchivo.has(cedulaIdentidad)) {
          return {
            cedulaIdentidad,
            nombres,
            apellidos,
            nivel: '',
            grado: '',
            seccion: '',
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Cédula duplicada en archivo',
          };
        }
        cedulasEnArchivo.add(cedulaIdentidad);

        if (!nombres) {
          return {
            cedulaIdentidad,
            nombres,
            apellidos,
            nivel: '',
            grado: '',
            seccion: '',
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Sin nombres',
          };
        }

        if (!apellidos) {
          return {
            cedulaIdentidad,
            nombres,
            apellidos,
            nivel: '',
            grado: '',
            seccion: '',
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Sin apellidos',
          };
        }

        const nivel = normalizarNivel(nivelRaw);
        if (!NIVELES_VALIDOS.includes(nivel)) {
          return {
            cedulaIdentidad,
            nombres,
            apellidos,
            nivel: nivelRaw,
            grado: gradoRaw,
            seccion: seccionRaw,
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Nivel no válido',
          };
        }

        const grado = normalizarGrado(gradoRaw, nivel);
        if (!GRADOS_POR_NIVEL[nivel]?.includes(grado)) {
          return {
            cedulaIdentidad,
            nombres,
            apellidos,
            nivel,
            grado: gradoRaw,
            seccion: seccionRaw,
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Grado no válido para el nivel',
          };
        }

        const seccion = seccionRaw.toUpperCase();
        if (!SECCIONES_VALIDAS.includes(seccion)) {
          return {
            cedulaIdentidad,
            nombres,
            apellidos,
            nivel,
            grado,
            seccion,
            correoElectronico,
            numeroTelefonoCelular,
            fechaNacimiento,
            password,
            valido: false,
            error: 'Sección no válida',
          };
        }

        return {
          cedulaIdentidad,
          nombres,
          apellidos,
          nivel,
          grado,
          seccion,
          correoElectronico,
          numeroTelefonoCelular,
          fechaNacimiento,
          password,
          valido: true,
        };
      });

      setFilas(procesadas);

      const totalValidas = procesadas.filter((p) => p.valido).length;
      const totalInvalidas = procesadas.length - totalValidas;

      if (totalValidas === 0) {
        sileo.warning({
          title: 'Sin filas válidas',
          description: 'Revisa el formato del archivo',
        });
      } else {
        sileo.info({
          title: 'Archivo procesado',
          description: `${totalValidas} válidas, ${totalInvalidas} con error`,
        });
      }
    } catch (err) {
      console.error('Error al procesar:', err);
      sileo.error({ title: 'Error al leer el archivo' });
      setNombreArchivo('');
    } finally {
      setProcesando(false);
      e.target.value = '';
    }
  };

  // Descargar plantilla
  const descargarPlantilla = async () => {
    const XLSX = await import('xlsx');
    const plantilla = [
      {
        'Cédula': '12345678',
        'Nombres': 'Juan',
        'Apellidos': 'Pérez',
        'Nivel': 'media',
        'Grado': '1er Año',
        'Sección': 'A',
        'Email': 'juan.perez@instituto.edu',
        'Teléfono': '0412-1234567',
        'Fecha Nacimiento': '2008-05-15',
        'Password': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(plantilla);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

    worksheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
      { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 15 },
    ];

    XLSX.writeFile(workbook, 'Plantilla_Estudiantes.xlsx');
    sileo.success({ title: 'Plantilla descargada' });
  };

  // Eliminar una fila de la lista
  const eliminarFila = (index: number) => {
    setFilas((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar todos los estudiantes válidos
  const guardarEstudiantes = async () => {
    if (validas.length === 0) {
      return sileo.warning({
        title: 'Sin estudiantes válidos',
        description: 'Corrige los errores del archivo',
      });
    }

    setGuardando(true);
    try {
      const payload = validas.map((f) => ({
        cedulaIdentidad: f.cedulaIdentidad,
        nombres: f.nombres,
        apellidos: f.apellidos,
        nivel: f.nivel,
        grado: f.grado,
        seccion: f.seccion,
        correoElectronico: f.correoElectronico || undefined,
        numeroTelefonoCelular: f.numeroTelefonoCelular || undefined,
        fechaNacimiento: f.fechaNacimiento || undefined,
        password: f.password || undefined,
      }));

      const res = await fetch('/api/estudiantes/masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudiantes: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        sileo.error({
          title: 'Error al registrar',
          description: data.error || 'Error desconocido',
        });
        return;
      }

      sileo.success({
        title: 'Estudiantes registrados',
        description: `${data.creados} estudiante${data.creados === 1 ? '' : 's'} creado${data.creados === 1 ? '' : 's'}`,
      });

      setFilas([]);
      setNombreArchivo('');
    } catch (err) {
      console.error('Error:', err);
      sileo.error({ title: 'Error de conexión' });
    } finally {
      setGuardando(false);
    }
  };

  // Cancelar todo
  const cancelar = () => {
    setFilas([]);
    setNombreArchivo('');
  };

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
            onClick={() => router.push('/dashboard/control_estudios')}
            className="text-white/70 hover:text-white hover:bg-white/5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="hidden sm:block text-emerald-400 font-extrabold tracking-widest text-xs">
            REGISTRO MASIVO
          </div>
        </div>

        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1.5 text-xs font-semibold">
          {filas.length > 0 ? `${filas.length} filas` : 'Sin archivo'}
        </Badge>
      </nav>

      {/* MAIN */}
      <main className="relative z-10 max-w-350 mx-auto px-4 sm:px-[8%] py-6">
        <Card className="bg-white/3 backdrop-blur-xl border-white/5 overflow-hidden rounded-3xl">
          <CardHeader className="px-4 sm:px-10 py-6 sm:py-8 bg-emerald-500/5 border-b border-white/5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-black text-white m-0">
                  Registro Masivo de Estudiantes
                </CardTitle>
                <p className="text-gray-400 text-sm sm:text-base m-0">
                  Sube un archivo Excel con los datos de los estudiantes para registrarlos de una sola vez
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-10 py-6 sm:py-8 space-y-6">
            {/* INSTRUCCIONES Y BOTONES PRINCIPALES */}
            {filas.length === 0 && (
              <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-2xl">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <h3 className="text-emerald-400 font-bold m-0">Formato del archivo</h3>
                      <p className="text-gray-300 text-sm m-0">
                        El archivo Excel debe tener las siguientes columnas:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Cédula
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Nombres
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Apellidos
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Nivel
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Grado
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Sección
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Email
                        </Badge>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 justify-center">
                          Teléfono
                        </Badge>
                      </div>

                      <div className="mt-4 p-3 bg-black/30 rounded-lg text-xs text-gray-400 space-y-1">
                        <p className="m-0">
                          <strong className="text-emerald-400">Nivel:</strong> inicial, primaria, media
                        </p>
                        <p className="m-0">
                          <strong className="text-emerald-400">Grado:</strong> 1er Año, 2do Grado, Pre-Kinder, etc.
                        </p>
                        <p className="m-0">
                          <strong className="text-emerald-400">Sección:</strong> A, B, C, D o E
                        </p>
                        <p className="m-0">
                          <strong className="text-emerald-400">Email:</strong> opcional (si no se pone, se autogenera)
                        </p>
                        <p className="m-0">
                          <strong className="text-emerald-400">Password:</strong> opcional (por defecto la cédula)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <Button
                      variant="outline"
                      onClick={descargarPlantilla}
                      className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar plantilla
                    </Button>

                    <label
                      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 h-9 text-sm font-bold cursor-pointer transition-colors bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-lg shadow-emerald-500/20 ${procesando ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {procesando ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Subir Excel
                        </>
                      )}
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={procesarArchivo}
                        className="hidden"
                        disabled={procesando}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RESUMEN DEL ARCHIVO CARGADO */}
            {filas.length > 0 && (
              <>
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <FileSpreadsheet className="w-3 h-3 mr-1" />
                      {nombreArchivo}
                    </Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <Users className="w-3 h-3 mr-1" />
                      {filas.length} fila{filas.length === 1 ? '' : 's'}
                    </Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {validas.length} válida{validas.length === 1 ? '' : 's'}
                    </Badge>
                    {invalidas.length > 0 && (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {invalidas.length} con error
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={cancelar}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={guardarEstudiantes}
                      disabled={guardando || validas.length === 0}
                      className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold disabled:opacity-40"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {guardando ? 'Registrando...' : `Registrar ${validas.length} estudiante${validas.length === 1 ? '' : 's'}`}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-black/60 backdrop-blur">
                      <TableRow className="bg-black/40 hover:bg-black/40">
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Cédula</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Nombres</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Apellidos</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Nivel</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Grado</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Sección</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase">Email</TableHead>
                        <TableHead className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center">Estado</TableHead>
                        <TableHead className="w-12 text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filas.map((fila, idx) => (
                        <TableRow
                          key={idx}
                          className={`border-white/5 ${fila.valido ? 'hover:bg-white/5' : 'bg-red-500/5'}`}
                        >
                          <TableCell className="font-mono text-white text-sm">{fila.cedulaIdentidad || '-'}</TableCell>
                          <TableCell className="text-white text-sm">{fila.nombres || '-'}</TableCell>
                          <TableCell className="text-white text-sm">{fila.apellidos || '-'}</TableCell>
                          <TableCell className="text-gray-300 text-sm">{fila.nivel || '-'}</TableCell>
                          <TableCell className="text-gray-300 text-sm">{fila.grado || '-'}</TableCell>
                          <TableCell className="text-gray-300 text-sm">{fila.seccion || '-'}</TableCell>
                          <TableCell className="text-gray-400 text-sm">{fila.correoElectronico || '-'}</TableCell>
                          <TableCell className="text-center">
                            {fila.valido ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[0.6rem]">
                                Válida
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[0.6rem]">
                                {fila.error}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => eliminarFila(idx)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {invalidas.length > 0 && (
                  <div className="flex items-start gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="m-0 font-bold">Hay filas con errores</p>
                      <p className="m-0 text-xs mt-1">
                        Solo se registrarán las {validas.length} filas válidas. Corrige los errores en el Excel y vuelve a subirlo, o elimina las filas inválidas de la lista para continuar.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}