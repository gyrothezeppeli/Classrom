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
        descripcion: 'Resolver páginas 45-48 del libro de texto. Incluir todos los procedimientos.',
        fechaEntrega: '2026-08-25',
        estado: 'pendiente'
      },
      {
        id: 't2',
        titulo: 'Proyecto de geometría',
        descripcion: 'Construir un modelo 3D de un poliedro regular (cubo, tetraedro o dodecaedro).',
        fechaEntrega: '2026-08-30',
        estado: 'pendiente'
      }
    ],
    avisos: [
      {
        id: 'a1',
        titulo: 'Evaluación de trigonometría',
        mensaje: 'Evaluación escrita de trigonometría este viernes 28 de agosto. Traer calculadora científica.',
        fecha: '2026-08-20',
        prioridad: 'alta'
      },
      {
        id: 'a2',
        titulo: 'Clase de repaso',
        mensaje: 'Clase de repaso el miércoles 26 de agosto a las 3:00 PM en el aula 301.',
        fecha: '2026-08-19',
        prioridad: 'media'
      }
    ],
    materiales: [
      {
        id: 'm1',
        nombre: 'Libro de texto',
        descripcion: 'Matemáticas 8vo grado - Editorial Santillana',
        paraClase: true
      },
      {
        id: 'm2',
        nombre: 'Calculadora científica',
        descripcion: 'Modelo CASIO fx-991 o similar',
        paraClase: true
      },
      {
        id: 'm3',
        nombre: 'Cuaderno de ejercicios',
        descripcion: 'Cuaderno de 100 hojas cuadriculadas (tamaño carta)',
        paraClase: true
      },
      {
        id: 'm4',
        nombre: 'Juego de geometría',
        descripcion: 'Compás, regla, transportador y escuadras',
        paraClase: false
      }
    ],
    planEvaluacion: [
      {
        id: 'e1',
        tipo: 'Evaluación Escrita',
        porcentaje: 30,
        fecha: '2026-08-28',
        descripcion: 'Evaluación de trigonometría y álgebra (Capítulos 5-7)',
        nota: 17
      },
      {
        id: 'e2',
        tipo: 'Proyecto',
        porcentaje: 25,
        fecha: '2026-09-05',
        descripcion: 'Proyecto de geometría en 3D (modelo y exposición)',
      },
      {
        id: 'e3',
        tipo: 'Tareas',
        porcentaje: 25,
        fecha: '2026-09-10',
        descripcion: 'Revisión de tareas y ejercicios del cuaderno',
      },
      {
        id: 'e4',
        tipo: 'Participación',
        porcentaje: 20,
        fecha: '2026-09-15',
        descripcion: 'Participación en clase, actividades y resolución de problemas',
      }
    ]
  },
  {
    id: 'mat-002',
    nombre: 'Lengua y Literatura',
    profesor: 'Carlos Méndez',
    horario: 'Mar-Jue 10:00-11:30',
    aula: '205',
    color: '#8b5cf6',
    tareasPendientes: [
      {
        id: 't4',
        titulo: 'Análisis literario',
        descripcion: 'Analizar el capítulo 5 de "Cien años de soledad". Extensión: 2 páginas.',
        fechaEntrega: '2026-08-22',
        estado: 'vencido'
      },
      {
        id: 't5',
        titulo: 'Ensayo de opinión',
        descripcion: 'Escribir un ensayo sobre el realismo mágico en la literatura latinoamericana.',
        fechaEntrega: '2026-09-01',
        estado: 'pendiente'
      }
    ],
    avisos: [
      {
        id: 'a3',
        titulo: 'Lectura obligatoria',
        mensaje: 'Traer el libro "Cien años de soledad" para la clase del jueves. Iniciaremos el análisis del capítulo 6.',
        fecha: '2026-08-19',
        prioridad: 'media'
      },
      {
        id: 'a4',
        titulo: 'Teatro escolar',
        mensaje: 'Se invita a todos los estudiantes a participar en la obra de teatro escolar. Pruebas el lunes 31/08.',
        fecha: '2026-08-18',
        prioridad: 'baja'
      }
    ],
    materiales: [
      {
        id: 'm5',
        nombre: 'Libro de lectura',
        descripcion: '"Cien años de soledad" - Gabriel García Márquez',
        paraClase: true
      },
      {
        id: 'm6',
        nombre: 'Cuaderno de literatura',
        descripcion: 'Cuaderno de 100 hojas rayadas',
        paraClase: true
      },
      {
        id: 'm7',
        nombre: 'Diccionario',
        descripcion: 'Diccionario de la lengua española (opcional)',
        paraClase: false
      }
    ],
    planEvaluacion: [
      {
        id: 'e5',
        tipo: 'Ensayo',
        porcentaje: 30,
        fecha: '2026-09-01',
        descripcion: 'Ensayo sobre el realismo mágico en "Cien años de soledad"',
      },
      {
        id: 'e6',
        tipo: 'Evaluación Escrita',
        porcentaje: 30,
        fecha: '2026-09-08',
        descripcion: 'Evaluación de comprensión lectora y análisis literario',
      },
      {
        id: 'e7',
        tipo: 'Participación',
        porcentaje: 20,
        fecha: '2026-09-15',
        descripcion: 'Participación en debates y actividades de clase',
      },
      {
        id: 'e8',
        tipo: 'Tareas',
        porcentaje: 20,
        fecha: '2026-09-15',
        descripcion: 'Revisión de tareas y trabajos prácticos',
      }
    ]
  },
  {
    id: 'mat-003',
    nombre: 'Ciencias Naturales',
    profesor: 'Ana Rodríguez',
    horario: 'Lun-Mie 13:00-14:30',
    aula: '108',
    color: '#22c55e',
    tareasPendientes: [],
    avisos: [
      {
        id: 'a5',
        titulo: 'Laboratorio de Química',
        mensaje: '¡No olviden traer su bata de laboratorio! Realizaremos prácticas de reacciones químicas.',
        fecha: '2026-08-21',
        prioridad: 'alta'
      },
      {
        id: 'a6',
        titulo: 'Proyecto de ecosistemas',
        mensaje: 'Formar grupos de 4 personas para el proyecto de ecosistemas. Presentación el 15/09.',
        fecha: '2026-08-17',
        prioridad: 'media'
      }
    ],
    materiales: [
      {
        id: 'm8',
        nombre: 'Bata de laboratorio',
        descripcion: 'Bata blanca de manga larga (obligatoria para prácticas)',
        paraClase: true
      },
      {
        id: 'm9',
        nombre: 'Guantes de látex',
        descripcion: 'Guantes desechables para prácticas de laboratorio',
        paraClase: true
      },
      {
        id: 'm10',
        nombre: 'Cuaderno de ciencias',
        descripcion: 'Cuaderno de 100 hojas cuadriculadas',
        paraClase: true
      },
      {
        id: 'm11',
        nombre: 'Lupa de aumento',
        descripcion: 'Lupa de 10x para observación de muestras',
        paraClase: false
      }
    ],
    planEvaluacion: [
      {
        id: 'e9',
        tipo: 'Práctica de Laboratorio',
        porcentaje: 35,
        fecha: '2026-08-27',
        descripcion: 'Práctica sobre reacciones químicas y elaboración de informe',
      },
      {
        id: 'e10',
        tipo: 'Proyecto',
        porcentaje: 30,
        fecha: '2026-09-15',
        descripcion: 'Proyecto de ecosistemas (investigación y presentación)',
      },
      {
        id: 'e11',
        tipo: 'Evaluación Escrita',
        porcentaje: 25,
        fecha: '2026-09-10',
        descripcion: 'Evaluación de química y biología',
      },
      {
        id: 'e12',
        tipo: 'Tareas',
        porcentaje: 10,
        fecha: '2026-09-15',
        descripcion: 'Revisión de tareas y ejercicios',
      }
    ]
  },
  {
    id: 'mat-004',
    nombre: 'Historia de Venezuela',
    profesor: 'Jorge Pérez',
    horario: 'Mar-Jue 14:30-16:00',
    aula: '402',
    color: '#f59e0b',
    tareasPendientes: [
      {
        id: 't6',
        titulo: 'Línea de tiempo',
        descripcion: 'Crear una línea de tiempo de la independencia de Venezuela (1810-1830)',
        fechaEntrega: '2026-08-28',
        estado: 'pendiente'
      },
      {
        id: 't7',
        titulo: 'Biografía de Simón Bolívar',
        descripcion: 'Escribir una biografía de Simón Bolívar destacando su rol en la independencia.',
        fechaEntrega: '2026-09-04',
        estado: 'pendiente'
      }
    ],
    avisos: [
      {
        id: 'a7',
        titulo: 'Visita al Museo',
        mensaje: 'El próximo martes 25/08 realizaremos una visita al Museo de Historia. Traer autorización firmada.',
        fecha: '2026-08-16',
        prioridad: 'alta'
      },
      {
        id: 'a8',
        titulo: 'Película histórica',
        mensaje: 'Veremos la película "Miranda" el jueves 27/08. Discusión en clase posterior.',
        fecha: '2026-08-18',
        prioridad: 'media'
      }
    ],
    materiales: [
      {
        id: 'm12',
        nombre: 'Libro de Historia',
        descripcion: 'Historia de Venezuela - 8vo grado (Editorial Larense)',
        paraClase: true
      },
      {
        id: 'm13',
        nombre: 'Atlas histórico',
        descripcion: 'Atlas de historia de Venezuela (opcional)',
        paraClase: false
      },
      {
        id: 'm14',
        nombre: 'Cuaderno de historia',
        descripcion: 'Cuaderno de 100 hojas rayadas',
        paraClase: true
      }
    ],
    planEvaluacion: [
      {
        id: 'e13',
        tipo: 'Evaluación Escrita',
        porcentaje: 30,
        fecha: '2026-08-29',
        descripcion: 'Evaluación de la independencia y Simón Bolívar',
      },
      {
        id: 'e14',
        tipo: 'Proyecto',
        porcentaje: 25,
        fecha: '2026-09-08',
        descripcion: 'Línea de tiempo histórica (presentación visual)',
      },
      {
        id: 'e15',
        tipo: 'Participación',
        porcentaje: 20,
        fecha: '2026-09-15',
        descripcion: 'Participación en visitas guiadas y actividades',
      },
      {
        id: 'e16',
        tipo: 'Tareas',
        porcentaje: 25,
        fecha: '2026-09-15',
        descripcion: 'Tareas y trabajos de investigación',
      }
    ]
  },
  {
    id: 'mat-005',
    nombre: 'Inglés',
    profesor: 'Susan Martínez',
    horario: 'Vie 10:00-11:30',
    aula: '103',
    color: '#ec4899',
    tareasPendientes: [
      {
        id: 't8',
        titulo: 'Verbos irregulares',
        descripcion: 'Estudiar y practicar 20 verbos irregulares. Completar ejercicios del libro páginas 78-80.',
        fechaEntrega: '2026-08-26',
        estado: 'pendiente'
      }
    ],
    avisos: [
      {
        id: 'a9',
        titulo: 'Speaking Test',
        mensaje: 'Speaking test individual la próxima semana. Preparar una presentación de 3 minutos sobre tu familia.',
        fecha: '2026-08-21',
        prioridad: 'alta'
      }
    ],
    materiales: [
      {
        id: 'm15',
        nombre: 'Libro de Inglés',
        descripcion: 'English for Everyone - Nivel B1',
        paraClase: true
      },
      {
        id: 'm16',
        nombre: 'Audífonos',
        descripcion: 'Audífonos para prácticas de listening (obligatorios)',
        paraClase: true
      },
      {
        id: 'm17',
        nombre: 'Diccionario Inglés-Español',
        descripcion: 'Diccionario bilingüe (opcional)',
        paraClase: false
      }
    ],
    planEvaluacion: [
      {
        id: 'e17',
        tipo: 'Speaking Test',
        porcentaje: 25,
        fecha: '2026-08-29',
        descripcion: 'Presentación oral sobre la familia',
      },
      {
        id: 'e18',
        tipo: 'Listening Test',
        porcentaje: 25,
        fecha: '2026-09-05',
        descripcion: 'Evaluación de comprensión auditiva',
      },
      {
        id: 'e19',
        tipo: 'Evaluación Escrita',
        porcentaje: 30,
        fecha: '2026-09-12',
        descripcion: 'Evaluación de gramática y vocabulario',
      },
      {
        id: 'e20',
        tipo: 'Tareas',
        porcentaje: 20,
        fecha: '2026-09-15',
        descripcion: 'Tareas y ejercicios del libro',
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

  const isMobile = isMounted ? width < 768 : false;

  useEffect(() => {
    const cargarDatosEstudiante = async () => {
      if (status === 'loading') return;
      
      if (!session?.user) {
        router.push('/');
        return;
      }

      const userId = session.user.id;
      
      if (!userId) {
        console.error('❌ No se encontró userId en la sesión');
        setError('Error: No se pudo identificar al usuario.');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando estudiante para userId:', userId);
        
        const response = await fetch(`/api/estudiantes/usuario/${userId}`);
        
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
          setError('No tienes un perfil de estudiante registrado.');
        } else {
          const errorText = await response.text();
          console.error('❌ Error al cargar estudiante:', errorText);
          setError('Error al cargar los datos del estudiante.');
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del estudiante:', error);
        setError('Error de conexión.');
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
          <h2 style={{ color: 'white', marginBottom: '15px' }}>No se encontró tu perfil</h2>
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