import { EQUIVALENCIAS_MATERIAS, VARIANTES_GRADO } from './constants';

export async function fetchDashboardList<T>(url: string, label: string): Promise<T[] | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error al cargar ${label}: HTTP ${response.status}`);
      return null;
    }
    return await response.json() as T[];
  } catch (error) {
    console.error(`Error al cargar ${label}:`, error);
    return null;
  }
}

export const normalizarTexto = (valor: string): string => {
  if (!valor) return '';
  return valor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, ' ');
};

export const variantesNivel = (nivel: string): string[] => {
  const n = normalizarTexto(nivel);
  const mapa: Record<string, string[]> = {
    inicial: ['inicial', 'preescolar', 'educacion inicial'],
    primaria: ['primaria', 'educacion primaria'],
    media: ['media', 'bachillerato', 'educacion media'],
  };
  return mapa[n] || [n];
};

export const variantesGrado = (grado: string): string[] => {
  const g = normalizarTexto(grado);
  return VARIANTES_GRADO[g] || [g];
};

export const coincideNivel = (a: string, b: string) =>
  variantesNivel(a).includes(normalizarTexto(b)) ||
  variantesNivel(b).includes(normalizarTexto(a));

export const coincideGrado = (a: string, b: string) =>
  variantesGrado(a).includes(normalizarTexto(b)) ||
  variantesGrado(b).includes(normalizarTexto(a));

// ✅ CORREGIDO: soporta secciones múltiples tipo "A,C,B" ↔ "A"
export const coincideSeccion = (a: string, b: string) => {
  const na = normalizarTexto(a);
  const nb = normalizarTexto(b);

  if (
    na === 'unica' || na === 'única' || na === '' ||
    nb === 'unica' || nb === 'única' || nb === ''
  ) {
    return true;
  }

  // Parsear secciones por coma
  const seccionesA = na.split(',').map(s => s.trim()).filter(Boolean);
  const seccionesB = nb.split(',').map(s => s.trim()).filter(Boolean);

  // Intersección
  const hayInterseccion = seccionesA.some(sa => seccionesB.includes(sa));
  if (hayInterseccion) return true;

  // Prefijos "seccion a" ↔ "a"
  for (const sa of seccionesA) {
    for (const sb of seccionesB) {
      if (
        sa === sb ||
        sa === `seccion ${sb}` ||
        `seccion ${sa}` === sb
      ) {
        return true;
      }
    }
  }

  return false;
};

// ✅ NUEVO: comparación flexible de materia
export const coincideMateria = (materiaPlan: string, materiaBase: string): boolean => {
  const mp = normalizarTexto(materiaPlan || '');
  const mb = normalizarTexto(materiaBase || '');

  if (!mp || !mb) return false;

  // Igualdad exacta normalizada
  if (mp === mb) return true;

  // Inclusión parcial
  if (mp.includes(mb) || mb.includes(mp)) return true;

  // Equivalencias comunes


  const variantes = EQUIVALENCIAS_MATERIAS[mp] || [];
  if (variantes.includes(mb)) return true;

  const variantesBase = EQUIVALENCIAS_MATERIAS[mb] || [];
  if (variantesBase.includes(mp)) return true;

  return false;
};

export const esNivelMedia = (nivel: string): boolean => {
  const n = normalizarTexto(nivel);
  return ['media', 'bachillerato', 'educacion media'].includes(n);
};

export const etiquetaGrado = (nivel: string): string => {
  return esNivelMedia(nivel) ? 'Año' : 'Grado';
};

// ============================================
// Límites para "Ver más / Ver menos"
// ============================================
