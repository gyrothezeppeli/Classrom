"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  white: '#ffffff',
  darkText: '#1a2e26'
};

interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  fechaNacimiento: string;
  nivel: string;
  grado: string;
  seccion: string;
  numeroTelefonoCelular: string;
  correoElectronico: string;
  userId?: string;
}

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  email: string;
  telefono: string;
  fechaContratacion: string;
  activo: boolean;
  userId?: string;
}

interface Salon {
  id: string;
  nombre: string;
  nivel: string;
  grado: string;
  seccion: string;
  docenteIds: string[];
  estudianteIds: string[];
  anioAcademico: string;
}

type TabType = 'estudiantes' | 'docentes' | 'salones' | 'actualizar';

const GestionInstitutoPage: React.FC = () => {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState<TabType>('estudiantes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [salonSeleccionado, setSalonSeleccionado] = useState<Salon | null>(null);
  const [mostrarDetalleSalon, setMostrarDetalleSalon] = useState(false);
  const [mostrarModalSalon, setMostrarModalSalon] = useState(false);
  const [modalSalonModo, setModalSalonModo] = useState<'crear' | 'editar'>('crear');
  const [salonEditando, setSalonEditando] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resEstudiantes = await fetch('/api/estudiantes');
      if (resEstudiantes.ok) {
        const data = await resEstudiantes.json();
        setEstudiantes(data);
      }

      const resDocentes = await fetch('/api/docentes');
      if (resDocentes.ok) {
        const data = await resDocentes.json();
        setDocentes(data);
      }

      const resSalones = await fetch('/api/salones');
      if (resSalones.ok) {
        const data = await resSalones.json();
        setSalones(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const niveles = [
    { id: 'inicial', nombre: 'Educacion Inicial' },
    { id: 'primaria', nombre: 'Educacion Primaria' },
    { id: 'media', nombre: 'Educacion Media' }
  ];

  const gradosPorNivel = {
    inicial: [
      { id: 'Pre-Kinder', nombre: 'Pre-Kinder' },
      { id: 'Kinder', nombre: 'Kinder' },
      { id: 'Preparatorio', nombre: 'Preparatorio' }
    ],
    primaria: [
      { id: '1er Grado', nombre: '1er Grado' },
      { id: '2do Grado', nombre: '2do Grado' },
      { id: '3er Grado', nombre: '3er Grado' },
      { id: '4to Grado', nombre: '4to Grado' },
      { id: '5to Grado', nombre: '5to Grado' },
      { id: '6to Grado', nombre: '6to Grado' }
    ],
    media: [
      { id: '1er Año', nombre: '1er Año' },
      { id: '2do Año', nombre: '2do Año' },
      { id: '3er Año', nombre: '3er Año' },
      { id: '4to Año', nombre: '4to Año' },
      { id: '5to Año', nombre: '5to Año' }
    ]
  };

  const secciones = ['A', 'B', 'C', 'D', 'E'];

  const estudiantesFiltrados = useMemo(() => {
    let filtered = estudiantes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.nombres.toLowerCase().includes(term) ||
        e.apellidos.toLowerCase().includes(term) ||
        e.cedulaIdentidad.toLowerCase().includes(term) ||
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term)
      );
    }
    if (filtroNivel) filtered = filtered.filter(e => e.nivel === filtroNivel);
    if (filtroGrado) filtered = filtered.filter(e => e.grado === filtroGrado);
    if (filtroSeccion) filtered = filtered.filter(e => e.seccion === filtroSeccion);
    return filtered;
  }, [estudiantes, searchTerm, filtroNivel, filtroGrado, filtroSeccion]);

  const docentesFiltrados = useMemo(() => {
    let filtered = docentes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(d =>
        d.nombres.toLowerCase().includes(term) ||
        d.apellidos.toLowerCase().includes(term) ||
        d.cedulaIdentidad.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        `${d.nombres} ${d.apellidos}`.toLowerCase().includes(term)
      );
    }
    if (filtroNivel) filtered = filtered.filter(d => d.nivel === filtroNivel);
    if (filtroSeccion) filtered = filtered.filter(d => d.seccion === filtroSeccion);
    return filtered;
  }, [docentes, searchTerm, filtroNivel, filtroSeccion]);

  const salonesFiltrados = useMemo(() => {
    let filtered = salones;
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.nombre.toLowerCase().includes(term) ||
        s.nivel.toLowerCase().includes(term) ||
        s.grado.toLowerCase().includes(term) ||
        s.seccion.toLowerCase().includes(term)
      );
    }
    if (filtroNivel) filtered = filtered.filter(s => s.nivel === filtroNivel);
    if (filtroGrado) filtered = filtered.filter(s => s.grado === filtroGrado);
    if (filtroSeccion) filtered = filtered.filter(s => s.seccion === filtroSeccion);
    return filtered;
  }, [salones, searchTerm, filtroNivel, filtroGrado, filtroSeccion]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroNivel('');
    setFiltroGrado('');
    setFiltroSeccion('');
  };

  const tieneFiltrosActivos = searchTerm || filtroNivel || filtroGrado || filtroSeccion;

  const obtenerEstudiantesSalon = (estudianteIds: string[]) => {
    return estudiantes.filter(e => estudianteIds.includes(e.id));
  };

  const handleVerSalon = (salon: Salon) => {
    setSalonSeleccionado(salon);
    setMostrarDetalleSalon(true);
  };

  const handleEditarEstudianteIndividual = async (estudiante: Estudiante) => {
    try {
      const response = await fetch(`/api/estudiantes/${estudiante.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estudiante)
      });
      if (response.ok) {
        setEstudiantes(estudiantes.map(e => e.id === estudiante.id ? estudiante : e));
        alert('Estudiante actualizado correctamente');
      }
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
    }
  };

  const handleEdicionMasiva = async (estudianteIds: string[], nuevoNivel: string, nuevoGrado: string, nuevaSeccion: string) => {
    const estudiantesActualizados = estudiantes.map(e => {
      if (estudianteIds.includes(e.id)) {
        return { ...e, nivel: nuevoNivel || e.nivel, grado: nuevoGrado || e.grado, seccion: nuevaSeccion || e.seccion };
      }
      return e;
    });

    try {
      const response = await fetch('/api/estudiantes/masivo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudiantes: estudiantesActualizados.filter(e => estudianteIds.includes(e.id)) })
      });
      if (response.ok) {
        setEstudiantes(estudiantesActualizados);
        alert(`${estudianteIds.length} estudiantes actualizados correctamente`);
      }
    } catch (error) {
      console.error('Error en edicion masiva:', error);
    }
  };

  const handleCrearSalon = () => {
    setSalonEditando(null);
    setModalSalonModo('crear');
    setMostrarModalSalon(true);
  };

  const handleEditarSalon = (salon: Salon) => {
    setSalonEditando(salon);
    setModalSalonModo('editar');
    setMostrarModalSalon(true);
  };

  const handleGuardarSalon = async (salonData: Omit<Salon, 'id'>) => {
    try {
      if (modalSalonModo === 'crear') {
        const response = await fetch('/api/salones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salonData)
        });
        if (response.ok) {
          const nuevoSalon = await response.json();
          setSalones([...salones, nuevoSalon]);
          alert('Salon creado correctamente');
        }
      } else if (modalSalonModo === 'editar' && salonEditando) {
        const response = await fetch(`/api/salones/${salonEditando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...salonData, id: salonEditando.id })
        });
        if (response.ok) {
          setSalones(salones.map(s => s.id === salonEditando.id ? { ...salonData, id: s.id } : s));
          alert('Salon actualizado correctamente');
        }
      }
      setMostrarModalSalon(false);
      setSalonEditando(null);
    } catch (error) {
      console.error('Error al guardar salon:', error);
    }
  };

  const handleEliminarSalon = async (salonId: string) => {
    if (confirm('¿Esta seguro de eliminar este salon?')) {
      try {
        const response = await fetch(`/api/salones/${salonId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setSalones(salones.filter(s => s.id !== salonId));
          alert('Salon eliminado correctamente');
        }
      } catch (error) {
        console.error('Error al eliminar salon:', error);
      }
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={overlayStyle} />
        <div style={loadingContainerStyle}>
          <div style={loadingSpinnerStyle}></div>
          <p style={loadingTextStyle}>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={overlayStyle} />

      <nav style={navStyle}>
        <button onClick={() => router.push('/')} style={backButtonStyle}>Volver al Inicio</button>
        <div style={navTitleStyle}>GESTION INSTITUTO</div>
        <div style={navBadgeStyle}>
          {tabActiva === 'estudiantes' && `${estudiantes.length} estudiantes`}
          {tabActiva === 'docentes' && `${docentes.length} docentes`}
          {tabActiva === 'salones' && `${salones.length} salones`}
          {tabActiva === 'actualizar' && 'Actualizar Datos'}
        </div>
      </nav>

      <main style={mainStyle}>
        <div style={cardStyle}>
          <div style={tabsContainerStyle}>
            <button
              onClick={() => { setTabActiva('estudiantes'); limpiarFiltros(); }}
              style={{ ...tabButtonStyle, background: tabActiva === 'estudiantes' ? 'rgba(0,187,126,0.15)' : 'transparent', borderBottom: tabActiva === 'estudiantes' ? `2px solid ${PALETTE.principal}` : '2px solid transparent' }}
            >
              Estudiantes
            </button>
            <button
              onClick={() => { setTabActiva('docentes'); limpiarFiltros(); }}
              style={{ ...tabButtonStyle, background: tabActiva === 'docentes' ? 'rgba(0,187,126,0.15)' : 'transparent', borderBottom: tabActiva === 'docentes' ? `2px solid ${PALETTE.principal}` : '2px solid transparent' }}
            >
              Docentes
            </button>
            <button
              onClick={() => { setTabActiva('salones'); limpiarFiltros(); }}
              style={{ ...tabButtonStyle, background: tabActiva === 'salones' ? 'rgba(0,187,126,0.15)' : 'transparent', borderBottom: tabActiva === 'salones' ? `2px solid ${PALETTE.principal}` : '2px solid transparent' }}
            >
              Salones
            </button>
            <button
              onClick={() => { setTabActiva('actualizar'); limpiarFiltros(); }}
              style={{ ...tabButtonStyle, background: tabActiva === 'actualizar' ? 'rgba(0,187,126,0.15)' : 'transparent', borderBottom: tabActiva === 'actualizar' ? `2px solid ${PALETTE.principal}` : '2px solid transparent' }}
            >
              Actualizar Datos
            </button>
          </div>

          <div style={cardHeaderStyle}>
            <div style={headerContentStyle}>
              <h1 style={titleStyle}>
                {tabActiva === 'estudiantes' && 'Gestion de Estudiantes'}
                {tabActiva === 'docentes' && 'Gestion de Docentes'}
                {tabActiva === 'salones' && 'Gestion de Salones'}
                {tabActiva === 'actualizar' && 'Actualizar Datos de Estudiantes'}
              </h1>
              <p style={subtitleStyle}>
                {tabActiva === 'estudiantes' && `Total: ${estudiantes.length} estudiantes registrados`}
                {tabActiva === 'docentes' && `Total: ${docentes.length} docentes registrados`}
                {tabActiva === 'salones' && `Total: ${salones.length} salones registrados`}
                {tabActiva === 'actualizar' && `Seleccione los estudiantes para actualizar`}
              </p>
            </div>
            {tabActiva === 'salones' && (
              <button onClick={handleCrearSalon} style={crearButtonStyle}>+ Nuevo Salon</button>
            )}
          </div>

          <div style={cardBodyStyle}>
            <div style={filtrosContainerStyle}>
              <div style={searchContainerStyle}>
                <div style={searchWrapperStyle}>
                  <span style={searchIconStyle}>🔍</span>
                  <input
                    type="text"
                    placeholder={
                      tabActiva === 'estudiantes' ? 'Buscar por nombre, apellido o cedula...' :
                      tabActiva === 'docentes' ? 'Buscar por nombre, apellido, cedula o email...' :
                      tabActiva === 'salones' ? 'Buscar salones por nombre, nivel, grado o seccion...' :
                      'Buscar estudiantes por nombre, apellido o cedula...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} style={clearSearchButtonStyle}>✕</button>
                  )}
                </div>
              </div>

              <div style={filtrosGridStyle}>
                <select value={filtroNivel} onChange={(e) => { setFiltroNivel(e.target.value); setFiltroGrado(''); }} style={selectStyle}>
                  <option value="">Todos los niveles</option>
                  {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>

                {(tabActiva === 'estudiantes' || tabActiva === 'salones' || tabActiva === 'actualizar') && (
                  <select value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)} style={selectStyle} disabled={!filtroNivel}>
                    <option value="">Todos los grados</option>
                    {filtroNivel && gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                )}

                <select value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)} style={selectStyle}>
                  <option value="">Todas las secciones</option>
                  {secciones.map((s) => <option key={s} value={s}>Seccion {s}</option>)}
                </select>

                {tieneFiltrosActivos && (
                  <button onClick={limpiarFiltros} style={limpiarButtonStyle}>Limpiar filtros</button>
                )}
              </div>

              <div style={resultadosInfoStyle}>
                {tabActiva === 'estudiantes' && `Mostrando ${estudiantesFiltrados.length} de ${estudiantes.length} estudiantes`}
                {tabActiva === 'docentes' && `Mostrando ${docentesFiltrados.length} de ${docentes.length} docentes`}
                {tabActiva === 'salones' && `Mostrando ${salonesFiltrados.length} de ${salones.length} salones`}
                {tabActiva === 'actualizar' && `Mostrando ${estudiantesFiltrados.length} de ${estudiantes.length} estudiantes`}
                {tabActiva !== 'docentes' && estudiantesFiltrados.length !== estudiantes.length && ` (filtrados de ${estudiantes.length} totales)`}
                {tabActiva === 'docentes' && docentesFiltrados.length !== docentes.length && ` (filtrados de ${docentes.length} totales)`}
                {tabActiva === 'salones' && salonesFiltrados.length !== salones.length && ` (filtrados de ${salones.length} totales)`}
              </div>
            </div>

            {tabActiva === 'estudiantes' && (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={tableHeaderStyle}>Cedula</th>
                      <th style={tableHeaderStyle}>Nombres</th>
                      <th style={tableHeaderStyle}>Apellidos</th>
                      <th style={tableHeaderStyle}>Fecha Nac.</th>
                      <th style={tableHeaderStyle}>Nivel</th>
                      <th style={tableHeaderStyle}>Grado</th>
                      <th style={tableHeaderStyle}>Seccion</th>
                      <th style={tableHeaderStyle}>Telefono</th>
                      <th style={tableHeaderStyle}>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesFiltrados.length === 0 ? (
                      <tr><td colSpan={9} style={emptyStateStyle}>No se encontraron estudiantes</td></tr>
                    ) : (
                      estudiantesFiltrados.map((e) => (
                        <tr key={e.id} style={tableRowStyle}>
                          <td style={tableCellStyle}><span style={cedulaHighlightStyle}>{e.cedulaIdentidad}</span></td>
                          <td style={tableCellStyle}>{e.nombres}</td>
                          <td style={tableCellStyle}>{e.apellidos}</td>
                          <td style={tableCellStyle}>{formatFecha(e.fechaNacimiento)}</td>
                          <td style={tableCellStyle}>{niveles.find(n => n.id === e.nivel)?.nombre || '-'}</td>
                          <td style={tableCellStyle}>{e.grado}</td>
                          <td style={tableCellStyle}><span style={seccionBadgeStyle}>{e.seccion}</span></td>
                          <td style={tableCellStyle}>{e.numeroTelefonoCelular || '-'}</td>
                          <td style={tableCellStyle}><span style={emailTextStyle}>{e.correoElectronico}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tabActiva === 'docentes' && (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={tableHeaderStyle}>Cedula</th>
                      <th style={tableHeaderStyle}>Nombres</th>
                      <th style={tableHeaderStyle}>Apellidos</th>
                      <th style={tableHeaderStyle}>Email</th>
                      <th style={tableHeaderStyle}>Telefono</th>
                      <th style={tableHeaderStyle}>Contratacion</th>
                      <th style={tableHeaderStyle}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docentesFiltrados.length === 0 ? (
                      <tr><td colSpan={7} style={emptyStateStyle}>No se encontraron docentes</td></tr>
                    ) : (
                      docentesFiltrados.map((d) => (
                        <tr key={d.id} style={tableRowStyle}>
                          <td style={tableCellStyle}><span style={cedulaHighlightStyle}>{d.cedulaIdentidad}</span></td>
                          <td style={tableCellStyle}>{d.nombres}</td>
                          <td style={tableCellStyle}>{d.apellidos}</td>
                          <td style={tableCellStyle}><span style={emailTextStyle}>{d.email}</span></td>
                          <td style={tableCellStyle}>{d.telefono || '-'}</td>
                          <td style={tableCellStyle}>{formatFecha(d.fechaContratacion)}</td>
                          <td style={tableCellStyle}>
                            <span style={{ ...estadoBadgeStyle, background: d.activo ? 'rgba(0,187,126,0.15)' : 'rgba(156,163,175,0.1)', color: d.activo ? PALETTE.principal : '#9ca3af' }}>
                              {d.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tabActiva === 'salones' && (
              <div style={gridContainerStyle}>
                {salonesFiltrados.map((salon) => {
                  const estudiantesSalon = obtenerEstudiantesSalon(salon.estudianteIds);
                  return (
                    <div key={salon.id} style={salonCardStyle}>
                      <div style={salonHeaderStyle}>
                        <h3 style={salonNombreStyle}>{salon.nombre}</h3>
                        <div style={salonAccionesStyle}>
                          <button onClick={() => handleEditarSalon(salon)} style={editarSalonButtonStyle}>Editar</button>
                          <button onClick={() => handleEliminarSalon(salon.id)} style={eliminarSalonButtonStyle}>Eliminar</button>
                        </div>
                      </div>
                      <div style={salonInfoStyle}>
                        <div style={infoRowStyle}>
                          <span style={infoLabelStyle}>Nivel:</span>
                          <span style={infoValueStyle}>{niveles.find(n => n.id === salon.nivel)?.nombre || salon.nivel}</span>
                        </div>
                        <div style={infoRowStyle}>
                          <span style={infoLabelStyle}>Grado:</span>
                          <span style={infoValueStyle}>{salon.grado}</span>
                        </div>
                        <div style={infoRowStyle}>
                          <span style={infoLabelStyle}>Seccion:</span>
                          <span style={seccionBadgeStyle}>{salon.seccion}</span>
                        </div>
                        <div style={infoRowStyle}>
                          <span style={infoLabelStyle}>Año Academico:</span>
                          <span style={infoValueStyle}>{salon.anioAcademico}</span>
                        </div>
                      </div>
                      <div style={estudiantesPreviewStyle}>
                        <span style={infoLabelStyle}>Estudiantes ({estudiantesSalon.length}):</span>
                        <div style={estudiantesMiniListStyle}>
                          {estudiantesSalon.length > 0 ? (
                            estudiantesSalon.slice(0, 4).map((est) => (
                              <span key={est.id} style={estudianteMiniTagStyle}>{est.nombres} {est.apellidos}</span>
                            ))
                          ) : (
                            <span style={sinAsignarStyle}>Sin estudiantes</span>
                          )}
                          {estudiantesSalon.length > 4 && <span style={masTagStyle}>+{estudiantesSalon.length - 4} mas</span>}
                        </div>
                      </div>
                      <div style={verDetalleStyle}>
                        <button onClick={() => handleVerSalon(salon)} style={verDetalleButtonStyle}>Ver Detalles</button>
                      </div>
                    </div>
                  );
                })}
                {salonesFiltrados.length === 0 && (
                  <div style={emptyStateStyle}>No se encontraron salones</div>
                )}
              </div>
            )}

            {tabActiva === 'actualizar' && (
              <div style={tableContainerStyle}>
                <div style={actualizarHeaderStyle}>
                  <p style={actualizarInfoStyle}>
                    Seleccione los estudiantes que desea actualizar y luego elija el nuevo nivel, grado o seccion
                  </p>
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={tableHeaderCheckboxStyle}>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-estudiante]');
                            checkboxes.forEach((cb: any) => cb.checked = e.target.checked);
                          }}
                          style={checkboxStyle}
                        />
                      </th>
                      <th style={tableHeaderStyle}>Cedula</th>
                      <th style={tableHeaderStyle}>Nombres</th>
                      <th style={tableHeaderStyle}>Apellidos</th>
                      <th style={tableHeaderStyle}>Nivel</th>
                      <th style={tableHeaderStyle}>Grado</th>
                      <th style={tableHeaderStyle}>Seccion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesFiltrados.length === 0 ? (
                      <tr><td colSpan={7} style={emptyStateStyle}>No se encontraron estudiantes</td></tr>
                    ) : (
                      estudiantesFiltrados.map((e) => (
                        <tr key={e.id} style={tableRowStyle}>
                          <td style={tableCellStyle}>
                            <input type="checkbox" data-estudiante={e.id} style={checkboxStyle} />
                          </td>
                          <td style={tableCellStyle}><span style={cedulaHighlightStyle}>{e.cedulaIdentidad}</span></td>
                          <td style={tableCellStyle}>{e.nombres}</td>
                          <td style={tableCellStyle}>{e.apellidos}</td>
                          <td style={tableCellStyle}>{niveles.find(n => n.id === e.nivel)?.nombre || '-'}</td>
                          <td style={tableCellStyle}>{e.grado}</td>
                          <td style={tableCellStyle}><span style={seccionBadgeStyle}>{e.seccion}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={actualizarAccionesStyle}>
                  <select style={actualizarSelectStyle} id="nuevoNivel">
                    <option value="">Mantener nivel</option>
                    {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                  <select style={actualizarSelectStyle} id="nuevoGrado">
                    <option value="">Mantener grado</option>
                    {filtroNivel && gradosPorNivel[filtroNivel as keyof typeof gradosPorNivel]?.map((g) => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                  <select style={actualizarSelectStyle} id="nuevaSeccion">
                    <option value="">Mantener seccion</option>
                    {secciones.map((s) => <option key={s} value={s}>Seccion {s}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const checkboxes = document.querySelectorAll('input[type="checkbox"][data-estudiante]:checked');
                      const ids = Array.from(checkboxes).map((cb: any) => cb.dataset.estudiante);
                      if (ids.length === 0) {
                        alert('Seleccione al menos un estudiante');
                        return;
                      }
                      const nuevoNivel = (document.getElementById('nuevoNivel') as HTMLSelectElement).value;
                      const nuevoGrado = (document.getElementById('nuevoGrado') as HTMLSelectElement).value;
                      const nuevaSeccion = (document.getElementById('nuevaSeccion') as HTMLSelectElement).value;
                      if (!nuevoNivel && !nuevoGrado && !nuevaSeccion) {
                        alert('Seleccione al menos un campo para actualizar');
                        return;
                      }
                      handleEdicionMasiva(ids, nuevoNivel, nuevoGrado, nuevaSeccion);
                    }}
                    style={actualizarButtonStyle}
                  >
                    Actualizar Seleccionados
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {mostrarDetalleSalon && salonSeleccionado && (
        <DetalleSalonModal
          salon={salonSeleccionado}
          estudiantes={estudiantes}
          niveles={niveles}
          gradosPorNivel={gradosPorNivel}
          secciones={secciones}
          onClose={() => { setMostrarDetalleSalon(false); setSalonSeleccionado(null); }}
          onEditarEstudiante={handleEditarEstudianteIndividual}
          onEdicionMasiva={handleEdicionMasiva}
        />
      )}

      {mostrarModalSalon && (
        <SalonModal
          salon={salonEditando}
          modo={modalSalonModo}
          estudiantes={estudiantes}
          niveles={niveles}
          gradosPorNivel={gradosPorNivel}
          secciones={secciones}
          onClose={() => { setMostrarModalSalon(false); setSalonEditando(null); }}
          onSave={handleGuardarSalon}
        />
      )}
    </div>
  );
};

interface SalonModalProps {
  salon: Salon | null;
  modo: 'crear' | 'editar';
  estudiantes: Estudiante[];
  niveles: { id: string; nombre: string }[];
  gradosPorNivel: { [key: string]: { id: string; nombre: string }[] };
  secciones: string[];
  onClose: () => void;
  onSave: (data: Omit<Salon, 'id'>) => void;
}

const SalonModal: React.FC<SalonModalProps> = ({
  salon,
  modo,
  estudiantes,
  niveles,
  gradosPorNivel,
  secciones,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    nombre: salon?.nombre || '',
    nivel: salon?.nivel || '',
    grado: salon?.grado || '',
    seccion: salon?.seccion || '',
    docenteIds: salon?.docenteIds || [],
    estudianteIds: salon?.estudianteIds || [],
    anioAcademico: salon?.anioAcademico || '2024-2025'
  });

  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');

  const estudiantesDisponibles = estudiantes.filter(e => !formData.estudianteIds.includes(e.id));
  const estudiantesSeleccionados = estudiantes.filter(e => formData.estudianteIds.includes(e.id));

  const estudiantesFiltrados = busquedaEstudiante
    ? estudiantesDisponibles.filter(e =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(busquedaEstudiante.toLowerCase()) ||
        e.cedulaIdentidad.includes(busquedaEstudiante)
      )
    : estudiantesDisponibles;

  const gradosDisponibles = formData.nivel ? gradosPorNivel[formData.nivel as keyof typeof gradosPorNivel] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.nivel || !formData.grado || !formData.seccion) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    onSave(formData);
  };

  const toggleEstudiante = (estudianteId: string) => {
    setFormData(prev => ({
      ...prev,
      estudianteIds: prev.estudianteIds.includes(estudianteId)
        ? prev.estudianteIds.filter(id => id !== estudianteId)
        : [...prev.estudianteIds, estudianteId]
    }));
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{modo === 'crear' ? 'Nuevo Salon' : 'Editar Salon'}</h2>
          <button onClick={onClose} style={modalCloseStyle}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={modalFormStyle}>
          <div style={modalFieldStyle}>
            <label style={modalLabelStyle}>Nombre del Salon *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Salon A-1"
              style={modalInputStyle}
              required
            />
          </div>

          <div style={modalRowStyle}>
            <div style={modalFieldStyle}>
              <label style={modalLabelStyle}>Nivel *</label>
              <select
                value={formData.nivel}
                onChange={(e) => { setFormData({ ...formData, nivel: e.target.value, grado: '' }); }}
                style={modalSelectStyle}
                required
              >
                <option value="">Seleccionar nivel</option>
                {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </div>
            <div style={modalFieldStyle}>
              <label style={modalLabelStyle}>Grado *</label>
              <select
                value={formData.grado}
                onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                style={modalSelectStyle}
                disabled={!formData.nivel}
                required
              >
                <option value="">Seleccionar grado</option>
                {gradosDisponibles.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            <div style={modalFieldStyle}>
              <label style={modalLabelStyle}>Seccion *</label>
              <select
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                style={modalSelectStyle}
                required
              >
                <option value="">Seleccionar seccion</option>
                {secciones.map((s) => <option key={s} value={s}>Seccion {s}</option>)}
              </select>
            </div>
          </div>

          <div style={modalFieldStyle}>
            <label style={modalLabelStyle}>Año Academico</label>
            <input
              type="text"
              value={formData.anioAcademico}
              onChange={(e) => setFormData({ ...formData, anioAcademico: e.target.value })}
              placeholder="Ej: 2024-2025"
              style={modalInputStyle}
            />
          </div>

          <div style={modalFieldStyle}>
            <label style={modalLabelStyle}>Estudiantes Asignados ({formData.estudianteIds.length})</label>
            <div style={estudiantesSeleccionadosContainerStyle}>
              {estudiantesSeleccionados.map((est) => (
                <div key={est.id} style={estudianteSeleccionadoStyle}>
                  <span>{est.nombres} {est.apellidos}</span>
                  <button type="button" onClick={() => toggleEstudiante(est.id)} style={removerEstudianteStyle}>✕</button>
                </div>
              ))}
              {estudiantesSeleccionados.length === 0 && <span style={sinAsignarStyle}>No hay estudiantes asignados</span>}
            </div>

            <div style={busquedaEstudiantesStyle}>
              <input
                type="text"
                placeholder="Buscar estudiantes para agregar..."
                value={busquedaEstudiante}
                onChange={(e) => setBusquedaEstudiante(e.target.value)}
                style={modalInputStyle}
              />
              <div style={listaEstudiantesStyle}>
                {estudiantesFiltrados.length > 0 ? (
                  estudiantesFiltrados.map((est) => (
                    <div key={est.id} style={estudianteDisponibleStyle} onClick={() => toggleEstudiante(est.id)}>
                      <span>{est.nombres} {est.apellidos}</span>
                      <span style={estudianteCedulaStyle}>{est.cedulaIdentidad}</span>
                      <button type="button" style={agregarEstudianteStyle} onClick={(e) => { e.stopPropagation(); toggleEstudiante(est.id); }}>+</button>
                    </div>
                  ))
                ) : (
                  <span style={sinAsignarStyle}>No hay estudiantes disponibles</span>
                )}
              </div>
            </div>
          </div>

          <div style={modalButtonContainerStyle}>
            <button type="button" onClick={onClose} style={modalCancelButtonStyle}>Cancelar</button>
            <button type="submit" style={modalSaveButtonStyle}>{modo === 'crear' ? 'Crear Salon' : 'Guardar Cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DetalleSalonModalProps {
  salon: Salon;
  estudiantes: Estudiante[];
  niveles: { id: string; nombre: string }[];
  gradosPorNivel: { [key: string]: { id: string; nombre: string }[] };
  secciones: string[];
  onClose: () => void;
  onEditarEstudiante: (estudiante: Estudiante) => void;
  onEdicionMasiva: (estudianteIds: string[], nivel: string, grado: string, seccion: string) => void;
}

const DetalleSalonModal: React.FC<DetalleSalonModalProps> = ({
  salon,
  estudiantes,
  niveles,
  gradosPorNivel,
  secciones,
  onClose,
  onEditarEstudiante,
  onEdicionMasiva
}) => {
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState<string[]>([]);
  const [mostrarEdicionMasiva, setMostrarEdicionMasiva] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const estudiantesSalon = estudiantes.filter(e => salon.estudianteIds.includes(e.id));
  const estudiantesFiltrados = searchTerm
    ? estudiantesSalon.filter(e =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cedulaIdentidad.includes(searchTerm)
      )
    : estudiantesSalon;

  const toggleSeleccionarEstudiante = (estudianteId: string) => {
    setEstudiantesSeleccionados(prev =>
      prev.includes(estudianteId) ? prev.filter(id => id !== estudianteId) : [...prev, estudianteId]
    );
  };

  const toggleSeleccionarTodos = () => {
    if (estudiantesSeleccionados.length === estudiantesFiltrados.length) {
      setEstudiantesSeleccionados([]);
    } else {
      setEstudiantesSeleccionados(estudiantesFiltrados.map(e => e.id));
    }
  };

  const handleEditarEstudiante = (estudiante: Estudiante) => {
    onEditarEstudiante(estudiante);
  };

  const handleEdicionMasiva = (nuevoNivel: string, nuevoGrado: string, nuevaSeccion: string) => {
    if (estudiantesSeleccionados.length === 0) {
      alert('No hay estudiantes seleccionados');
      return;
    }
    onEdicionMasiva(estudiantesSeleccionados, nuevoNivel, nuevoGrado, nuevaSeccion);
    setEstudiantesSeleccionados([]);
    setMostrarEdicionMasiva(false);
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalDetalleContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalDetalleHeaderStyle}>
          <div>
            <h2 style={modalDetalleTitleStyle}>{salon.nombre}</h2>
            <p style={modalDetalleSubtitleStyle}>
              {niveles.find(n => n.id === salon.nivel)?.nombre} - {salon.grado} - Seccion {salon.seccion}
              <span style={modalDetalleCountStyle}> | {estudiantesSalon.length} estudiantes</span>
            </p>
          </div>
          <div style={modalDetalleAccionesStyle}>
            {estudiantesSeleccionados.length > 0 && (
              <button onClick={() => setMostrarEdicionMasiva(true)} style={editarMasivaButtonStyle}>
                Editar Seleccionados ({estudiantesSeleccionados.length})
              </button>
            )}
            <button onClick={onClose} style={modalCloseStyle}>✕</button>
          </div>
        </div>

        <div style={modalDetalleBodyStyle}>
          <div style={modalDetalleSearchStyle}>
            <input
              type="text"
              placeholder="Buscar estudiantes por nombre o cedula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={modalSearchInputStyle}
            />
          </div>

          <div style={modalTableContainerStyle}>
            <table style={modalTableStyle}>
              <thead>
                <tr style={modalTableHeaderRowStyle}>
                  <th style={modalTableHeaderCheckboxStyle}>
                    <input
                      type="checkbox"
                      checked={estudiantesFiltrados.length > 0 && estudiantesSeleccionados.length === estudiantesFiltrados.length}
                      onChange={toggleSeleccionarTodos}
                      style={checkboxStyle}
                    />
                  </th>
                  <th style={modalTableHeaderStyle}>Cedula</th>
                  <th style={modalTableHeaderStyle}>Nombres</th>
                  <th style={modalTableHeaderStyle}>Apellidos</th>
                  <th style={modalTableHeaderStyle}>Grado</th>
                  <th style={modalTableHeaderStyle}>Seccion</th>
                  <th style={modalTableHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.length === 0 ? (
                  <tr><td colSpan={7} style={emptyStateStyle}>No se encontraron estudiantes</td></tr>
                ) : (
                  estudiantesFiltrados.map((estudiante) => {
                    const seleccionado = estudiantesSeleccionados.includes(estudiante.id);
                    return (
                      <tr key={estudiante.id} style={{ ...modalTableRowStyle, background: seleccionado ? 'rgba(0,187,126,0.1)' : 'transparent' }}>
                        <td style={modalTableCellStyle}>
                          <input type="checkbox" checked={seleccionado} onChange={() => toggleSeleccionarEstudiante(estudiante.id)} style={checkboxStyle} />
                        </td>
                        <td style={modalTableCellStyle}><span style={cedulaHighlightStyle}>{estudiante.cedulaIdentidad}</span></td>
                        <td style={modalTableCellStyle}>{estudiante.nombres}</td>
                        <td style={modalTableCellStyle}>{estudiante.apellidos}</td>
                        <td style={modalTableCellStyle}>
                          <select
                            value={estudiante.grado}
                            onChange={(e) => handleEditarEstudiante({ ...estudiante, grado: e.target.value })}
                            style={modalEditarSelectStyle}
                          >
                            {gradosPorNivel[estudiante.nivel as keyof typeof gradosPorNivel]?.map((g) => (
                              <option key={g.id} value={g.id}>{g.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td style={modalTableCellStyle}>
                          <select
                            value={estudiante.seccion}
                            onChange={(e) => handleEditarEstudiante({ ...estudiante, seccion: e.target.value })}
                            style={modalEditarSelectStyle}
                          >
                            {secciones.map((s) => <option key={s} value={s}>Seccion {s}</option>)}
                          </select>
                        </td>
                        <td style={modalTableCellStyle}>
                          <button
                            onClick={() => {
                              const nuevoNivel = prompt('Nuevo nivel (inicial, primaria, media):', estudiante.nivel);
                              if (nuevoNivel && niveles.find(n => n.id === nuevoNivel)) {
                                handleEditarEstudiante({ ...estudiante, nivel: nuevoNivel, grado: '' });
                              }
                            }}
                            style={modalEditarButtonStyle}
                          >
                            Nivel
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={modalFooterStyle}>
            <span style={modalFooterTextStyle}>
              {estudiantesSeleccionados.length} de {estudiantesFiltrados.length} estudiantes seleccionados
              {estudiantesFiltrados.length !== estudiantesSalon.length && ` (filtrados de ${estudiantesSalon.length} totales)`}
            </span>
          </div>
        </div>
      </div>

      {mostrarEdicionMasiva && (
        <EdicionMasivaModal
          estudiantesSeleccionados={estudiantesSeleccionados}
          estudiantes={estudiantes}
          niveles={niveles}
          gradosPorNivel={gradosPorNivel}
          secciones={secciones}
          onClose={() => setMostrarEdicionMasiva(false)}
          onSave={handleEdicionMasiva}
        />
      )}
    </div>
  );
};

interface EdicionMasivaModalProps {
  estudiantesSeleccionados: string[];
  estudiantes: Estudiante[];
  niveles: { id: string; nombre: string }[];
  gradosPorNivel: { [key: string]: { id: string; nombre: string }[] };
  secciones: string[];
  onClose: () => void;
  onSave: (nivel: string, grado: string, seccion: string) => void;
}

const EdicionMasivaModal: React.FC<EdicionMasivaModalProps> = ({
  estudiantesSeleccionados,
  estudiantes,
  niveles,
  gradosPorNivel,
  secciones,
  onClose,
  onSave
}) => {
  const [nuevoNivel, setNuevoNivel] = useState('');
  const [nuevoGrado, setNuevoGrado] = useState('');
  const [nuevaSeccion, setNuevaSeccion] = useState('');

  const estudiantesSeleccionadosData = estudiantes.filter(e => estudiantesSeleccionados.includes(e.id));
  const gradosDisponibles = nuevoNivel ? gradosPorNivel[nuevoNivel as keyof typeof gradosPorNivel] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNivel && !nuevoGrado && !nuevaSeccion) {
      alert('Seleccione al menos un campo para actualizar');
      return;
    }
    onSave(nuevoNivel, nuevoGrado, nuevaSeccion);
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Edicion Masiva</h2>
          <button onClick={onClose} style={modalCloseStyle}>✕</button>
        </div>

        <div style={modalBodyStyle}>
          <p style={modalTextStyle}><strong>{estudiantesSeleccionados.length}</strong> estudiantes seleccionados</p>
          <div style={selectedStudentsPreviewStyle}>
            {estudiantesSeleccionadosData.slice(0, 5).map((est) => (
              <span key={est.id} style={selectedStudentTagStyle}>{est.nombres} {est.apellidos}</span>
            ))}
            {estudiantesSeleccionadosData.length > 5 && (
              <span style={selectedStudentTagStyle}>+{estudiantesSeleccionadosData.length - 5} mas</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={modalFormStyle}>
          <div style={modalRowStyle}>
            <div style={modalFieldStyle}>
              <label style={modalLabelStyle}>Nivel</label>
              <select value={nuevoNivel} onChange={(e) => { setNuevoNivel(e.target.value); setNuevoGrado(''); }} style={modalSelectStyle}>
                <option value="">Mantener actual</option>
                {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </div>
            <div style={modalFieldStyle}>
              <label style={modalLabelStyle}>Grado</label>
              <select value={nuevoGrado} onChange={(e) => setNuevoGrado(e.target.value)} style={modalSelectStyle} disabled={!nuevoNivel}>
                <option value="">Mantener actual</option>
                {gradosDisponibles.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            <div style={modalFieldStyle}>
              <label style={modalLabelStyle}>Seccion</label>
              <select value={nuevaSeccion} onChange={(e) => setNuevaSeccion(e.target.value)} style={modalSelectStyle}>
                <option value="">Mantener actual</option>
                {secciones.map((s) => <option key={s} value={s}>Seccion {s}</option>)}
              </select>
            </div>
          </div>

          <div style={modalButtonContainerStyle}>
            <button type="button" onClick={onClose} style={modalCancelButtonStyle}>Cancelar</button>
            <button type="submit" style={modalSaveButtonStyle}>Actualizar {estudiantesSeleccionados.length} estudiantes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Estilos
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: PALETTE.deepBg,
  position: 'relative',
  fontFamily: "'Montserrat', sans-serif",
  color: PALETTE.white
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(26, 46, 38, 0.95)',
  zIndex: 0
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  gap: '1.5rem',
  position: 'relative',
  zIndex: 1
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  border: '3px solid rgba(0,187,126,0.1)',
  borderTop: '3px solid ' + PALETTE.principal,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const loadingTextStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '1rem'
};

const navStyle: React.CSSProperties = {
  padding: '2rem 8%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const backButtonStyle: React.CSSProperties = {
  color: PALETTE.white,
  fontWeight: 'bold',
  background: 'none',
  border: 'none',
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '0.5rem 1rem',
  borderRadius: '10px',
  transition: 'background 0.3s'
};

const navTitleStyle: React.CSSProperties = {
  color: PALETTE.principal,
  fontWeight: '800',
  letterSpacing: '1px',
  fontSize: '1.2rem'
};

const navBadgeStyle: React.CSSProperties = {
  background: 'rgba(0,187,126,0.15)',
  color: PALETTE.principal,
  padding: '0.5rem 1.5rem',
  borderRadius: '20px',
  fontSize: '0.9rem',
  fontWeight: '600'
};

const mainStyle: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '2rem 8%',
  position: 'relative',
  zIndex: 1
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(15px)',
  borderRadius: '30px',
  border: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
};

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0',
  padding: '0 2.5rem',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'rgba(0,0,0,0.1)'
};

const tabButtonStyle: React.CSSProperties = {
  padding: '1rem 2rem',
  border: 'none',
  background: 'transparent',
  color: PALETTE.white,
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  borderBottom: '2px solid transparent',
  letterSpacing: '0.5px'
};

const cardHeaderStyle: React.CSSProperties = {
  padding: '2rem 2.5rem',
  background: 'rgba(0,187,126,0.05)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem'
};

const headerContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: '900',
  color: PALETTE.white,
  margin: 0
};

const subtitleStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '1rem',
  margin: 0
};

const crearButtonStyle: React.CSSProperties = {
  padding: '0.8rem 2rem',
  background: PALETTE.principal,
  border: 'none',
  borderRadius: '12px',
  color: '#1a2e26',
  fontWeight: '700',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background 0.3s'
};

const cardBodyStyle: React.CSSProperties = {
  padding: '2rem 2.5rem'
};

const filtrosContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const searchContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const searchWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%'
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: '1.1rem',
  opacity: 0.6
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem 3rem 1rem 3.5rem',
  background: 'rgba(0,0,0,0.3)',
  border: '2px solid rgba(255,255,255,0.1)',
  borderRadius: '15px',
  color: PALETTE.white,
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border 0.3s, box-shadow 0.3s'
};

const clearSearchButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: PALETTE.textGray,
  fontSize: '1.2rem',
  cursor: 'pointer',
  padding: '0.25rem 0.5rem',
  borderRadius: '50%',
  transition: 'background 0.2s'
};

const filtrosGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
};

const selectStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: PALETTE.white,
  fontSize: '0.95rem',
  outline: 'none',
  cursor: 'pointer'
};

const limpiarButtonStyle: React.CSSProperties = {
  padding: '0.8rem 1.5rem',
  background: 'rgba(156,163,175,0.1)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: PALETTE.textGray,
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: '600',
  transition: 'background 0.3s'
};

const resultadosInfoStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.9rem',
  padding: '0.5rem 0'
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: '15px',
  border: '1px solid rgba(255,255,255,0.05)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem'
};

const tableHeaderRowStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)'
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  textAlign: 'left',
  fontWeight: '700',
  color: PALETTE.principal,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const tableHeaderCheckboxStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  textAlign: 'center',
  fontWeight: '700',
  color: PALETTE.principal,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  width: '50px'
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.03)',
  transition: 'background 0.2s'
};

const tableCellStyle: React.CSSProperties = {
  padding: '1rem 1.2rem',
  color: PALETTE.white
};

const cedulaHighlightStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontWeight: '600',
  color: PALETTE.principal
};

const emailTextStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.85rem'
};

const seccionBadgeStyle: React.CSSProperties = {
  background: 'rgba(0,187,126,0.1)',
  color: PALETTE.principal,
  padding: '0.25rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: '700',
  display: 'inline-block'
};

const estadoBadgeStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: '700',
  display: 'inline-block'
};

const emptyStateStyle: React.CSSProperties = {
  padding: '3rem',
  textAlign: 'center',
  color: PALETTE.textGray,
  fontSize: '1rem'
};

const gridContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '1.5rem'
};

const salonCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '15px',
  padding: '1.5rem',
  border: '1px solid rgba(255,255,255,0.05)',
  transition: 'all 0.3s ease'
};

const salonHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem'
};

const salonNombreStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: '700',
  color: PALETTE.principal,
  margin: 0
};

const salonAccionesStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem'
};

const editarSalonButtonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem',
  background: 'rgba(0,187,126,0.15)',
  border: '1px solid ' + PALETTE.principal,
  borderRadius: '6px',
  color: PALETTE.principal,
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '600'
};

const eliminarSalonButtonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem',
  background: 'rgba(255,0,0,0.1)',
  border: '1px solid rgba(255,0,0,0.3)',
  borderRadius: '6px',
  color: '#ff6b6b',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: '600'
};

const salonInfoStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.5rem',
  marginBottom: '1rem'
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  color: PALETTE.textGray,
  fontWeight: '600',
  letterSpacing: '0.5px'
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: PALETTE.white,
  fontWeight: '500'
};

const estudiantesPreviewStyle: React.CSSProperties = {
  marginTop: '0.5rem'
};

const estudiantesMiniListStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.3rem',
  marginTop: '0.3rem'
};

const estudianteMiniTagStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  padding: '0.2rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  color: PALETTE.textGray
};

const masTagStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  padding: '0.2rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  color: PALETTE.principal,
  fontWeight: '600'
};

const verDetalleStyle: React.CSSProperties = {
  marginTop: '1rem',
  textAlign: 'center',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  paddingTop: '0.8rem'
};

const verDetalleButtonStyle: React.CSSProperties = {
  padding: '0.4rem 1.5rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: PALETTE.textGray,
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '600',
  transition: 'background 0.3s'
};

const sinAsignarStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.85rem',
  fontStyle: 'italic'
};

const actualizarHeaderStyle: React.CSSProperties = {
  padding: '1rem',
  background: 'rgba(0,187,126,0.05)',
  borderRadius: '10px',
  marginBottom: '1rem'
};

const actualizarInfoStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.95rem',
  margin: 0
};

const actualizarAccionesStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
  marginTop: '1.5rem',
  padding: '1.5rem',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '12px',
  alignItems: 'center',
  justifyContent: 'center'
};

const actualizarSelectStyle: React.CSSProperties = {
  padding: '0.6rem 1rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: PALETTE.white,
  fontSize: '0.9rem',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '150px'
};

const actualizarButtonStyle: React.CSSProperties = {
  padding: '0.8rem 2rem',
  background: PALETTE.principal,
  border: 'none',
  borderRadius: '8px',
  color: '#1a2e26',
  fontWeight: '700',
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'background 0.3s'
};

const checkboxStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: PALETTE.principal
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(5px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalDetalleContentStyle: React.CSSProperties = {
  background: '#1a2e26',
  borderRadius: '20px',
  padding: '0',
  maxWidth: '1000px',
  width: '95%',
  maxHeight: '90vh',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.05)'
};

const modalDetalleHeaderStyle: React.CSSProperties = {
  padding: '1.5rem 2rem',
  background: 'rgba(0,187,126,0.05)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const modalDetalleTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: PALETTE.principal,
  margin: 0
};

const modalDetalleSubtitleStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.95rem',
  marginTop: '0.3rem'
};

const modalDetalleCountStyle: React.CSSProperties = {
  color: PALETTE.principal,
  fontWeight: '600'
};

const modalDetalleAccionesStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center'
};

const editarMasivaButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1.2rem',
  background: PALETTE.principal,
  border: 'none',
  borderRadius: '8px',
  color: '#1a2e26',
  fontWeight: '700',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'background 0.3s'
};

const modalCloseStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: PALETTE.textGray,
  fontSize: '1.5rem',
  cursor: 'pointer'
};

const modalDetalleBodyStyle: React.CSSProperties = {
  padding: '2rem',
  maxHeight: 'calc(90vh - 120px)',
  overflow: 'auto'
};

const modalDetalleSearchStyle: React.CSSProperties = {
  marginBottom: '1.5rem'
};

const modalSearchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: PALETTE.white,
  fontSize: '0.95rem',
  outline: 'none'
};

const modalTableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.05)'
};

const modalTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem'
};

const modalTableHeaderRowStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)'
};

const modalTableHeaderStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  textAlign: 'left',
  fontWeight: '700',
  color: PALETTE.principal,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
};

const modalTableHeaderCheckboxStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  textAlign: 'center',
  fontWeight: '700',
  color: PALETTE.principal,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  width: '40px'
};

const modalTableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.03)',
  transition: 'background 0.2s'
};

const modalTableCellStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  color: PALETTE.white
};

const modalEditarSelectStyle: React.CSSProperties = {
  padding: '0.3rem 0.5rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: PALETTE.white,
  fontSize: '0.85rem',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '100px'
};

const modalEditarButtonStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem',
  background: 'rgba(0,187,126,0.15)',
  border: '1px solid ' + PALETTE.principal,
  borderRadius: '6px',
  color: PALETTE.principal,
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '600'
};

const modalFooterStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '0.5rem 0',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  textAlign: 'right'
};

const modalFooterTextStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.85rem'
};

const modalContentStyle: React.CSSProperties = {
  background: '#1a2e26',
  borderRadius: '20px',
  padding: '2rem',
  maxWidth: '750px',
  width: '90%',
  maxHeight: '90vh',
  overflow: 'auto',
  border: '1px solid rgba(255,255,255,0.05)'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem'
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: PALETTE.white,
  margin: 0
};

const modalFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const modalFieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const modalLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: PALETTE.principal,
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const modalInputStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: PALETTE.white,
  fontSize: '0.95rem',
  outline: 'none'
};

const modalSelectStyle: React.CSSProperties = {
  padding: '0.8rem 1rem',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: PALETTE.white,
  fontSize: '0.95rem',
  outline: 'none',
  cursor: 'pointer'
};

const modalRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '1rem'
};

const modalButtonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '1rem'
};

const modalCancelButtonStyle: React.CSSProperties = {
  padding: '0.8rem 2rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: PALETTE.textGray,
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: '600'
};

const modalSaveButtonStyle: React.CSSProperties = {
  padding: '0.8rem 2rem',
  background: PALETTE.principal,
  border: 'none',
  borderRadius: '10px',
  color: '#1a2e26',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: '700'
};

const modalBodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const modalTextStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.95rem',
  lineHeight: '1.5',
  margin: 0
};

const selectedStudentsPreviewStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  padding: '0.5rem',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
};

const selectedStudentTagStyle: React.CSSProperties = {
  background: 'rgba(0,187,126,0.1)',
  padding: '0.2rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  color: PALETTE.white
};

const estudiantesSeleccionadosContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  padding: '0.8rem',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '10px',
  minHeight: '50px'
};

const estudianteSeleccionadoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: 'rgba(0,187,126,0.15)',
  padding: '0.25rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.85rem',
  color: PALETTE.white
};

const removerEstudianteStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: PALETTE.textGray,
  cursor: 'pointer',
  fontSize: '0.8rem'
};

const busquedaEstudiantesStyle: React.CSSProperties = {
  marginTop: '0.5rem'
};

const listaEstudiantesStyle: React.CSSProperties = {
  maxHeight: '200px',
  overflow: 'auto',
  marginTop: '0.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const estudianteDisponibleStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0.8rem',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.2s'
};

const estudianteCedulaStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.75rem'
};

const agregarEstudianteStyle: React.CSSProperties = {
  background: 'rgba(0,187,126,0.2)',
  border: 'none',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  color: PALETTE.principal,
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default GestionInstitutoPage;