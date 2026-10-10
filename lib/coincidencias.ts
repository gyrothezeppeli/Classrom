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
// Grado - VERSIÓN ROBUSTA
// ============================================

const variantesGrado = (grado: string): string[] => {
  const g = normalizar(grado);
  if (!g) return [];

  // Extraer el número principal
  const match = g.match(/\d+/);
  const num = match ? match[0] : null;

  // Detectar el tipo
  const esAno = g.includes('ano') || g.includes('año');
  const esGrado = g.includes('grado');
  const esNivel = g.includes('nivel');

  const variantes = new Set<string>();
  variantes.add(g); // incluir el original normalizado

  if (num) {
    variantes.add(num); // solo el número

    // Ordinales para cada número
    const ordinales: Record<string, string[]> = {
      '1': ['1ro', '1er', '1ra', 'primero', 'primer'],
      '2': ['2do', '2da', 'segundo'],
      '3': ['3ro', '3ra', 'tercero'],
      '4': ['4to', '4ta', 'cuarto'],
      '5': ['5to', '5ta', 'quinto'],
      '6': ['6to', '6ta', 'sexto'],
    };

    const ords = ordinales[num] || [];
    ords.forEach((o) => variantes.add(o));

    // Con tipo
    if (esAno) {
      ords.forEach((o) => variantes.add(`${o} ano`));
      variantes.add(`${num} ano`);
      variantes.add(`${num} anos`);
    }
    if (esGrado) {
      ords.forEach((o) => variantes.add(`${o} grado`));
      variantes.add(`${num} grado`);
    }
    if (esNivel) {
      ords.forEach((o) => variantes.add(`${o} nivel`));
      variantes.add(`${num} nivel`);
    }
  }

  return Array.from(variantes);
};

export const coincideGrado = (a: string, b: string): boolean => {
  if (!a || !b) return false;

  const va = variantesGrado(a);
  const vb = variantesGrado(b);

  // Intersección
  return va.some((x) => vb.includes(x));
};

// ============================================
// Sección (soporta múltiples: "A,B,C" ↔ "A")
// ============================================

const parsearSecciones = (valor: string | string[] | null | undefined): string[] => {
  if (!valor) return [];
  if (Array.isArray(valor)) {
    return valor.map((v) => normalizar(v)).filter(Boolean);
  }
  return valor
    .split(',')
    .map((s) => normalizar(s))
    .filter(Boolean);
};

export const coincideSeccion = (a: string, b: string): boolean => {
  const na = normalizar(a);
  const nb = normalizar(b);

  // "Única" o vacío → coincide con todo
  if (
    na === 'unica' || na === 'única' || na === '' ||
    nb === 'unica' || nb === 'única' || nb === ''
  ) {
    return true;
  }

  const seccionesA = parsearSecciones(a);
  const seccionesB = parsearSecciones(b);

  // Intersección
  const hayInterseccion = seccionesA.some((sa) => seccionesB.includes(sa));
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