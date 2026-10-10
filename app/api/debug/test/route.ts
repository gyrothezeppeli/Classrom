// app/api/debug/test/route.ts
import { NextResponse } from 'next/server';
import { coincideNivel, coincideGrado, coincideSeccion } from '@/lib/coincidencias';

export async function GET() {
  return NextResponse.json({
    // Test de sección - LO CRÍTICO
    'A,C,B vs C': coincideSeccion('A,C,B', 'C'),
    'A,C,B vs B': coincideSeccion('A,C,B', 'B'),
    'A,C,B vs A': coincideSeccion('A,C,B', 'A'),
    'A,C,B vs D': coincideSeccion('A,C,B', 'D'),
    'B,A vs C': coincideSeccion('B,A', 'C'),
    'B,A vs B': coincideSeccion('B,A', 'B'),
    
    // Test de nivel
    'media vs media': coincideNivel('media', 'media'),
    
    // Test de grado
    '1ro vs 1ro': coincideGrado('1ro', '1ro'),
    '1ro vs 1er Año': coincideGrado('1ro', '1er Año'),
  });
}