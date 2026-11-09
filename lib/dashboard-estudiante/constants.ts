export const PALETTE = {
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

export const COLOR_MATERIA_ACTIVA = '#00BB7E';
export const COLOR_MATERIA_VACIA = '#6b7280';
export const LIMITE_ENTREGAS = 5;
export const LIMITE_MATERIAS = 8;

export const MATERIAS_BASE = [
  { id: 'mat-001', nombre: 'Lengua Española', profesor: '', horario: '', aula: '', color: '#8b5cf6' },
  { id: 'mat-002', nombre: 'Matemáticas', profesor: '', horario: '', aula: '', color: '#3b82f6' },
  { id: 'mat-003', nombre: 'G.H.C', profesor: '', horario: '', aula: '', color: '#f59e0b' },
  { id: 'mat-005', nombre: 'Biología', profesor: '', horario: '', aula: '', color: '#22c55e' },
  { id: 'mat-006', nombre: 'Química', profesor: '', horario: '', aula: '', color: '#06b6d4' },
  { id: 'mat-007', nombre: 'Física', profesor: '', horario: '', aula: '', color: '#6366f1' },
  { id: 'mat-008', nombre: 'Inglés', profesor: '', horario: '', aula: '', color: '#ec4899' },
  { id: 'mat-011', nombre: 'Educación Física', profesor: '', horario: '', aula: '', color: '#14b8a6' },
  { id: 'mat-012', nombre: 'Arte y Patrimonio', profesor: '', horario: '', aula: '', color: '#f43f5e' },
  { id: 'mat-013', nombre: 'Informática', profesor: '', horario: '', aula: '', color: '#0ea5e9' },
  { id: 'mat-014', nombre: 'FSN', profesor: '', horario: '', aula: '', color: '#f472b6' },
  { id: 'mat-015', nombre: 'Ciencias de la Tierra', profesor: '', horario: '', aula: '', color: '#10b981' },
];

export const EQUIVALENCIAS_MATERIAS: Record<string, string[]> = {
  'lengua espanola': ['castellano', 'lengua', 'espanol'],
  castellano: ['lengua espanola', 'lengua', 'espanol'],
  matematicas: ['matematica'],
  matematica: ['matematicas'],
  'g.h.c': ['ghc', 'g h c', 'geografia', 'historia', 'ciudadania', 'civica', 'geografia historia ciudadania', 'geografia historia civica'],
  ghc: ['g.h.c', 'g h c', 'geografia', 'historia', 'ciudadania', 'civica', 'geografia historia ciudadania', 'geografia historia civica'],
  'g h c': ['g.h.c', 'ghc', 'geografia', 'historia', 'ciudadania', 'civica', 'geografia historia ciudadania', 'geografia historia civica'],
  'educacion fisica': ['ed fisica', 'edfisica'],
  informatica: ['computacion'],
};

export const VARIANTES_GRADO: Record<string, string[]> = {
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
