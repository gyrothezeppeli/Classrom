"use client";

import React, { useState } from 'react';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Bell, Calendar, ChevronDown, ChevronUp, Download, ExternalLink, GraduationCap, IdCard, Mail, Phone, Target, User, X } from 'lucide-react';
import { COLOR_MATERIA_ACTIVA, COLOR_MATERIA_VACIA, PALETTE } from '@/lib/dashboard-estudiante/constants';
import { etiquetaGrado } from '@/lib/dashboard-estudiante/utils';
import type { Estudiante, FilaPlan, MateriaConPlanes, PlanEvaluacion } from '@/lib/dashboard-estudiante/types';

// DatosEstudianteColapsable
// ============================================
export const DatosEstudianteColapsable: React.FC<{
  estudiante: Estudiante;
  isMobile: boolean;
  datosAbiertos: boolean;
  setDatosAbiertos: (v: boolean) => void;
}> = ({ estudiante, isMobile, datosAbiertos, setDatosAbiertos }) => {
  const datos = [
    {
      icon: <Mail className="w-4 h-4" />,
      label: 'Correo',
      value: estudiante.correoElectronico || 'No registrado',
    },
    {
      icon: <IdCard className="w-4 h-4" />,
      label: 'Cédula',
      value: estudiante.cedulaIdentidad || 'No registrada',
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: 'Teléfono',
      value: estudiante.telefono || 'No registrado',
    },
    {
      icon: <GraduationCap className="w-4 h-4" />,
      label: 'Nivel',
      value: estudiante.nivel
        ? estudiante.nivel.charAt(0).toUpperCase() + estudiante.nivel.slice(1)
        : 'No asignado',
    },
  ];

  const etiqueta = etiquetaGrado(estudiante.nivel);

  if (!isMobile) {
    return (
      <div className="grid gap-3 grid-cols-4">
        {datos.map((d) => (
          <DataCard key={d.label} icon={d.icon} label={d.label} value={d.value} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden">
      <button
        type="button"
        onClick={() => setDatosAbiertos(!datosAbiertos)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-semibold text-sm">Mis datos</span>
            <span className="text-white/50 text-[0.7rem]">
              {estudiante.grado || '?'}° {etiqueta} • Sección {estudiante.seccion || ''}
            </span>
          </div>
        </div>
        <div className="text-emerald-400 transition-transform duration-300">
          {datosAbiertos ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: datosAbiertos ? '500px' : '0px',
          opacity: datosAbiertos ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-white/5">
          {datos.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3.5 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                {d.icon}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-emerald-400/80 text-[0.6rem] uppercase tracking-wider font-semibold">
                  {d.label}
                </span>
                <span className="text-white text-sm font-semibold truncate">
                  {d.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// DataCard
// ============================================
export const DataCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 rounded-2xl p-4 backdrop-blur-md transition-all">
    <div className="flex items-center gap-2 text-emerald-400/80 text-[0.65rem] uppercase tracking-wider mb-1.5">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-white text-sm font-semibold truncate">
      {value}
    </div>
  </div>
);

// ============================================
// StatCard
// ============================================
export const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: string }> = ({ icon, label, value, color = PALETTE.accent }) => (
  <div className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 rounded-2xl p-5 text-center backdrop-blur-md transition-all">
    <div className="flex justify-center mb-2" style={{ color }}>
      {icon}
    </div>
    <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
    <div className="text-emerald-400/70 text-xs font-medium uppercase tracking-wide">{label}</div>
  </div>
);

// ============================================
// MateriaGrid
// ============================================
export const MateriaGrid: React.FC<{
  materias: MateriaConPlanes[];
  onSelectMateria: (materia: MateriaConPlanes) => void;
  onSelectPlan: (plan: PlanEvaluacion) => void;
  isMobile: boolean;
}> = ({ materias, onSelectMateria, onSelectPlan, isMobile }) => {
  const getPlanesNuevos = (planes: PlanEvaluacion[]) => {
    return planes.filter((p: PlanEvaluacion) => p.visto === false).length;
  };

  const tieneContenido = (m: MateriaConPlanes) =>
    m.planEvaluacion.length > 0 ||
    m.tareasPendientes.length > 0 ||
    m.avisos.length > 0 ||
    m.materiales.length > 0;

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3 w-full">
        {materias.map((materia, index) => {
          const planesNuevos = getPlanesNuevos(materia.planEvaluacion);
          const tienePlanes = materia.planEvaluacion.length > 0;
          const tieneTareas = materia.tareasPendientes.length > 0;
          const tieneAvisos = materia.avisos.length > 0;
          const tieneMateriales = materia.materiales.length > 0;
          const conContenido = tieneContenido(materia);
          const colorBase = conContenido ? COLOR_MATERIA_ACTIVA : COLOR_MATERIA_VACIA;

          return (
            <div
              key={materia.id}
              onClick={() => onSelectMateria(materia)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                !conContenido ? 'opacity-70 grayscale-[35%]' : ''
              }`}
              style={{
                aspectRatio: '1 / 1.15',
                background: `linear-gradient(160deg, ${colorBase}dd 0%, ${colorBase}88 50%, ${colorBase}44 100%)`,
                animationDelay: `${index * 60}ms`
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
                style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  {planesNuevos > 0 && (
                    <span className="bg-red-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shadow-lg">
                      {planesNuevos} nuevo{planesNuevos > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-white text-base font-bold leading-tight mb-1 drop-shadow-lg">
                    {materia.nombre}
                  </h3>
                  <p className="text-white/70 text-[0.7rem] leading-tight mb-2 line-clamp-2 drop-shadow">
                    {materia.profesor || 'Sin profesor asignado'}
                  </p>

                  <div className="flex gap-1.5 flex-wrap">
                    {tieneTareas && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md">
                        {materia.tareasPendientes.length} tarea{materia.tareasPendientes.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {tieneAvisos && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md">
                        {materia.avisos.length} aviso{materia.avisos.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {tieneMateriales && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md">
                        {materia.materiales.length} mat.
                      </span>
                    )}
                    {tienePlanes && (
                      <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md ${
                        planesNuevos > 0
                          ? 'bg-red-500/80 text-white'
                          : 'bg-white/20 backdrop-blur-sm text-white'
                      }`}>
                        {planesNuevos > 0 ? `${planesNuevos} nuevo${planesNuevos > 1 ? 's' : ''}` : `${materia.planEvaluacion.length} plan${materia.planEvaluacion.length > 1 ? 'es' : ''}`}
                      </span>
                    )}
                    {!conContenido && (
                      <span className="bg-black/40 text-white/80 text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md">
                        Sin novedades
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 w-full">
      {materias.map((materia, index) => {
        const planesNuevos = getPlanesNuevos(materia.planEvaluacion);
        const tienePlanes = materia.planEvaluacion.length > 0;
        const tieneTareas = materia.tareasPendientes.length > 0;
        const tieneAvisos = materia.avisos.length > 0;
        const tieneMateriales = materia.materiales.length > 0;
        const primerPlan = tienePlanes ? materia.planEvaluacion[0] : null;
        const conContenido = tieneContenido(materia);
        const colorBase = conContenido ? COLOR_MATERIA_ACTIVA : COLOR_MATERIA_VACIA;

        return (
          <div
            key={materia.id}
            onClick={() => onSelectMateria(materia)}
            className={`relative border border-white/10 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] ${
              !conContenido ? 'opacity-70 grayscale-[35%]' : ''
            }`}
            style={{
              background: `linear-gradient(160deg, ${colorBase}dd 0%, ${colorBase}88 50%, ${colorBase}44 100%)`,
              borderTopColor: colorBase,
              borderTopWidth: '4px',
              animationDelay: `${index * 60}ms`
            }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 pointer-events-none" />

            <div className="relative z-10 p-5">
              <h3 className="text-white text-lg font-bold mb-1 drop-shadow-lg">{materia.nombre}</h3>
              <p className="text-white/70 text-sm mb-3 drop-shadow">
                {materia.profesor || 'Sin profesor asignado'}
              </p>

              <div className="flex gap-2 flex-wrap mb-3">
                {tieneTareas && (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                    {materia.tareasPendientes.length} {materia.tareasPendientes.length === 1 ? 'tarea' : 'tareas'}
                  </Badge>
                )}
                {tieneAvisos && (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                    {materia.avisos.length} {materia.avisos.length === 1 ? 'aviso' : 'avisos'}
                  </Badge>
                )}
                {tieneMateriales && (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                    {materia.materiales.length} {materia.materiales.length === 1 ? 'material' : 'materiales'}
                  </Badge>
                )}
                {tienePlanes && (
                  <Badge
                    className={
                      planesNuevos > 0
                        ? "bg-red-500/80 backdrop-blur-sm text-white border-red-400/50 hover:bg-red-500/90"
                        : "bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                    }
                  >
                    {planesNuevos > 0 ? `${planesNuevos} nuevos` : `${materia.planEvaluacion.length} planes`}
                  </Badge>
                )}
                {!conContenido && (
                  <Badge className="bg-black/40 backdrop-blur-sm text-white/80 border-white/20">
                    Sin novedades
                  </Badge>
                )}
              </div>

              {tienePlanes && primerPlan && (
                <Button
                  onClick={(e) => { e.stopPropagation(); onSelectPlan(primerPlan); }}
                  className={`w-full font-semibold rounded-xl backdrop-blur-sm ${
                    planesNuevos > 0
                      ? 'bg-red-500/25 text-white hover:bg-red-500/40 border border-red-400/40'
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                  }`}
                  variant="outline"
                >
                  {planesNuevos > 0 ? 'Ver plan nuevo' : 'Ver plan'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// MateriaDetalle (Modal)
// ============================================
export const MateriaDetalle: React.FC<{
  materia: MateriaConPlanes | null;
  onClose: () => void;
  onSelectPlan: (plan: PlanEvaluacion) => void;
}> = ({ materia, onClose, onSelectPlan }) => {
  const [activeTab, setActiveTab] = useState<'tareas' | 'avisos' | 'materiales' | 'evaluacion'>('tareas');

  if (!materia) return null;

  const hasPlanesNuevos = (): boolean => {
    return materia.planEvaluacion.some((p: PlanEvaluacion) => p.visto === false);
  };

  const tieneContenido =
    materia.planEvaluacion.length > 0 ||
    materia.tareasPendientes.length > 0 ||
    materia.avisos.length > 0 ||
    materia.materiales.length > 0;

  const colorMateria = tieneContenido ? COLOR_MATERIA_ACTIVA : COLOR_MATERIA_VACIA;

  const tabs = [
    { key: 'tareas' as const, label: `Tareas${materia.tareasPendientes.length > 0 ? ` (${materia.tareasPendientes.length})` : ''}` },
    { key: 'avisos' as const, label: `Avisos${materia.avisos.length > 0 ? ` (${materia.avisos.length})` : ''}` },
    { key: 'materiales' as const, label: `Materiales${materia.materiales.length > 0 ? ` (${materia.materiales.length})` : ''}` },
    { key: 'evaluacion' as const, label: 'Evaluación' }
  ];

  return (
    <div
      className="liquid-overlay fixed inset-0 z-1000 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="liquid-modal rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        style={{ borderColor: `${colorMateria}66` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content h-full flex flex-col overflow-hidden">
          <div
            className="px-8 py-6 border-b"
            style={{
              background: `linear-gradient(135deg, rgba(16,45,34,0.9), ${colorMateria}44)`,
              borderColor: `${colorMateria}44`
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: colorMateria,
                      boxShadow: `0 0 20px ${colorMateria}66`
                    }}
                  />
                  <h2 className="text-white text-3xl font-bold m-0">{materia.nombre}</h2>
                  {hasPlanesNuevos() && (
                    <Badge className="bg-red-500 text-white border-red-500">
                      Nuevos
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 mt-1 ml-6">
                  {materia.profesor || 'Sin profesor'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-1.5 px-5 py-3.5 bg-black/30 border-b border-white/5 flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.key)}
                className={
                  activeTab === tab.key
                    ? "text-[#081a14] font-bold"
                    : "text-white hover:bg-white/5"
                }
                style={activeTab === tab.key ? { background: colorMateria } : undefined}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* TAREAS */}
            {activeTab === 'tareas' && (
              <div>
                {materia.tareasPendientes.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay tareas asignadas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materia.tareasPendientes.map((tarea) => (
                      <Card
                        key={tarea.id}
                        className={`border ${
                          tarea.visto
                            ? 'bg-white/3 border-white/5'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <CardContent className="p-5">
                          <h4 className="text-white text-base font-semibold mb-2">
                            {tarea.titulo}
                          </h4>
                          {tarea.descripcion && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                              {tarea.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Entrega: <strong className="text-emerald-400">{tarea.fechaEntrega}</strong>
                            </span>
                            {tarea.ponderacion && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5" />
                                Ponderación: {tarea.ponderacion}%
                              </span>
                            )}
                            {tarea.recursos && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                {tarea.recursos}
                              </span>
                            )}
                          </div>
                          {tarea.objetivos && (
                            <div className="mt-2 text-xs text-gray-400">
                              <strong className="text-emerald-400">Objetivos:</strong> {tarea.objetivos}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AVISOS */}
            {activeTab === 'avisos' && (
              <div>
                {materia.avisos.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay avisos disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materia.avisos.map((aviso) => (
                      <Card key={aviso.id} className="bg-emerald-500/5 border-emerald-500/20">
                        <CardContent className="p-5">
                          <h4 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-emerald-400" />
                            {aviso.titulo}
                          </h4>
                          {aviso.descripcion && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                              {aviso.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {aviso.fecha}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {aviso.docente}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MATERIALES */}
            {activeTab === 'materiales' && (
              <div>
                {materia.materiales.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay materiales disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materia.materiales.map((material) => (
                      <Card key={material.id} className="bg-emerald-500/5 border-emerald-500/20">
                        <CardContent className="p-5">
                          <h4 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            {material.titulo}
                          </h4>
                          {material.descripcion && (
                            <p className="text-gray-300 text-sm leading-relaxed mb-3">
                              {material.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400 items-center">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {material.fecha}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {material.docente}
                            </span>
                            {material.enlace && (
                              <a
                                href={material.enlace}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/25 transition text-xs font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Abrir enlace
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EVALUACIÓN */}
            {activeTab === 'evaluacion' && (
              <div>
                {materia.planEvaluacion.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-lg">No hay plan de evaluación disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materia.planEvaluacion.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`flex flex-row items-center justify-between gap-4 ${
                          plan.visto
                            ? 'bg-white/3 border-white/5'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <CardContent className="p-4 flex flex-row items-center justify-between w-full gap-4">
                          <div className="flex-1 min-w-50">
                            <div className="text-white font-semibold mb-1">
                              {plan.areaFormacion}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {plan.docente} • {plan.ano} • Sección {plan.secciones}
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              onClose();
                              setTimeout(() => onSelectPlan(plan), 100);
                            }}
                            className={
                              plan.visto
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/40'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950'
                            }
                            variant={plan.visto ? 'outline' : 'default'}
                            size="sm"
                          >
                            {plan.visto ? 'Ver plan' : 'Ver nuevo'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PlanEvaluacionDetalle (Modal)
// ============================================
export const PlanEvaluacionDetalle: React.FC<{
  plan: PlanEvaluacion;
  onClose: () => void;
  estudiante: Estudiante | null;
}> = ({ plan, onClose, estudiante }) => {
  const [exportando, setExportando] = useState(false);

  const filas: FilaPlan[] = Array.isArray(plan?.filas) ? plan.filas : [];

  const exportarAPDF = async () => {
    try {
      setExportando(true);

      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(0, 187, 126);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN DE EVALUACIÓN', pageWidth / 2, 12, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('U.E Ciudad Cuatricentenaria', pageWidth / 2, 19, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);

      let yPos = 35;
      doc.setFont('helvetica', 'bold');
      doc.text('Área:', 14, yPos);
      doc.text('Docente:', 80, yPos);
      doc.text('Año:', 160, yPos);
      doc.text('Sección:', 220, yPos);

      doc.setFont('helvetica', 'normal');
      doc.text(plan.areaFormacion || 'N/A', 30, yPos);
      doc.text(plan.docente || 'N/A', 100, yPos);
      doc.text(plan.ano || 'N/A', 175, yPos);
      doc.text(plan.secciones || 'N/A', 240, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Estudiante:', 14, yPos);
      doc.text('Cédula:', 100, yPos);
      doc.text('Grado:', 180, yPos);

      doc.setFont('helvetica', 'normal');
      doc.text(estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'N/A', 40, yPos);
      doc.text(estudiante?.cedulaIdentidad || 'N/A', 120, yPos);
      doc.text(estudiante?.grado || 'N/A', 195, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), 30, yPos);

      const tableData = filas.map((fila, index) => [
        (index + 1).toString(),
        fila.fecha || '-',
        fila.referenteTeorico || '-',
        fila.estrategiaEvaluacion || '-',
        fila.tecnicaEvaluacion || '-',
        fila.instrumentoEvaluacion || '-',
        fila.ptos || '-',
        fila.porcentaje || '-',
        fila.criteriosEvaluacion || '-'
      ]);

      const tableConfig = {
        startY: yPos + 5,
        head: [['#', 'FECHA', 'REFERENTE', 'ESTRATEGIA', 'TÉCNICA', 'INSTRUMENTO', 'PTOS', '%', 'CRITERIOS']],
        body: tableData.length > 0 ? tableData : [['-', '-', '-', 'Sin filas registradas', '-', '-', '-', '-', '-']],
        theme: 'grid' as const,
        styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] as [number, number, number] },
        headStyles: { fillColor: [0, 187, 126] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
        alternateRowStyles: { fillColor: [240, 250, 245] as [number, number, number] },
        margin: { top: 10, right: 10, bottom: 15, left: 10 }
      };

      autoTable(doc, tableConfig);

      const finalY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 50;
      const totalPuntos = filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de filas: ${filas.length}`, 14, finalY + 8);
      doc.text(`Puntos totales: ${totalPuntos}`, 80, finalY + 8);

      const nombreArchivo = `Plan_Evaluacion_${(plan.areaFormacion || 'plan').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(nombreArchivo);

      sileo.success({
        title: 'PDF exportado',
        description: nombreArchivo,
      });

    } catch (error) {
      console.error('Error al exportar PDF:', error);

      sileo.error({
        title: 'Error al exportar el PDF',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div
      className="liquid-overlay fixed inset-0 z-2000 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="liquid-modal rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        style={{ borderColor: 'rgba(16, 185, 129, 0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-content h-full flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-emerald-500/30 shrink-0"
               style={{ background: 'linear-gradient(135deg, rgba(16,45,34,0.9), rgba(16,185,129,0.2))' }}>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-emerald-400 text-2xl font-bold m-0">
                  Plan de Evaluación - {plan.areaFormacion}
                </h2>
                <p className="text-gray-400 mt-1">
                  {plan.docente} • {plan.ano} • Sección(es): {plan.secciones}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={exportarAPDF}
                  disabled={exportando}
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportando ? 'Exportando...' : 'Exportar PDF'}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="mr-2 h-4 w-4" /> Cerrar
                </Button>
              </div>
            </div>
            {plan.visto && (
              <Badge className="mt-3 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                Visto el {plan.fechaVisto ? new Date(plan.fechaVisto).toLocaleDateString('es-ES') : 'recientemente'}
              </Badge>
            )}
          </div>

          <div className="overflow-auto p-6 flex-1">
            {filas.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-xl text-white m-0">Este plan no tiene filas registradas</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-500/15 hover:bg-emerald-500/15">
                        {['#', 'FECHA', 'REFERENTE', 'ESTRATEGIA', 'TÉCNICA', 'INSTRUMENTO', 'PTOS', '%', 'CRITERIOS'].map((header) => (
                          <TableHead
                            key={header}
                            className="text-emerald-400 font-bold text-[0.7rem] uppercase text-center"
                          >
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filas.map((fila, index) => (
                        <TableRow
                          key={fila.id}
                          className={index % 2 === 0 ? 'bg-white/2' : ''}
                        >
                          <TableCell className="text-center text-emerald-400 font-bold">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-center text-white">{fila.fecha || '-'}</TableCell>
                          <TableCell className="text-white">{fila.referenteTeorico || '-'}</TableCell>
                          <TableCell className="text-white">{fila.estrategiaEvaluacion || '-'}</TableCell>
                          <TableCell className="text-white">{fila.tecnicaEvaluacion || '-'}</TableCell>
                          <TableCell className="text-white">{fila.instrumentoEvaluacion || '-'}</TableCell>
                          <TableCell className="text-center text-emerald-400 font-bold">
                            {fila.ptos || '-'}
                          </TableCell>
                          <TableCell className="text-center text-emerald-400 font-bold">
                            {fila.porcentaje || '-'}
                          </TableCell>
                          <TableCell className="text-white">{fila.criteriosEvaluacion || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-5 px-5 py-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex justify-between items-center flex-wrap gap-3">
                  <div className="text-white text-sm">
                    <strong>Total de filas:</strong> {filas.length}
                  </div>
                  <div className="text-emerald-400 text-sm font-bold">
                    <strong>Puntos totales:</strong> {filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
