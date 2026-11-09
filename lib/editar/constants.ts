import { Bell, BookOpen, CalendarCheck, ClipboardList, FileText, GraduationCap, Users } from 'lucide-react';

export const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  danger: '#ef4444'
};

export const TIPOS_CONTENIDO = [
  { id: 'tarea', nombre: 'Tarea', icon: BookOpen },
  { id: 'aviso', nombre: 'Aviso', icon: Bell },
  { id: 'material', nombre: 'Material', icon: FileText },
  { id: 'plan_evaluacion', nombre: 'Plan de Evaluación', icon: ClipboardList },
  { id: 'lista_estudiantes', nombre: 'Lista de Estudiantes', icon: Users },
  { id: 'asistencia', nombre: 'Lista de Asistencia', icon: CalendarCheck },
  { id: 'notas', nombre: 'Notas', icon: GraduationCap },
];

export const MATERIAS_POR_NIVEL = {
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
    'G.H.C',
    'Biología',
    'Química',
    'Física',
    'Inglés',
    'FSN',
    'Ciencias de la Tierra',
    'Educación Física',
    'Arte y Patrimonio',
    'Informática'
  ]
};

export const SECCIONES_DISPONIBLES = ['A', 'B', 'C', 'D', 'E'];
