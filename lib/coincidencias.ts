// lib/coincidencias.ts

// ============================================
// Utilidades de normalización
// ============================================

const normalizar = (valor: string): string => {
  if (!valor) return '';
  return valor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, ' ');
};

// ============================================
// Nivel
// ============================================

const variantesNivel = (nivel: string): string[] => {
  const n = normalizar(nivel);
  const mapa: Record<string, string[]> = {
    inicial: ['inicial', 'preescolar', 'educacion inicial'],
    primaria: ['primaria', 'educacion primaria'],
    media: ['media', 'bachillerato', 'educacion media'],
  };
  return mapa[n] || [n];
};

export const coincideNivel = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  return (
    variantesNivel(a).includes(normalizar(b)) ||
    variantesNivel(b).includes(normalizar(a))
  );
};

// ============================================
// Grado
// ============================================

const variantesGrado = (grado: string): string[] => {
  const g = normalizar(grado);
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
    prekinder: ['prekinder', 'pre-kinder'],
    kinder: ['kinder'],
    preparatorio: ['preparatorio'],
  };
  return mapa[g] || [g];
};

export const coincideGrado = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  return (
    variantesGrado(a).includes(normalizar(b)) ||
    variantesGrado(b).includes(normalizar(a))
  );
};

// ============================================
// Sección (SOPORTA MÚLTIPLES: "A,B,C" ↔ "A")
// ============================================

/**
 * Convierte una cadena de secciones "A,B,C" en un array normalizado ["a", "b", "c"].
 * También acepta arrays directamente.
 */
const parsearSecciones = (valor: string | string[] | null | undefined): string[] => {
  if (!valor) return [];
  if (Array.isArray(valor)) {
    return valor.map(v => normalizar(v)).filter(Boolean);
  }
  return valor
    .split(',')
    .map(s => normalizar(s))
    .filter(Boolean);
};

export const coincideSeccion = (a: string, b: string): boolean => {
  const na = normalizar(a);
  const nb = normalizar(b);

  // ✅ "Única" o vacío → coincide con todo
  if (
    na === 'unica' || na === 'única' || na === '' ||
    nb === 'unica' || nb === 'única' || nb === ''
  ) {
    return true;
  }

  // ✅ Si "a" es múltiple tipo "A,B,C", verificar si incluye a "b"
  const seccionesA = parsearSecciones(a);
  const seccionesB = parsearSecciones(b);

  // ✅ Si hay intersección entre ambas listas, coincide
  const hayInterseccion = seccionesA.some(sa => seccionesB.includes(sa));
  if (hayInterseccion) return true;

  // ✅ También permitir prefijos "seccion a" ↔ "a"
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