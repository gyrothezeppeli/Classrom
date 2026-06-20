"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af'
};

const EditTasksPage: React.FC = () => {
  const [nivelSeleccionado, setNivelSeleccionado] = useState('media');
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState('');
  const [tarea, setTarea] = useState({ titulo: '', descripcion: '', fecha: '' });

  const niveles = [
    { id: 'inicial', nombre: 'Educación Inicial' },
    { id: 'primaria', nombre: 'Educación Primaria' },
    { id: 'media', nombre: 'Educación Media' }
  ];

  // Configuración de grados por nivel
  const gradosPorNivel = {
    inicial: [
      { id: 'prekinder', nombre: 'Pre-Kínder', secciones: ['A', 'B', 'C'] },
      { id: 'kinder', nombre: 'Kínder', secciones: ['A', 'B', 'C'] },
      { id: 'preparatorio', nombre: 'Preparatorio', secciones: ['A', 'B'] }
    ],
    primaria: [
      { id: '1ro', nombre: '1er Grado', secciones: ['A', 'B', 'C', 'D'] },
      { id: '2do', nombre: '2do Grado', secciones: ['A', 'B', 'C', 'D'] },
      { id: '3ro', nombre: '3er Grado', secciones: ['A', 'B', 'C'] },
      { id: '4to', nombre: '4to Grado', secciones: ['A', 'B', 'C'] },
      { id: '5to', nombre: '5to Grado', secciones: ['A', 'B', 'C'] },
      { id: '6to', nombre: '6to Grado', secciones: ['A', 'B', 'C'] }
    ],
    media: [
      { id: '1ro', nombre: '1er Año', secciones: ['A', 'B', 'C', 'D'] },
      { id: '2do', nombre: '2do Año', secciones: ['A', 'B', 'C', 'D'] },
      { id: '3ro', nombre: '3er Año', secciones: ['A', 'B', 'C'] },
      { id: '4to', nombre: '4to Año', secciones: ['A', 'B', 'C'] },
      { id: '5to', nombre: '5to Año', secciones: ['A', 'B'] }
    ]
  };

  const gradosActuales = gradosPorNivel[nivelSeleccionado as keyof typeof gradosPorNivel] || [];
  
  const seccionesActuales = gradoSeleccionado 
    ? gradosActuales.find(g => g.id === gradoSeleccionado)?.secciones || []
    : [];

  const handleNivelChange = (nivelId: string) => {
    setNivelSeleccionado(nivelId);
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
  };

  const handlePublicar = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradoSeleccionado) {
      alert('Por favor seleccione un grado/año');
      return;
    }
    
    if (!seccionSeleccionada) {
      alert('Por favor seleccione una sección');
      return;
    }
    
    const nivelNombre = niveles.find(n => n.id === nivelSeleccionado)?.nombre;
    const gradoNombre = gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre;
    
    console.log(`Publicando en ${nivelNombre} - ${gradoNombre} - Sección ${seccionSeleccionada}:`, tarea);
    alert(`✅ Contenido publicado exitosamente en:\n${nivelNombre}\n${gradoNombre}\nSección ${seccionSeleccionada}`);
    
    // Resetear formulario después de publicar
    setTarea({ titulo: '', descripcion: '', fecha: '' });
  };

  return (
    <div style={{ 
      fontFamily: "'Montserrat', sans-serif", 
      minHeight: '100vh', 
      color: 'white',
      paddingBottom: '50px',
      position: 'relative',
      background: `url('/assets/img/fondo2.gif') center/cover no-repeat fixed`,
      zIndex: 0
    }}>
      {/* Overlay para mejorar legibilidad */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(26, 46, 38, 0.85)',
        zIndex: -1
      }} />
      
      {/* Navegación Simple */}
      <nav style={{ padding: '2rem 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1rem' }}>
          ← Volver al Portal
        </Link>
        <div style={{ color: PALETTE.principal, fontWeight: '800', letterSpacing: '1px' }}>
          EDITOR DE CONTENIDO
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '10px' }}>GESTIÓN DE TAREAS</h1>
          <p style={{ color: PALETTE.textGray, fontSize: '1.1rem' }}>
            Actualiza las actividades académicas para los estudiantes de la institución.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
          
          {/* Formulario de Edición */}
          <section style={glassCardStyle}>
            <form onSubmit={handlePublicar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Título de la Actividad</label>
                <input 
                  type="text" 
                  placeholder="Ej: Análisis Literario - El Coronel no tiene quien le escriba" 
                  style={inputStyle}
                  value={tarea.titulo}
                  onChange={(e) => setTarea({...tarea, titulo: e.target.value})}
                  required 
                />
              </div>

              <div>
                <label style={labelStyle}>Instrucciones detalladas</label>
                <textarea 
                  placeholder="Indique los objetivos, bibliografía y pasos a seguir..." 
                  style={{ ...inputStyle, minHeight: '180px', resize: 'vertical' }}
                  value={tarea.descripcion}
                  onChange={(e) => setTarea({...tarea, descripcion: e.target.value})}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Fecha Límite</label>
                  <input 
                    type="date" 
                    style={inputStyle} 
                    value={tarea.fecha}
                    onChange={(e) => setTarea({...tarea, fecha: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Material de apoyo</label>
                  <input type="file" style={{ ...inputStyle, padding: '10px' }} />
                </div>
              </div>

              <button type="submit" style={publishButtonStyle}>
                📤 PUBLICAR TAREA
              </button>
            </form>
          </section>

          {/* Selector de Nivel, Grado y Sección */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Selector de Nivel */}
            <div style={selectorCardStyle}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                📚 Nivel de Publicación
              </h3>
              {niveles.map((nivel) => (
                <div 
                  key={nivel.id}
                  onClick={() => handleNivelChange(nivel.id)}
                  style={{
                    ...levelCardStyle,
                    border: nivelSeleccionado === nivel.id ? `2px solid ${PALETTE.principal}` : '1px solid rgba(255,255,255,0.1)',
                    background: nivelSeleccionado === nivel.id ? 'rgba(0,187,126,0.15)' : 'rgba(0,0,0,0.3)',
                  }}
                >
                  <span style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: '700', 
                    color: nivelSeleccionado === nivel.id ? PALETTE.principal : 'white' 
                  }}>
                    {nivel.nombre}
                  </span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    {nivel.id === 'inicial' ? 'Preescolar' : nivel.id === 'primaria' ? '1° a 6° Grado' : '1° a 5° Año'}
                  </span>
                </div>
              ))}
            </div>

            {/* Selector de Grado/Año */}
            {gradosActuales.length > 0 && (
              <div style={selectorCardStyle}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                  🎓 Grado / Año
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {gradosActuales.map((grado) => (
                    <div
                      key={grado.id}
                      onClick={() => {
                        setGradoSeleccionado(grado.id);
                        setSeccionSeleccionada('');
                      }}
                      style={{
                        ...optionCardStyle,
                        background: gradoSeleccionado === grado.id ? 'rgba(0,187,126,0.15)' : 'rgba(0,0,0,0.3)',
                        border: gradoSeleccionado === grado.id ? `1px solid ${PALETTE.principal}` : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{grado.nombre}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{grado.secciones.length} secciones</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Sección */}
            {seccionesActuales.length > 0 && (
              <div style={selectorCardStyle}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                  👥 Sección
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
                  {seccionesActuales.map((seccion) => (
                    <div
                      key={seccion}
                      onClick={() => setSeccionSeleccionada(seccion)}
                      style={{
                        ...seccionButtonStyle,
                        background: seccionSeleccionada === seccion ? PALETTE.principal : 'rgba(0,0,0,0.3)',
                        color: seccionSeleccionada === seccion ? '#1a2e26' : 'white',
                        border: seccionSeleccionada === seccion ? `1px solid ${PALETTE.principal}` : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {seccion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información de publicación actual */}
            {gradoSeleccionado && seccionSeleccionada && (
              <div style={{ 
                marginTop: '10px', 
                padding: '20px', 
                borderRadius: '15px', 
                background: 'rgba(0,187,126,0.1)', 
                border: `1px solid ${PALETTE.principal}` 
              }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: PALETTE.principal, lineHeight: '1.5', textAlign: 'center' }}>
                  <strong>📌 Publicando en:</strong><br />
                  {niveles.find(n => n.id === nivelSeleccionado)?.nombre}<br />
                  {gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre}<br />
                  Sección {seccionSeleccionada}
                </p>
              </div>
            )}

            <div style={{ padding: '20px', borderRadius: '15px', background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#ffcc00', lineHeight: '1.4' }}>
                <strong>⚠️ Nota:</strong> Los cambios realizados aquí se reflejarán inmediatamente en el Portal de Aprendizaje para el grupo específico seleccionado.
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

// Estilos
const glassCardStyle: React.CSSProperties = {
  background: PALETTE.cardBg,
  backdropFilter: 'blur(15px)',
  padding: '40px',
  borderRadius: '30px',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
};

const selectorCardStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  backdropFilter: 'blur(10px)',
  padding: '20px',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.05)'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: '800',
  color: PALETTE.principal,
  marginBottom: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '1.2rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '15px',
  color: 'white',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border 0.3s'
};

const levelCardStyle: React.CSSProperties = {
  padding: '15px',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  transition: 'all 0.3s ease',
  marginBottom: '10px'
};

const optionCardStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '10px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all 0.3s ease'
};

const seccionButtonStyle: React.CSSProperties = {
  padding: '12px 8px',
  borderRadius: '10px',
  cursor: 'pointer',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '1rem',
  transition: 'all 0.3s ease'
};

const publishButtonStyle: React.CSSProperties = {
  marginTop: '15px',
  padding: '20px',
  background: PALETTE.principal,
  border: 'none',
  borderRadius: '15px',
  color: '#1a2e26',
  fontWeight: '900',
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(0, 187, 126, 0.3)',
  transition: 'transform 0.2s, background 0.2s',
  textTransform: 'uppercase'
};

export default EditTasksPage;