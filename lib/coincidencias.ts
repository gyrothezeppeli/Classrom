// lib/coincidencias.ts

export const normalizar = (valor: string): string => {
  if (!valor) return '';
  return valor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, ' ');
};

export const variantesNivel = (nivel: string): string[] => {
  const n = normalizar(nivel);
  const mapa: Record<string, string[]> = {
    inicial: ['inicial', 'preescolar', 'educacion inicial'],
    primaria: ['primaria', 'educacion primaria'],
    media: ['media', 'bachillerato', 'educacion media'],
  };
  return mapa[n] || [n];
};

export const variantesGrado = (grado: string): string[] => {
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

export const coincideNivel = (a: string, b: string) =>
  variantesNivel(a).includes(normalizar(b)) ||
  variantesNivel(b).includes(normalizar(a));

export const coincideGrado = (a: string, b: string) =>
  variantesGrado(a).includes(normalizar(b)) ||
  variantesGrado(b).includes(normalizar(a));

export const coincideSeccion = (a: string, b: string) => {
  const na = normalizar(a);
  const nb = normalizar(b);

  if (
    na === 'unica' || na === 'única' || na === '' ||
    nb === 'unica' || nb === 'única' || nb === ''
  ) {
    return true;
  }

  return na === nb || na === `seccion ${nb}` || `seccion ${na}` === nb;
};