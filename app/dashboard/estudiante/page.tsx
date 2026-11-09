"use client";

import React from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BotonNotificaciones } from '@/components/BotonNotificaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, Bell, BookOpen, Calendar, ChevronDown, ChevronUp, Clock, FileDown, FileText, Filter, LogOut, Search, X } from 'lucide-react';
import { COLOR_MATERIA_ACTIVA, LIMITE_ENTREGAS, LIMITE_MATERIAS, PALETTE } from '@/lib/dashboard-estudiante/constants';
import { etiquetaGrado } from '@/lib/dashboard-estudiante/utils';
import { useEstudianteDashboard } from '@/components/dashboard-estudiante/useEstudianteDashboard';
import { DatosEstudianteColapsable, MateriaDetalle, MateriaGrid, PlanEvaluacionDetalle, StatCard } from '@/components/dashboard-estudiante/DashboardComponents';

export default function EstudianteDashboard() {
  const {
    router,
    status,
    loading,
    error,
    estudiante,
    selectedMateria,
    setSelectedMateria,
    selectedPlan,
    setSelectedPlan,
    confirmacion,
    setConfirmacion,
    busqueda,
    filtroActivo,
    actualizarBusqueda,
    actualizarFiltroActivo,
    datosAbiertos,
    setDatosAbiertos,
    mostrarTodasEntregas,
    setMostrarTodasEntregas,
    mostrarTodasMaterias,
    setMostrarTodasMaterias,
    isMobile,
    handleLogout,
    descargarHorarioPDF,
    planesNoVistos,
    materiasConPlanes,
    totalTareas,
    totalAvisos,
    totalMateriales,
    materiasFiltradas,
    proximasEntregas,
  } = useEstudianteDashboard();
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#1a2e26] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p>Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  if (error || !estudiante) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-5 relative">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
        />
        <div className="absolute inset-0 bg-[#0a1410]/40 z-0" />

        <div className="liquid-login-card rounded-[40px] p-8 max-w-md w-full relative z-10">
          <div className="liquid-login-content text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">No se encontró tu perfil</h2>
            <p className="text-gray-400 leading-relaxed">
              {error || 'No se encontraron datos del estudiante'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Volver al Inicio
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    const nombreInicial = estudiante.nombres && estudiante.nombres.length > 0 ? estudiante.nombres[0] : '?';
    const apellidoInicial = estudiante.apellidos && estudiante.apellidos.length > 0 ? estudiante.apellidos[0] : '';
    return `${nombreInicial}${apellidoInicial}`;
  };

  const nombreCompleto = `${estudiante.nombres || ''} ${estudiante.apellidos || ''}`.trim() || 'Estudiante';

  const etiqueta = etiquetaGrado(estudiante.nivel);

  return (
    <div
      className="min-h-screen relative text-white overflow-x-hidden"
      style={{ fontFamily: "'Montserrat', sans-serif", background: PALETTE.deepBg }}
    >
      <div
        className="fixed inset-0 bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
      />
      <div className="fixed inset-0 bg-[#0a1410]/45 z-0 pointer-events-none" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-[8%] py-3 bg-[#1a2e26]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-500 to-emerald-400 flex items-center justify-center text-[#081a14] font-bold text-sm shadow-[0_0_20px_rgba(0,187,126,0.35)]">
            {getInitials()}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm">{nombreCompleto}</span>
            <span className="text-gray-400 text-[0.7rem]">
              {estudiante.grado || '?'}° {etiqueta} • Sección {estudiante.seccion || ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {planesNoVistos > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500/15 rounded-full border border-red-500/30 animate-pulse">
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-bold text-xs">
                {planesNoVistos} {planesNoVistos === 1 ? 'nuevo' : 'nuevos'}
              </span>
            </div>
          )}

          <BotonNotificaciones />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Salir</span>
          </Button>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="relative z-10 px-4 sm:px-[8%] py-6">
        <div className="liquid-login-card rounded-[35px] p-6 sm:p-8">
          <div className="liquid-login-content space-y-6">

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white m-0 tracking-tight">
                Hola, {estudiante.nombres}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Bienvenido de nuevo a tu panel
              </p>
            </div>

            <DatosEstudianteColapsable
              estudiante={estudiante}
              isMobile={isMobile}
              datosAbiertos={datosAbiertos}
              setDatosAbiertos={setDatosAbiertos}
            />

            {/* STATS */}
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
              <StatCard icon={<BookOpen className="w-5 h-5" />} label="Materias" value={materiasConPlanes} color={COLOR_MATERIA_ACTIVA} />
              <StatCard icon={<FileText className="w-5 h-5" />} label="Tareas" value={totalTareas} color={COLOR_MATERIA_ACTIVA} />
              <StatCard icon={<Bell className="w-5 h-5" />} label="Avisos" value={totalAvisos} color={COLOR_MATERIA_ACTIVA} />
              <StatCard icon={<BookOpen className="w-5 h-5" />} label="Materiales" value={totalMateriales} color={COLOR_MATERIA_ACTIVA} />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={descargarHorarioPDF}
                className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Descargar mi horario en PDF
              </Button>
            </div>

            {/* PRÓXIMAS ENTREGAS */}
            {proximasEntregas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold m-0">Próximas Entregas</h2>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    {proximasEntregas.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {(mostrarTodasEntregas
                    ? proximasEntregas
                    : proximasEntregas.slice(0, LIMITE_ENTREGAS)
                  ).map((tarea) => (
                    <div
                      key={tarea.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md hover:bg-white/10 transition-all"
                      style={{ borderLeftColor: tarea.colorMateria, borderLeftWidth: '4px' }}
                    >
                      <div className="text-[0.7rem] font-bold uppercase tracking-wider mb-2" style={{ color: tarea.colorMateria }}>
                        {tarea.nombreMateria}
                      </div>
                      <div className="text-white text-sm font-semibold mb-2 line-clamp-2">
                        {tarea.titulo}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <Calendar className="w-3 h-3" />
                        {tarea.fechaEntrega}
                      </div>
                    </div>
                  ))}
                </div>

                {proximasEntregas.length > LIMITE_ENTREGAS && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() => setMostrarTodasEntregas(v => !v)}
                      variant="outline"
                      size="sm"
                      className="border-white/15 text-gray-300 hover:bg-white/10 hover:border-emerald-500/40 rounded-xl backdrop-blur-md"
                    >
                      {mostrarTodasEntregas ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1.5" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1.5" />
                          Ver más ({proximasEntregas.length - LIMITE_ENTREGAS} restantes)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* MATERIAS */}
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold m-0">Mis Materias</h2>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    {materiasFiltradas.length}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <Input
                    type="text"
                    placeholder="Buscar materias o profesores..."
                    value={busqueda}
                    onChange={(e) => actualizarBusqueda(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pl-11 h-11 rounded-2xl backdrop-blur-md focus:border-emerald-500/60"
                  />
                  {busqueda && (
                    <button
                      onClick={() => actualizarBusqueda('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'todas' as const, label: 'Todas' },
                    { id: 'novedades' as const, label: 'Con novedades' },
                    { id: 'tareas' as const, label: 'Con tareas' },
                    { id: 'planes_nuevos' as const, label: 'Planes nuevos' },
                  ].map((filtro) => (
                    <Button
                      key={filtro.id}
                      onClick={() => actualizarFiltroActivo(filtro.id)}
                      variant={filtroActivo === filtro.id ? 'default' : 'outline'}
                      size="sm"
                      className={
                        filtroActivo === filtro.id
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold rounded-xl'
                          : 'border-white/15 text-gray-300 hover:bg-white/10 hover:border-emerald-500/40 rounded-xl backdrop-blur-md'
                      }
                    >
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      {filtro.label}
                    </Button>
                  ))}
                </div>
              </div>

              {materiasFiltradas.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
                  <Search className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg m-0">
                    No se encontraron materias con esos criterios
                  </p>
                </div>
              ) : (
                <>
                  <MateriaGrid
                    materias={
                      mostrarTodasMaterias
                        ? materiasFiltradas
                        : materiasFiltradas.slice(0, LIMITE_MATERIAS)
                    }
                    onSelectMateria={setSelectedMateria}
                    onSelectPlan={setSelectedPlan}
                    isMobile={isMobile}
                  />

                  {materiasFiltradas.length > LIMITE_MATERIAS && (
                    <div className="flex justify-center mt-5">
                      <Button
                        onClick={() => setMostrarTodasMaterias(v => !v)}
                        variant="outline"
                        size="sm"
                        className="border-white/15 text-gray-300 hover:bg-white/10 hover:border-emerald-500/40 rounded-xl backdrop-blur-md"
                      >
                        {mostrarTodasMaterias ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1.5" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1.5" />
                            Ver más ({materiasFiltradas.length - LIMITE_MATERIAS} restantes)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-center text-white/30 text-xs pt-6 border-t border-white/5">
              U.E Ciudad Cuatricentenaria 2026 • Portal Estudiantil
            </p>

          </div>
        </div>
      </main>

      {/* MODAL MATERIA */}
      {selectedMateria && (
        <MateriaDetalle
          materia={selectedMateria}
          onClose={() => setSelectedMateria(null)}
          onSelectPlan={setSelectedPlan}
        />
      )}

      {/* MODAL PLAN */}
      {selectedPlan && (
        <PlanEvaluacionDetalle
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          estudiante={estudiante}
        />
      )}

      {/* Modal de confirmación */}
      {confirmacion?.abierto && (
        <ConfirmDialog
          abierto={confirmacion.abierto}
          titulo={confirmacion.titulo}
          descripcion={confirmacion.descripcion}
          onConfirm={confirmacion.onConfirm}
          onCancel={() => setConfirmacion(null)}
        />
      )}
    </div>
  );
};
