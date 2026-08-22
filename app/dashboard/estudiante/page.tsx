"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const PALETTE = {
  sandBorder: '#5c7564',
  darkBanner: 'linear-gradient(160deg, #102d22 0%, #081a14 100%)',
  deepBg: '#1a2e26',
  textLight: '#f3f4f6',
  accent: '#00BB7E',
  glass: 'rgba(255, 255, 255, 0.08)',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e'
};

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'entregado' | 'vencido';
}

interface Aviso {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  prioridad: 'alta' | 'media' | 'baja';
}

interface Material {
  id: string;
  nombre: string;
  descripcion: string;
  paraClase: boolean;
}

interface PlanEvaluacion {
  id: string;
  tipo: string;
  porcentaje: number;
  fecha: string;
  descripcion: string;
  nota?: number;
}

interface Materia {
  id: string;
  nombre: string;
  profesor: string;
  horario: string;
  aula: string;
  color: string;
  tareasPendientes: Tarea[];
  avisos: Aviso[];
  materiales: Material[];
  planEvaluacion: PlanEvaluacion[];
}

interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  seccion: string;
  cedula: string;
  correo: string;
  materias: Materia[];
}

const MATERIAS_EJEMPLO: Materia[] = [
  {
    id: 'mat-001',
    nombre: 'Matemáticas',
    profesor: 'María González',
    horario: 'Lun-Mie-Vie 8:00-9:30',
    aula: '301',
    color: '#3b82f6',
    tareasPendientes: [
      {
        id: 't1',
        titulo: 'Ejercicios de álgebra',
        descripcion: 'Resolver páginas 45-48 del libro de texto.',
        fechaEntrega: '2026-08-25',
        estado: 'pendiente'
      }
    ],
    avisos: [
      {
        id: 'a1',
        titulo: 'Evaluación de trigonometría',
        mensaje: 'Evaluación escrita este viernes 28 de agosto.',
        fecha: '2026-08-20',
        prioridad: 'alta'
      }
    ],
    materiales: [
      {
        id: 'm1',
        nombre: 'Libro de texto',
        descripcion: 'Matemáticas 8vo grado',
        paraClase: true
      }
    ],
    planEvaluacion: [
      {
        id: 'e1',
        tipo: 'Evaluación Escrita',
        porcentaje: 30,
        fecha: '2026-08-28',
        descripcion: 'Evaluación de trigonometría y álgebra'
      }
    ]
  }
];

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 1024,
    height: 768,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { ...windowSize, isMounted };
};

const MateriaDetalle: React.FC<{
  materia: Materia | null;
  onClose: () => void;
}> = ({ materia, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tareas' | 'avisos' | 'materiales' | 'evaluacion'>('tareas');

  if (!materia) return null;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return PALETTE.warning;
      case 'entregado': return PALETTE.success;
      case 'vencido': return PALETTE.danger;
      default: return '#9ca3af';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'PENDIENTE';
      case 'entregado': return 'ENTREGADO';
      case 'vencido': return 'VENCIDO';
      default: return estado.toUpperCase();
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return PALETTE.danger;
      case 'media': return PALETTE.warning;
      case 'baja': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out',
      backdropFilter: 'blur(8px)'
    }} onClick={onClose}>
      <div style={{
        background: '#1a2e26',
        borderRadius: '30px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: `2px solid ${materia.color}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '25px 30px',
          background: `linear-gradient(135deg, #102d22, ${materia.color}33)`,
          borderBottom: `2px solid ${materia.color}44`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: materia.color,
                  boxShadow: `0 0 20px ${materia.color}66`
                }} />
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.8rem' }}>{materia.nombre}</h2>
              </div>
              <p style={{ color: '#9ca3af', margin: '5px 0 0 12px' }}>
                {materia.profesor}  {materia.horario}  Aula {materia.aula}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '5px',
          padding: '15px 20px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'tareas', label: 'Tareas', count: materia.tareasPendientes.length },
            { key: 'avisos', label: 'Avisos', count: materia.avisos.length },
            { key: 'materiales', label: 'Materiales', count: materia.materiales.length },
            { key: 'evaluacion', label: 'Evaluación', count: materia.planEvaluacion.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.key ? materia.color : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.key ? '#081a14' : 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.key ? '#081a14' : 'rgba(255,255,255,0.2)',
                  color: activeTab === tab.key ? 'white' : '#9ca3af',
                  borderRadius: '50%',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{
          padding: '25px 30px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 200px)'
        }}>
          {activeTab === 'tareas' && (
            <div>
              {materia.tareasPendientes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>No hay tareas pendientes</p>
                  <p style={{ fontSize: '0.9rem', margin: '5px 0 0 0', opacity: 0.7 }}>Estás al día en esta materia</p>
                </div>
              ) : (
                materia.tareasPendientes.map(tarea => (
                  <div key={tarea.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '15px',
                    padding: '18px 20px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${getEstadoColor(tarea.estado)}`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ color: 'white', margin: 0 }}>{tarea.titulo}</h4>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        background: getEstadoColor(tarea.estado),
                        color: 'white',
                        whiteSpace: 'nowrap',
                        marginLeft: '10px'
                      }}>
                        {getEstadoLabel(tarea.estado)}
                      </span>
                    </div>
                    <p style={{ color: '#d1d5db', margin: '10px 0 5px 0', lineHeight: '1.5' }}>
                      {tarea.descripcion}
                    </p>
                    <p style={{ 
                      color: tarea.estado === 'vencido' ? PALETTE.danger : '#9ca3af', 
                      fontSize: '0.85rem', 
                      margin: 0 
                    }}>
                      {new Date(tarea.fechaEntrega).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {tarea.estado === 'vencido' && '  Fecha vencida'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'avisos' && (
            <div>
              {materia.avisos.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>No hay avisos recientes</p>
                </div>
              ) : (
                materia.avisos.map(aviso => (
                  <div key={aviso.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '15px',
                    padding: '18px 20px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${getPrioridadColor(aviso.prioridad)}`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: 'white', margin: 0 }}>{aviso.titulo}</h4>
                      <span style={{
                        padding: '2px 12px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        background: getPrioridadColor(aviso.prioridad),
                        color: 'white',
                        textTransform: 'uppercase'
                      }}>
                        {aviso.prioridad}
                      </span>
                    </div>
                    <p style={{ color: '#d1d5db', margin: '10px 0 5px 0', lineHeight: '1.5' }}>
                      {aviso.mensaje}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0 }}>
                      {new Date(aviso.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'materiales' && (
            <div>
              {materia.materiales.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>No hay materiales listados</p>
                </div>
              ) : (
                <>
                  <h4 style={{ 
                    color: PALETTE.accent, 
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Materiales para llevar a clase
                  </h4>
                  {materia.materiales.filter(m => m.paraClase).length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '10px' }}>
                      No hay materiales requeridos para clase
                    </p>
                  ) : (
                    materia.materiales.filter(m => m.paraClase).map(material => (
                      <div key={material.id} style={{
                        background: `linear-gradient(135deg, ${materia.color}15, rgba(255,255,255,0.03))`,
                        borderRadius: '15px',
                        padding: '15px 20px',
                        marginBottom: '10px',
                        border: `1px solid ${materia.color}44`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}>
                        <h4 style={{ color: 'white', margin: 0 }}>{material.nombre}</h4>
                        <p style={{ color: '#d1d5db', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                          {material.descripcion}
                        </p>
                      </div>
                    ))
                  )}

                  {materia.materiales.filter(m => !m.paraClase).length > 0 && (
                    <>
                      <h4 style={{ 
                        color: '#9ca3af', 
                        marginBottom: '15px', 
                        marginTop: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        Materiales adicionales (opcionales)
                      </h4>
                      {materia.materiales.filter(m => !m.paraClase).map(material => (
                        <div key={material.id} style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '15px',
                          padding: '15px 20px',
                          marginBottom: '10px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}>
                          <h4 style={{ color: '#d1d5db', margin: 0 }}>{material.nombre}</h4>
                          <p style={{ color: '#9ca3af', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                            {material.descripcion}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'evaluacion' && (
            <div>
              {materia.planEvaluacion.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '1.1rem', margin: 0 }}>No hay plan de evaluación disponible</p>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 0.8fr 0.8fr',
                    gap: '10px',
                    marginBottom: '15px',
                    padding: '12px 15px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    <span>Tipo de Evaluación</span>
                    <span>Fecha</span>
                    <span>%</span>
                    <span>Nota</span>
                  </div>
                  {materia.planEvaluacion.map(item => (
                    <div key={item.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 0.8fr 0.8fr',
                      gap: '10px',
                      padding: '12px 15px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.03)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}>
                      <span style={{ color: 'white', fontWeight: '500' }}>{item.tipo}</span>
                      <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
                        {new Date(item.fecha).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span style={{
                        color: PALETTE.accent,
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        {item.porcentaje}%
                      </span>
                      <span style={{
                        color: item.nota ? '#22c55e' : '#9ca3af',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        {item.nota || '—'}
                      </span>
                    </div>
                  ))}
                  
                  <div style={{
                    marginTop: '20px',
                    padding: '18px 20px',
                    background: `linear-gradient(135deg, ${materia.color}10, rgba(255,255,255,0.02))`,
                    borderRadius: '12px',
                    border: `1px solid ${materia.color}33`
                  }}>
                    <p style={{ 
                      color: '#d1d5db', 
                      margin: 0,
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      <strong style={{ color: 'white' }}>Descripción general:</strong><br />
                      {materia.planEvaluacion[0]?.descripcion || 'Plan de evaluación detallado disponible en clase.'}
                    </p>
                  </div>

                  <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    padding: '15px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Total: <strong style={{ color: 'white' }}>
                        {materia.planEvaluacion.reduce((sum, item) => sum + item.porcentaje, 0)}%
                      </strong>
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Evaluaciones: <strong style={{ color: 'white' }}>
                        {materia.planEvaluacion.length}
                      </strong>
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Con nota: <strong style={{ color: '#22c55e' }}>
                        {materia.planEvaluacion.filter(e => e.nota !== undefined).length}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  color?: string;
}> = ({ label, value, color = PALETTE.accent }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'all 0.3s ease',
    flex: '1',
    minWidth: '120px'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.transform = 'translateY(-3px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
    e.currentTarget.style.transform = 'translateY(0)';
  }}>
    <div style={{ 
      fontSize: '1.8rem', 
      fontWeight: 'bold', 
      color: color 
    }}>
      {value}
    </div>
    <div style={{ 
      color: '#9ca3af', 
      fontSize: '0.85rem',
      fontWeight: '500'
    }}>
      {label}
    </div>
  </div>
);

const MateriaGrid: React.FC<{
  materias: Materia[];
  onSelectMateria: (materia: Materia) => void;
}> = ({ materias, onSelectMateria }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getEstadoColor = (tareas: Tarea[]) => {
    const pendientes = tareas.filter(t => t.estado === 'pendiente');
    const vencidas = tareas.filter(t => t.estado === 'vencido');
    if (vencidas.length > 0) return PALETTE.danger;
    if (pendientes.length > 0) return PALETTE.warning;
    return PALETTE.success;
  };

  const getEstadoTexto = (tareas: Tarea[]) => {
    const pendientes = tareas.filter(t => t.estado === 'pendiente');
    const vencidas = tareas.filter(t => t.estado === 'vencido');
    if (vencidas.length > 0) return `${vencidas.length} tareas vencidas`;
    if (pendientes.length > 0) return `${pendientes.length} tareas pendientes`;
    return 'Al día';
  };

  const getEstadoIcon = (tareas: Tarea[]) => {
    const pendientes = tareas.filter(t => t.estado === 'pendiente');
    const vencidas = tareas.filter(t => t.estado === 'vencido');
    if (vencidas.length > 0) return '⚠';
    if (pendientes.length > 0) return '⏳';
    return '✓';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      width: '100%'
    }}>
      {materias.map(materia => (
        <div
          key={materia.id}
          onClick={() => onSelectMateria(materia)}
          onMouseEnter={() => setHoveredId(materia.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '20px',
            padding: '22px',
            border: `2px solid ${hoveredId === materia.id ? materia.color : 'rgba(255,255,255,0.06)'}`,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hoveredId === materia.id ? 'translateY(-6px)' : 'translateY(0)',
            boxShadow: hoveredId === materia.id ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: materia.color,
            boxShadow: `0 0 20px ${materia.color}44`
          }} />

          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: getEstadoColor(materia.tareasPendientes)
          }}>
            <span>{getEstadoIcon(materia.tareasPendientes)}</span>
          </div>

          <div style={{ marginTop: '8px' }}>
            <h3 style={{
              color: 'white',
              margin: '0 0 4px 0',
              fontSize: '1.2rem',
              paddingRight: '40px'
            }}>
              {materia.nombre}
            </h3>
            <p style={{
              color: '#9ca3af',
              margin: '0 0 12px 0',
              fontSize: '0.85rem'
            }}>
              {materia.profesor}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '14px'
          }}>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: '#d1d5db'
            }}>
              {materia.horario}
            </span>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: '#d1d5db'
            }}>
              Aula {materia.aula}
            </span>
            <span style={{
              padding: '3px 10px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              fontSize: '0.7rem',
              color: '#d1d5db'
            }}>
              {materia.avisos.length} avisos
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{
              color: getEstadoColor(materia.tareasPendientes),
              fontWeight: '600',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {getEstadoTexto(materia.tareasPendientes)}
            </span>
            <span style={{
              color: '#6b7280',
              fontSize: '0.75rem'
            }}>
              {materia.planEvaluacion.length} evaluaciones
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const EstudianteDashboard: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { width, isMounted } = useWindowSize();
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentandoCrear, setIntentandoCrear] = useState(false);

  const isMobile = isMounted ? width < 768 : false;

  useEffect(() => {
    const cargarDatosEstudiante = async () => {
      if (status === 'loading') return;
      
      if (!session?.user) {
        router.push('/');
        return;
      }

      try {
        // Obtener el userId de la sesión o usar el email como fallback
        const userId = session.user.id;
        const email = session.user.email;
        
        console.log('🔍 Datos de sesión:', { userId, email, rol: session.user.rol });
        
        // Intentar buscar por userId primero
        let response;
        let identificador = userId;
        
        if (userId) {
          console.log(`🔍 Buscando estudiante para userId: ${userId}`);
          response = await fetch(`/api/estudiantes/usuario/${userId}`);
        } else {
          // Si no hay userId, buscar por email
          console.log(`🔍 Buscando estudiante para email: ${email}`);
          response = await fetch(`/api/estudiantes/email/${encodeURIComponent(email)}`);
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Estudiante encontrado:', data);
          
          const estudianteConMaterias = {
            ...data,
            materias: MATERIAS_EJEMPLO
          };
          
          setEstudiante(estudianteConMaterias);
          setError(null);
        } else if (response.status === 404) {
          console.warn('⚠️ Estudiante no encontrado');
          
          // Si el usuario es estudiante, intentar crearlo automáticamente
          if (session.user.rol === 'estudiante' && !intentandoCrear) {
            setIntentandoCrear(true);
            console.log('🔄 Intentando crear estudiante automáticamente...');
            
            const nombreCompleto = session.user.nombre || 'Usuario Estudiante';
            const nombres = nombreCompleto.split(' ')[0] || 'Usuario';
            const apellidos = nombreCompleto.split(' ').slice(1).join(' ') || 'Estudiante';
            
            // Obtener el userId desde la sesión o buscarlo
            let userIdParaCrear = session.user.id;
            
            // Si no hay userId, intentar obtenerlo del email
            if (!userIdParaCrear) {
              try {
                const userResponse = await fetch(`/api/auth/session`);
                const sessionData = await userResponse.json();
                userIdParaCrear = sessionData?.user?.id;
                console.log('📌 userId obtenido de session:', userIdParaCrear);
              } catch (e) {
                console.error('❌ Error al obtener userId:', e);
              }
            }
            
            const estudianteData = {
              nombres: nombres,
              apellidos: apellidos,
              cedulaIdentidad: `V-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`,
              fechaNacimiento: new Date().toISOString().split('T')[0],
              edad: '',
              sexo: '',
              nivel: 'primaria',
              grado: '1er Grado',
              seccion: 'A',
              numeroTelefonoCelular: '',
              correoElectronico: session.user.email,
              userId: userIdParaCrear || session.user.email // Usar email si no hay userId
            };
            
            console.log('📤 Datos para crear estudiante:', estudianteData);
            
            const createResponse = await fetch('/api/estudiantes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(estudianteData)
            });
            
            setIntentandoCrear(false);
            
            if (createResponse.ok) {
              const nuevoEstudiante = await createResponse.json();
              console.log('✅ Estudiante creado automáticamente:', nuevoEstudiante);
              
              const estudianteConMaterias = {
                id: nuevoEstudiante.id,
                nombre: nuevoEstudiante.nombres,
                apellido: nuevoEstudiante.apellidos,
                grado: nuevoEstudiante.grado || '1er Grado',
                seccion: nuevoEstudiante.seccion || 'A',
                cedula: nuevoEstudiante.cedulaIdentidad,
                correo: nuevoEstudiante.correoElectronico,
                materias: MATERIAS_EJEMPLO
              };
              
              setEstudiante(estudianteConMaterias);
              setError(null);
            } else {
              const errorText = await createResponse.text();
              console.error('❌ Error al crear estudiante automáticamente:', errorText);
              setError('No se pudo crear tu perfil de estudiante automáticamente. Por favor, regístrate desde el formulario.');
            }
          } else {
            setError('No tienes un perfil de estudiante registrado. Por favor, regístrate como estudiante.');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Error al cargar estudiante:', errorText);
          setError('Error al cargar los datos del estudiante.');
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del estudiante:', error);
        setError('Error de conexión. Verifica tu conexión a internet.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosEstudiante();
  }, [session, status, router]);

  const handleLogout = () => {
    router.push('/');
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        background: PALETTE.deepBg,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `4px solid ${PALETTE.accent}33`,
            borderTop: `4px solid ${PALETTE.accent}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        background: PALETTE.deepBg,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: 'white', marginBottom: '15px' }}>No se encontró tu perfil de estudiante</h2>
          <p style={{ color: '#9ca3af', marginBottom: '20px', lineHeight: '1.6' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 25px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Volver al Inicio
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '12px 25px',
                background: PALETTE.danger,
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!estudiante) {
    return (
      <div style={{
        fontFamily: "'Montserrat', sans-serif",
        background: PALETTE.deepBg,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{ color: '#9ca3af', marginBottom: '20px' }}>No se encontraron datos del estudiante</p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 30px',
              background: PALETTE.accent,
              border: 'none',
              borderRadius: '12px',
              color: '#081a14',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const totalTareas = estudiante.materias.reduce(
    (sum, m) => sum + m.tareasPendientes.length, 0
  );
  const tareasPendientes = estudiante.materias.reduce(
    (sum, m) => sum + m.tareasPendientes.filter(t => t.estado === 'pendiente').length, 0
  );
  const tareasVencidas = estudiante.materias.reduce(
    (sum, m) => sum + m.tareasPendientes.filter(t => t.estado === 'vencido').length, 0
  );
  const totalAvisos = estudiante.materias.reduce(
    (sum, m) => sum + m.avisos.length, 0
  );

  return (
    <div style={{
      fontFamily: "'Montserrat', sans-serif",
      background: PALETTE.deepBg,
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        zIndex: 100,
        boxSizing: 'border-box',
        ...(isMobile ? {
          position: 'relative',
          padding: '1rem 5%',
          background: PALETTE.deepBg,
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        } : {
          position: 'sticky',
          top: 0,
          padding: '1rem 8%',
          background: 'rgba(26, 46, 38, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        })
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span style={{
            color: 'white',
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: isMobile ? '0.9rem' : '1.1rem'
          }}>
            Portal Estudiantil
          </span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 16px 6px 12px',
              borderRadius: '30px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${PALETTE.accent}, #00cc88)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#081a14',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {estudiante.nombre[0]}{estudiante.apellido[0]}
              </div>
              <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>
                {estudiante.nombre} {estudiante.apellido}
              </span>
              <span style={{
                color: '#9ca3af',
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 10px',
                borderRadius: '12px'
              }}>
                {estudiante.grado}° {estudiante.seccion}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                borderRadius: '12px',
                padding: '8px 18px',
                fontSize: '0.8rem',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = PALETTE.danger;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = PALETTE.danger;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {isMobile && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 1001,
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              width: '22px',
              height: '2px',
              background: 'white',
              transition: 'all 0.3s ease',
              transform: showMobileMenu ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }} />
            <div style={{
              width: '22px',
              height: '2px',
              background: 'white',
              transition: 'all 0.3s ease',
              opacity: showMobileMenu ? 0 : 1
            }} />
            <div style={{
              width: '22px',
              height: '2px',
              background: 'white',
              transition: 'all 0.3s ease',
              transform: showMobileMenu ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
            }} />
          </button>
        )}
      </nav>

      {isMobile && showMobileMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }} onClick={() => setShowMobileMenu(false)}>
          <div style={{
            background: PALETTE.deepBg,
            padding: '35px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minWidth: '80%',
            border: '1px solid rgba(255,255,255,0.05)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${PALETTE.accent}, #00cc88)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#081a14',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                {estudiante.nombre[0]}{estudiante.apellido[0]}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>
                  {estudiante.nombre} {estudiante.apellido}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  {estudiante.grado}° {estudiante.seccion}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: PALETTE.danger,
                color: 'white',
                textDecoration: 'none',
                fontWeight: 'bold',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                marginTop: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      <header style={{
        padding: isMobile ? '25px 5% 15px' : '35px 8% 20px',
        background: 'linear-gradient(135deg, #102d22, #1a2e26)',
        borderBottom: `1px solid ${PALETTE.sandBorder}33`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '0'
        }}>
          <div>
            <h1 style={{
              color: 'white',
              margin: 0,
              fontSize: isMobile ? '1.5rem' : '2.2rem',
              fontWeight: '800'
            }}>
              Bienvenido, {estudiante.nombre}
            </h1>
            <p style={{
              color: '#9ca3af',
              margin: '5px 0 0 0',
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              {estudiante.grado}° Grado - Sección {estudiante.seccion}  {estudiante.correo}
            </p>
          </div>
        </div>
      </header>

      <section style={{
        padding: isMobile ? '20px 5% 10px' : '25px 8% 15px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '12px'
      }}>
        <StatCard
          label="Materias"
          value={estudiante.materias.length}
          color="#60a5fa"
        />
        <StatCard
          label="Tareas Pendientes"
          value={tareasPendientes}
          color={tareasVencidas > 0 ? PALETTE.danger : PALETTE.warning}
        />
        <StatCard
          label="Avisos"
          value={totalAvisos}
          color="#a78bfa"
        />
        <StatCard
          label="Evaluaciones"
          value={estudiante.materias.reduce((sum, m) => sum + m.planEvaluacion.length, 0)}
          color="#34d399"
        />
      </section>

      <section style={{
        padding: isMobile ? '20px 5% 30px' : '30px 8% 40px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: 'white',
            margin: 0,
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '700'
          }}>
            Mis Materias
          </h2>
          <span style={{
            color: '#9ca3af',
            fontSize: '0.8rem',
            background: 'rgba(255,255,255,0.05)',
            padding: '4px 12px',
            borderRadius: '20px'
          }}>
            {estudiante.materias.length} materias
          </span>
        </div>
        <MateriaGrid
          materias={estudiante.materias}
          onSelectMateria={setSelectedMateria}
        />
      </section>

      <footer style={{
        textAlign: 'center',
        color: '#6b7280',
        padding: isMobile ? '30px 20px' : '40px',
        fontSize: isMobile ? '0.8rem' : '0.95rem',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <p style={{ margin: 0 }}>
          U.E Ciudad Cuatricentenaria 2026  Portal Estudiantil
        </p>
      </footer>

      {selectedMateria && (
        <MateriaDetalle
          materia={selectedMateria}
          onClose={() => setSelectedMateria(null)}
        />
      )}

      {isMobile && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: PALETTE.accent,
            color: '#081a14',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 100,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00cc88';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = PALETTE.accent;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
          }}
        >
          ↑
        </button>
      )}

      <style jsx global>{`
        body { 
          margin: 0; 
          padding: 0; 
          overflow-x: hidden; 
          background: #1a2e26;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        * {
          box-sizing: border-box;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
          borderRadius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PALETTE.accent}66;
          borderRadius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PALETTE.accent};
        }
        
        select, button {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default EstudianteDashboard;