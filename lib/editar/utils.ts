// ✅ Extrae el número de un grado: "4to Año" → "4", "1er Grado" → "1"
export const extraerNumeroGrado = (grado: string): string => {
  if (!grado) return '';
  const match = grado.match(/\d/);
  return match ? match[0] : '';
};

// ✅ Normaliza un grado para comparación tolerante
export const normalizarParaComparar = (grado: string): string => {
  if (!grado) return '';
  return grado
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[°º]/g, '')
    .replace(/\s+/g, ' ');
};

// ✅ Convierte un ID de grado del formulario a valor canónico de BD
export const normalizarGradoParaBD = (gradoId: string, nivel: string): string => {
  if (!gradoId) return '';

  // Mapa completo: ID del formulario → valor canónico
  const mapa: Record<string, Record<string, string>> = {
    inicial: {
      'Pre-Kinder': 'Pre-Kinder',
      'Kinder': 'Kinder',
      'Preparatorio': 'Preparatorio',
    },
    primaria: {
      '1er Grado': '1er Grado',
      '2do Grado': '2do Grado',
      '3er Grado': '3er Grado',
      '4to Grado': '4to Grado',
      '5to Grado': '5to Grado',
      '6to Grado': '6to Grado',
    },
    media: {
      '1er Año': '1er Año',
      '2do Año': '2do Año',
      '3er Año': '3er Año',
      '4to Año': '4to Año',
      '5to Año': '5to Año',
    },
  };

  const nivelNorm = (nivel || '').toLowerCase().trim();

  // Si ya es canónico, devolverlo
  if (mapa[nivelNorm]?.[gradoId]) {
    return mapa[nivelNorm][gradoId];
  }

  // Fallback: extraer número y construir
  const num = extraerNumeroGrado(gradoId);
  if (!num) return gradoId;

  const ordinales: Record<string, string> = {
    '1': '1er', '2': '2do', '3': '3er', '4': '4to', '5': '5to', '6': '6to',
  };
  const ordinal = ordinales[num];
  if (!ordinal) return gradoId;

  if (nivelNorm === 'inicial') {
    const iniciales: Record<string, string> = {
      '1': 'Pre-Kinder', '2': 'Kinder', '3': 'Preparatorio',
    };
    return iniciales[num] || gradoId;
  }

  const sufijo = nivelNorm === 'primaria' ? 'Grado' : 'Año';
  return `${ordinal} ${sufijo}`;
};

export const parsearSecciones = (secciones: string | string[] | null | undefined): string[] => {
  if (!secciones) return [];
  if (Array.isArray(secciones)) return secciones.filter(Boolean);
  return secciones.split(',').map(s => s.trim()).filter(Boolean);
};

export const serializarSecciones = (secciones: string[]): string => {
  return secciones.filter(Boolean).join(',');
};
