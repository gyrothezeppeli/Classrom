"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af',
  white: '#ffffff',
  darkText: '#1a2e26'
};

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  email: string;
  telefono: string;
  especialidad: string;
  nivel: string;
  seccion: string;
  fechaContratacion: string;
  activo: boolean;
}

const EditTeachersListPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo para pruebas
  const [docentes] = useState<Docente[]>([
    {
      id: '1',
      nombres: 'María',
      apellidos: 'González Pérez',
      cedulaIdentidad: 'V-12345678',
      email: 'maria.g@colegio.com',
      telefono: '0412-1234567',
      especialidad: 'Matemática',
      nivel: 'primaria',
      seccion: 'A',
      fechaContratacion: '2020-01-15',
      activo: true
    },
    {
      id: '2',
      nombres: 'Juan',
      apellidos: 'Rodríguez Martínez',
      cedulaIdentidad: 'V-87654321',
      email: 'juan.r@colegio.com',
      telefono: '0414-7654321',
      especialidad: 'Lengua Española',
      nivel: 'primaria',
      seccion: 'B',
      fechaContratacion: '2019-08-20',
      activo: true
    },
    {
      id: '3',
      nombres: 'Ana',
      apellidos: 'López Sánchez',
      cedulaIdentidad: 'V-98765432',
      email: 'ana.l@colegio.com',
      telefono: '0416-9876543',
      especialidad: 'Biología',
      nivel: 'media',
      seccion: 'C',
      fechaContratacion: '2021-03-10',
      activo: true
    },
    {
      id: '4',
      nombres: 'Carlos',
      apellidos: 'Mendoza Flores',
      cedulaIdentidad: 'V-45678901',
      email: 'carlos.m@colegio.com',
      telefono: '0424-4567890',
      especialidad: 'Educación Inicial',
      nivel: 'inicial',
      seccion: 'A',
      fechaContratacion: '2018-11-01',
      activo: false
    },
    {
      id: '5',
      nombres: 'Laura',
      apellidos: 'Torres García',
      cedulaIdentidad: 'V-56789012',
      email: 'laura.t@colegio.com',
      telefono: '0412-5678901',
      especialidad: 'Historia',
      nivel: 'media',
      seccion: 'B',
      fechaContratacion: '2020-06-25',
      activo: true
    },
    {
      id: '6',
      nombres: 'Pedro',
      apellidos: 'Ramírez Díaz',
      cedulaIdentidad: 'V-67890123',
      email: 'pedro.r@colegio.com',
      telefono: '0414-6789012',
      especialidad: 'Educación Física',
      nivel: 'primaria',
      seccion: 'A',
      fechaContratacion: '2019-04-12',
      activo: true
    },
    {
      id: '7',
      nombres: 'Sofía',
      apellidos: 'Herrera Castro',
      cedulaIdentidad: 'V-78901234',
      email: 'sofia.h@colegio.com',
      telefono: '0416-7890123',
      especialidad: 'Química',
      nivel: 'media',
      seccion: 'C',
      fechaContratacion: '2021-09-01',
      activo: true
    },
    {
      id: '8',
      nombres: 'Diego',
      apellidos: 'Vargas Rojas',
      cedulaIdentidad: 'V-89012345',
      email: 'diego.v@colegio.com',
      telefono: '0424-8901234',
      especialidad: 'Arte',
      nivel: 'inicial',
      seccion: 'B',
      fechaContratacion: '2022-01-10',
      activo: true
    },
    {
      id: '9',
      nombres: 'Elena',
      apellidos: 'Martínez Sánchez',
      cedulaIdentidad: 'V-90123456',
      email: 'elena.m@colegio.com',
      telefono: '0412-9012345',
      especialidad: 'Inglés',
      nivel: 'media',
      seccion: 'A',
      fechaContratacion: '2020-10-15',
      activo: true
    }
  ]);

  const niveles = [
    { id: 'inicial', nombre: 'Educacion Inicial' },
    { id: 'primaria', nombre: 'Educacion Primaria' },
    { id: 'media', nombre: 'Educacion Media' }
  ];

  const especialidadesUnicas = useMemo(() => {
    const especialidades = new Set<string>();
    docentes.forEach(doc => {
      if (doc.especialidad) {
        especialidades.add(doc.especialidad);
      }
    });
    return Array.from(especialidades).sort();
  }, [docentes]);

  const secciones = ['A', 'B', 'C', 'D', 'E'];

  const docentesFiltrados = useMemo(() => {
    let filtered = docentes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.nombres.toLowerCase().includes(term) ||
          d.apellidos.toLowerCase().includes(term) ||
          d.cedulaIdentidad.toLowerCase().includes(term) ||
          d.email.toLowerCase().includes(term) ||
          `${d.nombres} ${d.apellidos}`.toLowerCase().includes(term)
      );
    }

    if (filtroNivel) {
      filtered = filtered.filter((d) => d.nivel === filtroNivel);
    }

    if (filtroEspecialidad) {
      filtered = filtered.filter((d) => d.especialidad === filtroEspecialidad);
    }

    if (filtroSeccion) {
      filtered = filtered.filter((d) => d.seccion === filtroSeccion);
    }

    return filtered;
  }, [docentes, searchTerm, filtroNivel, filtroEspecialidad, filtroSeccion]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroNivel('');
    setFiltroEspecialidad('');
    setFiltroSeccion('');
  };

  const tieneFiltrosActivos = searchTerm || filtroNivel || filtroEspecialidad || filtroSeccion;

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingContainerStyle}>
          <div style={loadingSpinnerStyle}></div>
          <p style={loadingTextStyle}>Cargando docentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={overlayStyle} />
      
      <nav style={navStyle}>
        <button onClick={() => router.push('/inicio')} style={backButtonStyle}>
          ← Volver al Inicio
        </button>
        <div style={navTitleStyle}>LISTA DE DOCENTES</div>
        <div style={navBadgeStyle}>
          {docentes.length} docentes
        </div>
      </nav>

      <main style={mainStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={headerContentStyle}>
              <h1 style={titleStyle}>Gestion de Docentes</h1>
              <p style={subtitleStyle}>
                Total: {docentes.length} docentes registrados
              </p>
            </div>
          </div>

          <div style={cardBodyStyle}>
            <div style={filtrosContainerStyle}>
              <div style={searchContainerStyle}>
                <div style={searchWrapperStyle}>
                  <span style={searchIconStyle}>🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, cedula o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={searchInputStyle}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      style={clearSearchButtonStyle}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div style={searchHintStyle}>
                  {searchTerm && (
                    <span>
                      Resultados para: <strong>"{searchTerm}"</strong>
                    </span>
                  )}
                </div>
              </div>

              <div style={filtrosGridStyle}>
                <select
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todos los niveles</option>
                  {niveles.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroEspecialidad}
                  onChange={(e) => setFiltroEspecialidad(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todas las especialidades</option>
                  {especialidadesUnicas.map((especialidad) => (
                    <option key={especialidad} value={especialidad}>
                      {especialidad}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroSeccion}
                  onChange={(e) => setFiltroSeccion(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Todas las secciones</option>
                  {secciones.map((seccion) => (
                    <option key={seccion} value={seccion}>
                      Seccion {seccion}
                    </option>
                  ))}
                </select>

                {tieneFiltrosActivos && (
                  <button onClick={limpiarFiltros} style={limpiarButtonStyle}>
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div style={resultadosInfoStyle}>
                Mostrando {docentesFiltrados.length} de {docentes.length} docentes
                {docentesFiltrados.length !== docentes.length && 
                  ` (filtrados de ${docentes.length} totales)`
                }
              </div>
            </div>

            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={tableHeaderStyle}>Cedula</th>
                    <th style={tableHeaderStyle}>Nombres</th>
                    <th style={tableHeaderStyle}>Apellidos</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Telefono</th>
                    <th style={tableHeaderStyle}>Especialidad</th>
                    <th style={tableHeaderStyle}>Nivel</th>
                    <th style={tableHeaderStyle}>Seccion</th>
                    <th style={tableHeaderStyle}>Contratacion</th>
                    <th style={tableHeaderStyle}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {docentesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={emptyStateStyle}>
                        {searchTerm ? (
                          <>
                            No se encontraron docentes con el criterio de búsqueda: <strong>"{searchTerm}"</strong>
                            <br />
                            <button 
                              onClick={() => setSearchTerm('')}
                              style={emptyStateButtonStyle}
                            >
                              Limpiar búsqueda
                            </button>
                          </>
                        ) : (
                          'No se encontraron docentes con los filtros aplicados'
                        )}
                      </td>
                    </tr>
                  ) : (
                    docentesFiltrados.map((docente) => {
                      const nombreCompleto = `${docente.nombres} ${docente.apellidos}`;
                      const resaltarBusqueda = searchTerm && 
                        nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      return (
                        <tr key={docente.id} style={{
                          ...tableRowStyle,
                          background: resaltarBusqueda ? 'rgba(0,187,126,0.05)' : 'transparent'
                        }}>
                          <td style={tableCellStyle}>
                            <span style={cedulaHighlightStyle}>
                              {docente.cedulaIdentidad}
                            </span>
                          </td>
                          <td style={tableCellStyle}>{docente.nombres}</td>
                          <td style={tableCellStyle}>{docente.apellidos}</td>
                          <td style={tableCellStyle}>
                            <span style={emailTextStyle}>
                              {docente.email}
                            </span>
                          </td>
                          <td style={tableCellStyle}>{docente.telefono}</td>
                          <td style={tableCellStyle}>
                            <span style={especialidadBadgeStyle}>
                              {docente.especialidad}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            {niveles.find(n => n.id === docente.nivel)?.nombre || '-'}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={seccionBadgeStyle}>
                              {docente.seccion || '-'}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            {formatFecha(docente.fechaContratacion)}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{
                              ...estadoBadgeStyle,
                              background: docente.activo ? 'rgba(0,187,126,0.15)' : 'rgba(156,163,175,0.1)',
                              color: docente.activo ? PALETTE.principal : '#9ca3af'
                            }}>
                              {docente.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

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

const cardHeaderStyle: React.CSSProperties = {
  padding: '2rem 2.5rem',
  background: 'rgba(0,187,126,0.05)',
  borderBottom: '1px solid rgba(255,255,255,0.05)'
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

const searchHintStyle: React.CSSProperties = {
  color: PALETTE.textGray,
  fontSize: '0.85rem',
  paddingLeft: '0.5rem'
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

const especialidadBadgeStyle: React.CSSProperties = {
  background: 'rgba(0,187,126,0.1)',
  color: PALETTE.principal,
  padding: '0.25rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: '600',
  display: 'inline-block'
};

const seccionBadgeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  color: PALETTE.white,
  padding: '0.25rem 0.75rem',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: '600',
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
  fontSize: '1rem',
  lineHeight: '2'
};

const emptyStateButtonStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '0.5rem 1.5rem',
  background: 'rgba(0,187,126,0.15)',
  border: '1px solid ' + PALETTE.principal,
  borderRadius: '10px',
  color: PALETTE.principal,
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'background 0.3s'
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

export default EditTeachersListPage;