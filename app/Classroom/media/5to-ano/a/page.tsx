"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COLORES = {
  principal: '#00BB7E',
  oscuro: '#102d22',
  acento: '#064E3B',
  sandBorder: '#5c7564',
  deepBg: '#1a2e26',
  darkBanner: 'linear-gradient(160deg, #102d22 0%, #081a14 100%)',
  textLight: '#f3f4f6'
};

// Fijo: 5to año, Sección A
const GRADO = '5to año';
const SECCION = 'A';

const getKey = (): string => `${GRADO}_${SECCION}`;

const ClassroomPage: React.FC = () => {
  const router = useRouter();
  const [seccionActiva, setSeccionActiva] = useState('tareas');

  const [tareas, setTareas] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [guias, setGuias] = useState<any[]>([]);
  const [planEvaluacion, setPlanEvaluacion] = useState<any[]>([]);

  const [nuevaTarea, setNuevaTarea] = useState({ titulo: '', descripcion: '', fechaEntrega: '', materia: '' });
  const [nuevoAviso, setNuevoAviso] = useState({ titulo: '', descripcion: '', fecha: '' });
  const [nuevoMaterial, setNuevoMaterial] = useState({ titulo: '', descripcion: '', enlace: '' });
  const [nuevaGuia, setNuevaGuia] = useState({ titulo: '', descripcion: '', archivo: '' });
  const [nuevoPlan, setNuevoPlan] = useState({ periodo: '', contenido: '', fecha: '' });

  const currentKey = getKey();

  useEffect(() => {
    const cargarDatos = () => {
      const storedTareas = localStorage.getItem(`tareas_${currentKey}`);
      setTareas(storedTareas ? JSON.parse(storedTareas) : []);

      const avisosStored = localStorage.getItem(`avisos_${currentKey}`);
      setAvisos(avisosStored ? JSON.parse(avisosStored) : []);

      const materialesStored = localStorage.getItem(`materiales_${currentKey}`);
      setMateriales(materialesStored ? JSON.parse(materialesStored) : []);

      const guiasStored = localStorage.getItem(`guias_${currentKey}`);
      setGuias(guiasStored ? JSON.parse(guiasStored) : []);

      const planStored = localStorage.getItem(`plan_${currentKey}`);
      setPlanEvaluacion(planStored ? JSON.parse(planStored) : []);
    };
    cargarDatos();
  }, [currentKey]);

  useEffect(() => { localStorage.setItem(`tareas_${currentKey}`, JSON.stringify(tareas)); }, [tareas, currentKey]);
  useEffect(() => { localStorage.setItem(`avisos_${currentKey}`, JSON.stringify(avisos)); }, [avisos, currentKey]);
  useEffect(() => { localStorage.setItem(`materiales_${currentKey}`, JSON.stringify(materiales)); }, [materiales, currentKey]);
  useEffect(() => { localStorage.setItem(`guias_${currentKey}`, JSON.stringify(guias)); }, [guias, currentKey]);
  useEffect(() => { localStorage.setItem(`plan_${currentKey}`, JSON.stringify(planEvaluacion)); }, [planEvaluacion, currentKey]);

  const agregarTarea = () => {
    if (!nuevaTarea.titulo || !nuevaTarea.fechaEntrega) return;
    setTareas([...tareas, { ...nuevaTarea, id: Date.now(), completado: false }]);
    setNuevaTarea({ titulo: '', descripcion: '', fechaEntrega: '', materia: '' });
  };

  const toggleTarea = (id: number) => {
    setTareas(tareas.map(t => t.id === id ? { ...t, completado: !t.completado } : t));
  };

  const agregarAviso = () => {
    if (!nuevoAviso.titulo) return;
    setAvisos([...avisos, { ...nuevoAviso, id: Date.now(), fecha: nuevoAviso.fecha || new Date().toLocaleDateString() }]);
    setNuevoAviso({ titulo: '', descripcion: '', fecha: '' });
  };

  const agregarMaterial = () => {
    if (!nuevoMaterial.titulo) return;
    setMateriales([...materiales, { ...nuevoMaterial, id: Date.now() }]);
    setNuevoMaterial({ titulo: '', descripcion: '', enlace: '' });
  };

  const agregarGuia = () => {
    if (!nuevaGuia.titulo) return;
    setGuias([...guias, { ...nuevaGuia, id: Date.now() }]);
    setNuevaGuia({ titulo: '', descripcion: '', archivo: '' });
  };

  const agregarPlan = () => {
    if (!nuevoPlan.periodo) return;
    setPlanEvaluacion([...planEvaluacion, { ...nuevoPlan, id: Date.now() }]);
    setNuevoPlan({ periodo: '', contenido: '', fecha: '' });
  };

  const eliminarElemento = (id: number, tipo: string) => {
    if (!confirm('¿Seguro que desea eliminar este registro?')) return;
    if (tipo === 'tarea') setTareas(tareas.filter(t => t.id !== id));
    if (tipo === 'aviso') setAvisos(avisos.filter(a => a.id !== id));
    if (tipo === 'material') setMateriales(materiales.filter(m => m.id !== id));
    if (tipo === 'guia') setGuias(guias.filter(g => g.id !== id));
    if (tipo === 'plan') setPlanEvaluacion(planEvaluacion.filter(p => p.id !== id));
  };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: COLORES.deepBg, minHeight: '100vh', color: 'white' }}>
      
      <nav style={{ background: COLORES.darkBanner, padding: '1.5rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORES.sandBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${COLORES.sandBorder}`,
              borderRadius: '10px',
              color: 'white',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: '0.3s',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            ← Regresar al Inicio
          </button>
          <Link href="/" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.2rem' }}>
            U.E Ciudad Cuatricentenaria
          </Link>
        </div>
        <div style={seccionBadgeStyle}>
          {GRADO} - Sección {SECCION}
        </div>
      </nav>

      <header style={{ padding: '4rem 10% 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-2px', margin: 0, textTransform: 'uppercase' }}>
          {GRADO}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#9ca3af' }}>Sección {SECCION} - Educación Media General</p>
      </header>

      <section style={{ padding: '0 10%', marginBottom: '3rem' }}>
        <div style={{ background: COLORES.darkBanner, borderRadius: '100px', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '10px', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
          {['tareas', 'avisos', 'materiales', 'guias', 'plan'].map(sec => (
            <button key={sec} onClick={() => setSeccionActiva(sec)} style={{ 
              padding: '0.8rem 1.5rem', borderRadius: '50px', border: 'none', 
              background: seccionActiva === sec ? COLORES.principal : 'transparent',
              color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
            }}>
              {sec === 'plan' ? 'PLAN EVALUACIÓN' : sec.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem 5rem' }}>
        
        {seccionActiva === 'tareas' && (
          <div>
            <div style={formCardStyle}>
              <h3 style={{ marginTop: 0 }}>Nueva Tarea</h3>
              <div style={gridStyle}>
                <input type="text" placeholder="Título" value={nuevaTarea.titulo} onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})} style={inputStyle} />
                <input type="date" value={nuevaTarea.fechaEntrega} onChange={(e) => setNuevaTarea({...nuevaTarea, fechaEntrega: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Materia" value={nuevaTarea.materia} onChange={(e) => setNuevaTarea({...nuevaTarea, materia: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Descripción (opcional)" value={nuevaTarea.descripcion} onChange={(e) => setNuevaTarea({...nuevaTarea, descripcion: e.target.value})} style={inputStyle} />
                <button onClick={agregarTarea} style={btnPrincipalStyle}>Añadir Tarea</button>
              </div>
            </div>

            {tareas.length > 0 ? tareas.map(tarea => (
              <div key={tarea.id} style={itemCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                  <input type="checkbox" checked={tarea.completado} onChange={() => toggleTarea(tarea.id)} style={{ width: '25px', height: '25px', cursor: 'pointer' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.3rem', textDecoration: tarea.completado ? 'line-through' : 'none' }}>{tarea.titulo}</h4>
                    <p style={{ margin: '5px 0 0', color: '#9ca3af' }}>
                      {tarea.materia && `${tarea.materia} - `}Entrega: {tarea.fechaEntrega}
                      {tarea.descripcion && <span style={{ display: 'block', marginTop: '5px' }}>{tarea.descripcion}</span>}
                    </p>
                  </div>
                </div>
                <button onClick={() => eliminarElemento(tarea.id, 'tarea')} style={btnDangerStyle}>Eliminar</button>
              </div>
            )) : <p style={{textAlign: 'center', opacity: 0.5, padding: '2rem'}}>No hay tareas registradas para esta sección.</p>}
          </div>
        )}

        {seccionActiva === 'avisos' && (
          <div>
            <div style={formCardStyle}>
              <h3 style={{ marginTop: 0 }}>Nuevo Aviso</h3>
              <div style={gridStyle}>
                <input type="text" placeholder="Título" value={nuevoAviso.titulo} onChange={(e) => setNuevoAviso({...nuevoAviso, titulo: e.target.value})} style={inputStyle} />
                <input type="date" value={nuevoAviso.fecha} onChange={(e) => setNuevoAviso({...nuevoAviso, fecha: e.target.value})} style={inputStyle} />
                <textarea placeholder="Descripción del aviso" value={nuevoAviso.descripcion} onChange={(e) => setNuevoAviso({...nuevoAviso, descripcion: e.target.value})} style={{...inputStyle, gridColumn: 'span 2'}} rows={3} />
                <button onClick={agregarAviso} style={btnPrincipalStyle}>Publicar Aviso</button>
              </div>
            </div>

            {avisos.length > 0 ? avisos.map(aviso => (
              <div key={aviso.id} style={itemCardStyle}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem' }}>{aviso.titulo}</h4>
                  <p style={{ margin: '5px 0', color: '#9ca3af', fontSize: '0.9rem' }}>📅 {aviso.fecha}</p>
                  <p style={{ margin: '10px 0 0' }}>{aviso.descripcion}</p>
                </div>
                <button onClick={() => eliminarElemento(aviso.id, 'aviso')} style={btnDangerStyle}>Eliminar</button>
              </div>
            )) : <p style={{textAlign: 'center', opacity: 0.5, padding: '2rem'}}>No hay avisos para mostrar.</p>}
          </div>
        )}

        {seccionActiva === 'materiales' && (
          <div>
            <div style={formCardStyle}>
              <h3 style={{ marginTop: 0 }}>Nuevo Material Didáctico</h3>
              <div style={gridStyle}>
                <input type="text" placeholder="Título del material" value={nuevoMaterial.titulo} onChange={(e) => setNuevoMaterial({...nuevoMaterial, titulo: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Enlace o recurso" value={nuevoMaterial.enlace} onChange={(e) => setNuevoMaterial({...nuevoMaterial, enlace: e.target.value})} style={inputStyle} />
                <textarea placeholder="Descripción" value={nuevoMaterial.descripcion} onChange={(e) => setNuevoMaterial({...nuevoMaterial, descripcion: e.target.value})} style={{...inputStyle, gridColumn: 'span 2'}} rows={3} />
                <button onClick={agregarMaterial} style={btnPrincipalStyle}>Agregar Material</button>
              </div>
            </div>

            {materiales.length > 0 ? materiales.map(material => (
              <div key={material.id} style={itemCardStyle}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem' }}>📚 {material.titulo}</h4>
                  {material.enlace && <p style={{ margin: '5px 0', color: COLORES.principal }}>🔗 {material.enlace}</p>}
                  <p style={{ margin: '10px 0 0' }}>{material.descripcion}</p>
                </div>
                <button onClick={() => eliminarElemento(material.id, 'material')} style={btnDangerStyle}>Eliminar</button>
              </div>
            )) : <p style={{textAlign: 'center', opacity: 0.5, padding: '2rem'}}>No hay materiales registrados.</p>}
          </div>
        )}

        {seccionActiva === 'guias' && (
          <div>
            <div style={formCardStyle}>
              <h3 style={{ marginTop: 0 }}>Nueva Guía</h3>
              <div style={gridStyle}>
                <input type="text" placeholder="Título de la guía" value={nuevaGuia.titulo} onChange={(e) => setNuevaGuia({...nuevaGuia, titulo: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Archivo o enlace" value={nuevaGuia.archivo} onChange={(e) => setNuevaGuia({...nuevaGuia, archivo: e.target.value})} style={inputStyle} />
                <textarea placeholder="Descripción" value={nuevaGuia.descripcion} onChange={(e) => setNuevaGuia({...nuevaGuia, descripcion: e.target.value})} style={{...inputStyle, gridColumn: 'span 2'}} rows={3} />
                <button onClick={agregarGuia} style={btnPrincipalStyle}>Agregar Guía</button>
              </div>
            </div>

            {guias.length > 0 ? guias.map(guia => (
              <div key={guia.id} style={itemCardStyle}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem' }}>📖 {guia.titulo}</h4>
                  {guia.archivo && <p style={{ margin: '5px 0', color: COLORES.principal }}>📎 {guia.archivo}</p>}
                  <p style={{ margin: '10px 0 0' }}>{guia.descripcion}</p>
                </div>
                <button onClick={() => eliminarElemento(guia.id, 'guia')} style={btnDangerStyle}>Eliminar</button>
              </div>
            )) : <p style={{textAlign: 'center', opacity: 0.5, padding: '2rem'}}>No hay guías registradas.</p>}
          </div>
        )}

        {seccionActiva === 'plan' && (
          <div>
            <div style={formCardStyle}>
              <h3 style={{ marginTop: 0 }}>Nuevo Plan de Evaluación</h3>
              <div style={gridStyle}>
                <input type="text" placeholder="Período (Ej: 1er Lapso)" value={nuevoPlan.periodo} onChange={(e) => setNuevoPlan({...nuevoPlan, periodo: e.target.value})} style={inputStyle} />
                <input type="date" value={nuevoPlan.fecha} onChange={(e) => setNuevoPlan({...nuevoPlan, fecha: e.target.value})} style={inputStyle} />
                <textarea placeholder="Contenido / Estrategias de evaluación" value={nuevoPlan.contenido} onChange={(e) => setNuevoPlan({...nuevoPlan, contenido: e.target.value})} style={{...inputStyle, gridColumn: 'span 2'}} rows={4} />
                <button onClick={agregarPlan} style={btnPrincipalStyle}>Agregar Plan</button>
              </div>
            </div>

            {planEvaluacion.length > 0 ? planEvaluacion.map(plan => (
              <div key={plan.id} style={itemCardStyle}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', color: COLORES.principal }}>{plan.periodo}</h4>
                  {plan.fecha && <p style={{ margin: '5px 0', color: '#9ca3af', fontSize: '0.9rem' }}>📅 {plan.fecha}</p>}
                  <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{plan.contenido}</p>
                </div>
                <button onClick={() => eliminarElemento(plan.id, 'plan')} style={btnDangerStyle}>Eliminar</button>
              </div>
            )) : <p style={{textAlign: 'center', opacity: 0.5, padding: '2rem'}}>No hay planes de evaluación registrados.</p>}
          </div>
        )}

      </main>

      <footer style={{ textAlign: 'center', padding: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#6b7280' }}>
        U.E Ciudad Cuatricentenaria © 2026 - {GRADO} Sección {SECCION}
      </footer>
    </div>
  );
};

const seccionBadgeStyle: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  borderRadius: '10px',
  background: COLORES.principal,
  color: COLORES.oscuro,
  fontWeight: 'bold',
  fontSize: '1rem'
};

const inputStyle: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.2)',
  color: 'white',
  fontSize: '1rem',
  fontFamily: 'inherit'
};

const formCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  padding: '2rem',
  borderRadius: '30px',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: '2rem'
};

const itemCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  padding: '1.5rem 2rem',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.05)',
  marginBottom: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem'
};

const btnPrincipalStyle: React.CSSProperties = {
  background: COLORES.principal,
  color: '#1a2e26',
  border: 'none',
  borderRadius: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  padding: '1rem',
  transition: '0.3s'
};

const btnDangerStyle: React.CSSProperties = {
  background: 'rgba(220, 53, 69, 0.2)',
  color: '#ff4d4d',
  border: '1px solid #ff4d4d',
  borderRadius: '10px',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  transition: '0.3s'
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px'
};

export default ClassroomPage;