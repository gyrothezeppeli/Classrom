"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const PALETTE = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  textGray: '#9ca3af'
};

const TIPOS_CONTENIDO = [
  { id: 'tarea', nombre: 'Tarea' },
  { id: 'aviso', nombre: 'Aviso' },
  { id: 'material', nombre: 'Material' },
  { id: 'plan_evaluacion', nombre: 'Plan de Evaluacion' }
];

const MATERIAS_POR_NIVEL = {
  inicial: [
    'Lenguaje y Comunicacion',
    'Matematica',
    'Exploracion del Entorno',
    'Expresion Artistica',
    'Educacion Fisica'
  ],
  primaria: [
    'Lengua Espanola',
    'Matematica',
    'Ciencias Sociales',
    'Ciencias Naturales',
    'Ingles',
    'Educacion Artistica',
    'Educacion Fisica',
    'Formacion Humana'
  ],
  media: [
    'Lengua Espanola',
    'Matematica',
    'Historia',
    'Geografia',
    'Biologia',
    'Quimica',
    'Fisica',
    'Ingles',
    'Frances',
    'Filosofia',
    'Educacion Fisica',
    'Arte',
    'Informatica'
  ]
};

// Tipo para las filas del plan de evaluación
interface FilaPlan {
  id: string;
  fecha: string;
  referenteTeorico: string;
  estrategiaEvaluacion: string;
  tecnicaEvaluacion: string;
  instrumentoEvaluacion: string;
  ptos: string;
  porcentaje: string;
  criteriosEvaluacion: string;
}

// Tipo para el plan de evaluación completo
interface PlanEvaluacion {
  id: string;
  areaFormacion: string;
  docente: string;
  ano: string;
  secciones: string;
  filas: FilaPlan[];
  nivel: string;
  grado: string;
  materia: string;
}

const EditTasksPage: React.FC = () => {
  // Estados originales
  const [nivelSeleccionado, setNivelSeleccionado] = useState('media');
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState('');
  const [tipoContenido, setTipoContenido] = useState('tarea');
  const [materia, setMateria] = useState('');
  const [contenido, setContenido] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    materia: '',
    recursos: '',
    objetivos: '',
    criterios: '',
    ponderacion: '',
    enlaces: ''
  });

  // Estados para el plan de evaluación
  const [mostrarGestorPlan, setMostrarGestorPlan] = useState(false);
  const [modoEdicionPlan, setModoEdicionPlan] = useState(false);
  const [planEditandoId, setPlanEditandoId] = useState<string | null>(null);
  
  // Estado para el plan de evaluación actual
  const [planActual, setPlanActual] = useState<PlanEvaluacion>({
    id: '',
    areaFormacion: '',
    docente: '',
    ano: '',
    secciones: '',
    filas: [],
    nivel: '',
    grado: '',
    materia: ''
  });

  // Estado para los planes guardados
  const [planesGuardados, setPlanesGuardados] = useState<PlanEvaluacion[]>([
    {
      id: '1',
      areaFormacion: 'Matematica',
      docente: 'Prof. Juan Perez',
      ano: '1er Año',
      secciones: 'A, B',
      nivel: 'media',
      grado: '1ro',
      materia: 'Matematica',
      filas: [
        {
          id: '1-1',
          fecha: '2026-03-01',
          referenteTeorico: 'Operaciones básicas',
          estrategiaEvaluacion: 'Resolución de problemas',
          tecnicaEvaluacion: 'Prueba escrita',
          instrumentoEvaluacion: 'Cuestionario',
          ptos: '20',
          porcentaje: '30',
          criteriosEvaluacion: 'Procedimiento correcto'
        },
        {
          id: '1-2',
          fecha: '2026-03-15',
          referenteTeorico: 'Ecuaciones lineales',
          estrategiaEvaluacion: 'Análisis de casos',
          tecnicaEvaluacion: 'Prueba práctica',
          instrumentoEvaluacion: 'Ejercicios resueltos',
          ptos: '30',
          porcentaje: '40',
          criteriosEvaluacion: 'Razonamiento lógico'
        }
      ]
    }
  ]);

  const niveles = [
    { id: 'inicial', nombre: 'Educacion Inicial' },
    { id: 'primaria', nombre: 'Educacion Primaria' },
    { id: 'media', nombre: 'Educacion Media' }
  ];

  const gradosPorNivel = {
    inicial: [
      { id: 'prekinder', nombre: 'Pre-Kinder', secciones: ['A', 'B', 'C'] },
      { id: 'kinder', nombre: 'Kinder', secciones: ['A', 'B', 'C'] },
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
  const materiasDisponibles = MATERIAS_POR_NIVEL[nivelSeleccionado as keyof typeof MATERIAS_POR_NIVEL] || [];
  
  const seccionesActuales = gradoSeleccionado 
    ? gradosActuales.find(g => g.id === gradoSeleccionado)?.secciones || []
    : [];

  // Filtrar planes guardados
  const planesFiltrados = planesGuardados.filter(plan => {
    let coincide = true;
    if (nivelSeleccionado && plan.nivel !== nivelSeleccionado) coincide = false;
    if (gradoSeleccionado && plan.grado !== gradoSeleccionado) coincide = false;
    if (seccionSeleccionada && !plan.secciones.includes(seccionSeleccionada)) coincide = false;
    return coincide;
  });

  // Funciones originales
  const handleNivelChange = (nivelId: string) => {
    setNivelSeleccionado(nivelId);
    setGradoSeleccionado('');
    setSeccionSeleccionada('');
    setMateria('');
  };

  const handlePublicar = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gradoSeleccionado) {
      alert('Por favor seleccione un grado/año');
      return;
    }
    
    if (!seccionSeleccionada) {
      alert('Por favor seleccione una seccion');
      return;
    }

    if (!materia) {
      alert('Por favor seleccione una materia');
      return;
    }
    
    const nivelNombre = niveles.find(n => n.id === nivelSeleccionado)?.nombre;
    const gradoNombre = gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre;
    const tipoNombre = TIPOS_CONTENIDO.find(t => t.id === tipoContenido)?.nombre;
    
    let mensaje = `${tipoNombre} publicado exitosamente en:\n`;
    mensaje += `${nivelNombre}\n`;
    mensaje += `${gradoNombre}\n`;
    mensaje += `Seccion ${seccionSeleccionada}\n`;
    mensaje += `Materia: ${materia}\n\n`;
    mensaje += `Titulo: ${contenido.titulo}\n`;
    
    if (contenido.descripcion) mensaje += `Descripcion: ${contenido.descripcion}\n`;
    if (contenido.fecha) mensaje += `Fecha: ${contenido.fecha}\n`;
    if (contenido.recursos) mensaje += `Recursos: ${contenido.recursos}\n`;
    if (contenido.objetivos) mensaje += `Objetivos: ${contenido.objetivos}\n`;
    if (contenido.criterios) mensaje += `Criterios: ${contenido.criterios}\n`;
    if (contenido.ponderacion) mensaje += `Ponderacion: ${contenido.ponderacion}\n`;
    if (contenido.enlaces) mensaje += `Enlaces: ${contenido.enlaces}\n`;
    
    console.log(`Publicando ${tipoContenido}:`, contenido);
    alert(mensaje);
    
    setContenido({
      titulo: '',
      descripcion: '',
      fecha: '',
      materia: '',
      recursos: '',
      objetivos: '',
      criterios: '',
      ponderacion: '',
      enlaces: ''
    });
    setMateria('');
  };

  // Funciones del plan de evaluación
  const agregarFila = () => {
    const nuevaFila: FilaPlan = {
      id: `fila-${Date.now()}`,
      fecha: '',
      referenteTeorico: '',
      estrategiaEvaluacion: '',
      tecnicaEvaluacion: '',
      instrumentoEvaluacion: '',
      ptos: '',
      porcentaje: '',
      criteriosEvaluacion: ''
    };
    setPlanActual({
      ...planActual,
      filas: [...planActual.filas, nuevaFila]
    });
  };

  const eliminarFila = (id: string) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.filter(fila => fila.id !== id)
    });
  };

  const actualizarFila = (id: string, campo: keyof FilaPlan, valor: string) => {
    setPlanActual({
      ...planActual,
      filas: planActual.filas.map(fila => 
        fila.id === id ? { ...fila, [campo]: valor } : fila
      )
    });
  };

  const guardarPlan = () => {
    if (!planActual.areaFormacion || !planActual.docente || !planActual.ano) {
      alert('Por favor complete los campos del encabezado del plan');
      return;
    }

    if (planActual.filas.length === 0) {
      alert('Por favor agregue al menos una fila al plan');
      return;
    }

    if (modoEdicionPlan && planEditandoId) {
      // Actualizar plan existente
      setPlanesGuardados(planesGuardados.map(plan => 
        plan.id === planEditandoId ? { ...planActual, id: planEditandoId } : plan
      ));
      alert('Plan de evaluación actualizado exitosamente');
    } else {
      // Crear nuevo plan
      const nuevoPlan = {
        ...planActual,
        id: `plan-${Date.now()}`,
        nivel: nivelSeleccionado,
        grado: gradoSeleccionado,
        materia: materia
      };
      setPlanesGuardados([...planesGuardados, nuevoPlan]);
      alert('Plan de evaluación creado exitosamente');
    }

    // Resetear y salir
    setMostrarGestorPlan(false);
    setModoEdicionPlan(false);
    setPlanEditandoId(null);
    setPlanActual({
      id: '',
      areaFormacion: '',
      docente: '',
      ano: '',
      secciones: '',
      filas: [],
      nivel: '',
      grado: '',
      materia: ''
    });
  };

  const editarPlan = (plan: PlanEvaluacion) => {
    setPlanActual({ ...plan });
    setModoEdicionPlan(true);
    setPlanEditandoId(plan.id);
    setMostrarGestorPlan(true);
  };

  const nuevoPlan = () => {
    setPlanActual({
      id: '',
      areaFormacion: '',
      docente: '',
      ano: '',
      secciones: '',
      filas: [],
      nivel: nivelSeleccionado,
      grado: gradoSeleccionado,
      materia: materia
    });
    setModoEdicionPlan(false);
    setPlanEditandoId(null);
    setMostrarGestorPlan(true);
  };

  const renderCamposEspecificos = () => {
    switch (tipoContenido) {
      case 'tarea':
        return (
          <>
            <div>
              <label style={labelStyle}>Recursos / Material de apoyo</label>
              <input 
                type="text" 
                placeholder="Ej: Libro paginas 45-50, Video explicativo..." 
                style={inputStyle}
                value={contenido.recursos}
                onChange={(e) => setContenido({...contenido, recursos: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Objetivos de la tarea</label>
              <textarea 
                placeholder="Ej: Comprender los conceptos basicos de..." 
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                value={contenido.objetivos}
                onChange={(e) => setContenido({...contenido, objetivos: e.target.value})}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Fecha Limite</label>
                <input 
                  type="date" 
                  style={inputStyle} 
                  value={contenido.fecha}
                  onChange={(e) => setContenido({...contenido, fecha: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Ponderacion (%)</label>
                <input 
                  type="number" 
                  placeholder="Ej: 15" 
                  style={inputStyle}
                  value={contenido.ponderacion}
                  onChange={(e) => setContenido({...contenido, ponderacion: e.target.value})}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </>
        );
      
      case 'aviso':
        return (
          <>
            <div>
              <label style={labelStyle}>Mensaje del aviso</label>
              <textarea 
                placeholder="Escriba el mensaje que desea comunicar..." 
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                value={contenido.descripcion}
                onChange={(e) => setContenido({...contenido, descripcion: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Fecha del aviso</label>
              <input 
                type="date" 
                style={inputStyle} 
                value={contenido.fecha}
                onChange={(e) => setContenido({...contenido, fecha: e.target.value})}
                required
              />
            </div>
          </>
        );
      
      case 'material':
        return (
          <>
            <div>
              <label style={labelStyle}>Descripcion del material</label>
              <textarea 
                placeholder="Describa el material que se compartira..." 
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                value={contenido.descripcion}
                onChange={(e) => setContenido({...contenido, descripcion: e.target.value})}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Enlace(s) de descarga</label>
              <input 
                type="text" 
                placeholder="Ej: https://drive.google.com/..." 
                style={inputStyle}
                value={contenido.enlaces}
                onChange={(e) => setContenido({...contenido, enlaces: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Recursos adicionales</label>
              <input 
                type="text" 
                placeholder="Ej: Guia en PDF, Presentacion, Video..." 
                style={inputStyle}
                value={contenido.recursos}
                onChange={(e) => setContenido({...contenido, recursos: e.target.value})}
              />
            </div>
            <div>
              <label style={labelStyle}>Fecha de publicacion</label>
              <input 
                type="date" 
                style={inputStyle} 
                value={contenido.fecha}
                onChange={(e) => setContenido({...contenido, fecha: e.target.value})}
                required
              />
            </div>
          </>
        );
      
      case 'plan_evaluacion':
        return null;
      
      default:
        return null;
    }
  };

  // Renderizar el formulario del plan de evaluación
  const renderPlanForm = () => (
    <div style={glassCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: PALETTE.principal, fontSize: '1.5rem' }}>
          {modoEdicionPlan ? 'EDITAR PLAN DE EVALUACIÓN' : 'NUEVO PLAN DE EVALUACIÓN'}
        </h2>
        <button
          onClick={() => {
            setMostrarGestorPlan(false);
            setModoEdicionPlan(false);
            setPlanEditandoId(null);
          }}
          style={{
            padding: '10px 20px',
            background: 'rgba(255,0,0,0.2)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: '10px',
            color: '#ff6b6b',
            cursor: 'pointer'
          }}
        >
          ✕ Cerrar
        </button>
      </div>
      
      {/* Encabezado del Plan */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr 1fr', 
        gap: '15px',
        marginBottom: '25px',
        background: 'rgba(0,0,0,0.2)',
        padding: '20px',
        borderRadius: '12px'
      }}>
        <div>
          <label style={labelStyle}>Área de Formación</label>
          <select 
            style={inputStyle}
            value={planActual.areaFormacion}
            onChange={(e) => setPlanActual({...planActual, areaFormacion: e.target.value})}
            required
          >
            <option value="">Seleccionar</option>
            {materiasDisponibles.map(mat => (
              <option key={mat} value={mat} style={{ color: '#1a2e26' }}>{mat}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Docente</label>
          <input 
            type="text" 
            style={inputStyle}
            placeholder="Nombre del docente"
            value={planActual.docente}
            onChange={(e) => setPlanActual({...planActual, docente: e.target.value})}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Año</label>
          <select 
            style={inputStyle}
            value={planActual.ano}
            onChange={(e) => setPlanActual({...planActual, ano: e.target.value})}
            required
          >
            <option value="">Seleccionar</option>
            {gradosActuales.map(grado => (
              <option key={grado.id} value={grado.nombre} style={{ color: '#1a2e26' }}>
                {grado.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Secciones</label>
          <input 
            type="text" 
            style={inputStyle}
            placeholder="Ej: A, B, C"
            value={planActual.secciones}
            onChange={(e) => setPlanActual({...planActual, secciones: e.target.value})}
            required
          />
        </div>
      </div>

      {/* Tabla del Plan */}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>FECHA</th>
              <th style={thStyle}>REFERENTE TEÓRICO-PRÁCTICO</th>
              <th style={thStyle}>ESTRATEGIA DE EVALUACIÓN</th>
              <th style={thStyle}>TÉCNICA DE EVALUACIÓN</th>
              <th style={thStyle}>INSTRUMENTO DE EVALUACIÓN</th>
              <th style={thStyle}>PTOS</th>
              <th style={thStyle}>%</th>
              <th style={thStyle}>CRITERIOS DE EVALUACIÓN</th>
              <th style={{ ...thStyle, width: '60px' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {planActual.filas.map((fila) => (
              <tr key={fila.id}>
                <td style={tdStyle}>
                  <input 
                    type="date" 
                    style={inputTablaStyle}
                    value={fila.fecha}
                    onChange={(e) => actualizarFila(fila.id, 'fecha', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={inputTablaStyle}
                    placeholder="Referente teórico"
                    value={fila.referenteTeorico}
                    onChange={(e) => actualizarFila(fila.id, 'referenteTeorico', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={inputTablaStyle}
                    placeholder="Estrategia"
                    value={fila.estrategiaEvaluacion}
                    onChange={(e) => actualizarFila(fila.id, 'estrategiaEvaluacion', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={inputTablaStyle}
                    placeholder="Técnica"
                    value={fila.tecnicaEvaluacion}
                    onChange={(e) => actualizarFila(fila.id, 'tecnicaEvaluacion', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={inputTablaStyle}
                    placeholder="Instrumento"
                    value={fila.instrumentoEvaluacion}
                    onChange={(e) => actualizarFila(fila.id, 'instrumentoEvaluacion', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={{ ...inputTablaStyle, width: '50px' }}
                    placeholder="Ptos"
                    value={fila.ptos}
                    onChange={(e) => actualizarFila(fila.id, 'ptos', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={{ ...inputTablaStyle, width: '50px' }}
                    placeholder="%"
                    value={fila.porcentaje}
                    onChange={(e) => actualizarFila(fila.id, 'porcentaje', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <input 
                    type="text" 
                    style={inputTablaStyle}
                    placeholder="Criterios"
                    value={fila.criteriosEvaluacion}
                    onChange={(e) => actualizarFila(fila.id, 'criteriosEvaluacion', e.target.value)}
                  />
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => eliminarFila(fila.id)}
                    style={{
                      background: 'rgba(255,0,0,0.2)',
                      border: '1px solid rgba(255,0,0,0.3)',
                      borderRadius: '5px',
                      color: '#ff6b6b',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={agregarFila}
          style={{
            padding: '12px 25px',
            background: 'rgba(0,187,126,0.2)',
            border: `1px solid ${PALETTE.principal}`,
            borderRadius: '10px',
            color: PALETTE.principal,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Agregar Fila
        </button>
        <button
          onClick={guardarPlan}
          style={publishButtonStyle}
        >
          {modoEdicionPlan ? 'ACTUALIZAR PLAN' : 'GUARDAR PLAN'}
        </button>
      </div>

      {/* Resumen de filas */}
      <div style={{ 
        marginTop: '15px', 
        color: PALETTE.textGray, 
        fontSize: '0.85rem' 
      }}>
        Total de filas: {planActual.filas.length}
        {planActual.filas.length > 0 && (
          <span style={{ marginLeft: '15px' }}>
            Puntos totales: {planActual.filas.reduce((sum, f) => sum + (parseInt(f.ptos) || 0), 0)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ 
      fontFamily: "'Montserrat', sans-serif", 
      minHeight: '100vh', 
      color: 'white',
      paddingBottom: '50px',
      position: 'relative',
      background: `url('/assets/img/pc2.jpeg') center/cover no-repeat fixed`,
      zIndex: 0
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(26, 46, 38, 0.85)',
        zIndex: -1
      }} />
      
      <nav style={{ padding: '2rem 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1rem' }}>
          Volver al Portal
        </Link>
        <div style={{ color: PALETTE.principal, fontWeight: '800', letterSpacing: '1px' }}>
          {mostrarGestorPlan ? 'PLAN DE EVALUACIÓN' : 'EDITOR DE CONTENIDO'}
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '10px' }}>
            {mostrarGestorPlan ? 'PLAN DE EVALUACIÓN' : 'GESTION DE CONTENIDO'}
          </h1>
          <p style={{ color: PALETTE.textGray, fontSize: '1.1rem' }}>
            {mostrarGestorPlan 
              ? (modoEdicionPlan ? 'Editando plan de evaluación' : 'Crear nuevo plan de evaluación')
              : 'Publica tareas, avisos, materiales y planes de evaluacion para los estudiantes.'}
          </p>
        </header>

        {mostrarGestorPlan ? (
          // Mostrar el formulario del plan
          renderPlanForm()
        ) : (
          // Vista normal con todas las funciones originales
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
            
            <section style={glassCardStyle}>
              <form onSubmit={handlePublicar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={labelStyle}>Tipo de contenido</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                    {TIPOS_CONTENIDO.map((tipo) => (
                      <div
                        key={tipo.id}
                        onClick={() => {
                          setTipoContenido(tipo.id);
                          setContenido({
                            ...contenido,
                            descripcion: '',
                            recursos: '',
                            objetivos: '',
                            criterios: '',
                            ponderacion: '',
                            enlaces: ''
                          });
                          // Si selecciona Plan de Evaluación, mostrar opciones
                          if (tipo.id === 'plan_evaluacion') {
                            // No hacer nada, el botón de gestionar aparecerá
                          }
                        }}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          background: tipoContenido === tipo.id ? 'rgba(0,187,126,0.15)' : 'rgba(0,0,0,0.3)',
                          border: tipoContenido === tipo.id ? `2px solid ${PALETTE.principal}` : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.3s ease',
                          fontWeight: tipoContenido === tipo.id ? '700' : '400',
                          color: tipoContenido === tipo.id ? PALETTE.principal : 'white'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem' }}>{tipo.nombre}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {tipoContenido !== 'plan_evaluacion' && (
                  <>
                    <div>
                      <label style={labelStyle}>Titulo del contenido</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Analisis Literario - El Coronel no tiene quien le escriba" 
                        style={inputStyle}
                        value={contenido.titulo}
                        onChange={(e) => setContenido({...contenido, titulo: e.target.value})}
                        required 
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Materia</label>
                      <select 
                        style={inputStyle}
                        value={materia}
                        onChange={(e) => setMateria(e.target.value)}
                        required
                      >
                        <option value="">Seleccione una materia</option>
                        {materiasDisponibles.map((mat) => (
                          <option key={mat} value={mat} style={{ color: '#1a2e26' }}>
                            {mat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {renderCamposEspecificos()}

                    <button type="submit" style={publishButtonStyle}>
                      PUBLICAR CONTENIDO
                    </button>
                  </>
                )}

                {tipoContenido === 'plan_evaluacion' && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '30px 20px',
                    background: 'rgba(0,187,126,0.05)',
                    borderRadius: '15px',
                    border: '1px dashed rgba(0,187,126,0.3)'
                  }}>
                    <p style={{ color: PALETTE.textGray, marginBottom: '20px' }}>
                      Gestiona planes de evaluación en formato de cuadrícula
                    </p>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={nuevoPlan}
                        style={{
                          ...publishButtonStyle,
                          minWidth: '200px'
                        }}
                      >
                        + Crear Nuevo Plan
                      </button>
                      {planesFiltrados.length > 0 && (
                        <button
                          onClick={() => {
                            if (planesFiltrados.length > 0) {
                              editarPlan(planesFiltrados[0]);
                            }
                          }}
                          style={{
                            padding: '12px 25px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          Ver Planes Existentes ({planesFiltrados.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={selectorCardStyle}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                  Nivel de Publicacion
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
                      {nivel.id === 'inicial' ? 'Preescolar' : nivel.id === 'primaria' ? '1 a 6 Grado' : '1 a 5 Año'}
                    </span>
                  </div>
                ))}
              </div>

              {gradosActuales.length > 0 && (
                <div style={selectorCardStyle}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                    Grado / Año
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

              {seccionesActuales.length > 0 && (
                <div style={selectorCardStyle}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                    Seccion
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

              {tipoContenido === 'plan_evaluacion' && planesFiltrados.length > 0 && !mostrarGestorPlan && (
                <div style={selectorCardStyle}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: PALETTE.principal, textTransform: 'uppercase', marginBottom: '15px' }}>
                    Planes Disponibles
                  </h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {planesFiltrados.map(plan => (
                      <div
                        key={plan.id}
                        onClick={() => editarPlan(plan)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          marginBottom: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = PALETTE.principal;
                          e.currentTarget.style.background = 'rgba(0,187,126,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {plan.areaFormacion}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: PALETTE.textGray }}>
                          {plan.docente} • {plan.ano} • {plan.filas.length} filas
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gradoSeleccionado && seccionSeleccionada && materia && tipoContenido !== 'plan_evaluacion' && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '20px', 
                  borderRadius: '15px', 
                  background: 'rgba(0,187,126,0.1)', 
                  border: `1px solid ${PALETTE.principal}` 
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: PALETTE.principal, lineHeight: '1.6', textAlign: 'center' }}>
                    <strong>Publicando en:</strong><br />
                    {niveles.find(n => n.id === nivelSeleccionado)?.nombre}<br />
                    {gradosActuales.find(g => g.id === gradoSeleccionado)?.nombre}<br />
                    Seccion {seccionSeleccionada}<br />
                    <strong>Materia:</strong> {materia}
                  </p>
                </div>
              )}

              <div style={{ padding: '20px', borderRadius: '15px', background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#ffcc00', lineHeight: '1.4' }}>
                  <strong>Nota:</strong> Los cambios realizados aqui se reflejaran inmediatamente en el Portal de Aprendizaje para el grupo especifico seleccionado.
                </p>
              </div>
            </section>

          </div>
        )}
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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
  minWidth: '1200px'
};

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  background: 'rgba(0,187,126,0.15)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: PALETTE.principal,
  fontWeight: '800',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  textAlign: 'center'
};

const tdStyle: React.CSSProperties = {
  padding: '4px',
  border: '1px solid rgba(255,255,255,0.05)',
  verticalAlign: 'middle'
};

const inputTablaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 6px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '4px',
  color: 'white',
  fontSize: '0.8rem',
  outline: 'none',
  transition: 'border 0.3s',
  minWidth: '60px'
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
  padding: '12px 25px',
  background: PALETTE.principal,
  border: 'none',
  borderRadius: '10px',
  color: '#1a2e26',
  fontWeight: '900',
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(0, 187, 126, 0.3)',
  transition: 'transform 0.2s, background 0.2s',
  textTransform: 'uppercase'
};

export default EditTasksPage;