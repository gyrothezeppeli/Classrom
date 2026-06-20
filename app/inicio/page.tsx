"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COLORES = {
  principal: '#00BB7E',
  oscuro: '#102d22',
  deepBg: '#1a2e26',
  textLight: '#f3f4f6'
};

// Almacenamiento local en memoria (simulando base de datos)
let localUsers: any[] = [];

type UserRole = 'teacher' | 'student';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    nivel: '',
    grado: '',
    seccion: ''
  });

  // Opciones de niveles
  const niveles = [
    { value: 'preescolar', label: 'Preescolar' },
    { value: 'primaria', label: 'Primaria' },
    { value: 'bachillerato', label: 'Bachillerato' }
  ];

  // Opciones de grados según el nivel
  const getOpcionesGrado = () => {
    switch(formData.nivel) {
      case 'preescolar':
        return [
          { value: '1er_nivel', label: '1er Nivel' },
          { value: '2do_nivel', label: '2do Nivel' },
          { value: '3er_nivel', label: '3er Nivel' }
        ];
      case 'primaria':
        return [
          { value: '1er_grado', label: '1er Grado' },
          { value: '2do_grado', label: '2do Grado' },
          { value: '3er_grado', label: '3er Grado' },
          { value: '4to_grado', label: '4to Grado' },
          { value: '5to_grado', label: '5to Grado' },
          { value: '6to_grado', label: '6to Grado' }
        ];
      case 'bachillerato':
        return [
          { value: '1er_ano', label: '1er Año' },
          { value: '2do_ano', label: '2do Año' },
          { value: '3er_ano', label: '3er Año' },
          { value: '4to_ano', label: '4to Año' },
          { value: '5to_ano', label: '5to Año' }
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular tiempo de respuesta del servidor
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (userRole === 'teacher') {
        // LOGICA PARA DOCENTES
        if (!isLogin) {
          // Registro de docente
          const existingUser = localUsers.find(
            u => u.email === formData.email && u.rol === 'docente'
          );
          
          if (existingUser) {
            alert("Este correo ya está registrado como docente.");
          } else {
            // Guardar nuevo docente
            const newTeacher = {
              id: Date.now(),
              nombre: formData.nombre,
              email: formData.email,
              password: formData.password,
              rol: 'docente'
            };
            localUsers.push(newTeacher);
            
            alert(`Cuenta de docente creada con éxito. Bienvenido ${formData.nombre}`);
            setIsLogin(true);
            setFormData({ nombre: '', email: '', password: '', nivel: '', grado: '', seccion: '' });
          }
        } else {
          // Login de docente
          const teacher = localUsers.find(
            u => u.email === formData.email && u.password === formData.password && u.rol === 'docente'
          );

          if (teacher) {
            localStorage.setItem('token', `teacher-${teacher.id}-${Date.now()}`);
            localStorage.setItem('user', JSON.stringify({
              id: teacher.id,
              nombre: teacher.nombre,
              email: teacher.email,
              rol: 'docente'
            }));
            
            alert(`Bienvenido ${teacher.nombre}`);
            router.push('/editar');
            router.refresh();
          } else {
            alert("Credenciales incorrectas. Verifica tu email y contraseña.");
          }
        }
      } else {
        // LOGICA PARA ESTUDIANTES
        if (!isLogin) {
          // Registro de estudiante
          const existingUser = localUsers.find(
            u => u.email === formData.email && u.rol === 'estudiante'
          );
          
          if (existingUser) {
            alert("Este correo ya está registrado como estudiante.");
          } else {
            // Guardar nuevo estudiante
            const newStudent = {
              id: Date.now(),
              nombre: formData.nombre,
              email: formData.email,
              password: formData.password,
              nivel: formData.nivel,
              grado: formData.grado,
              seccion: formData.seccion,
              rol: 'estudiante'
            };
            localUsers.push(newStudent);
            
            alert(`Cuenta de estudiante creada con éxito. Bienvenido ${formData.nombre}`);
            setIsLogin(true);
            setFormData({ nombre: '', email: '', password: '', nivel: '', grado: '', seccion: '' });
          }
        } else {
          // Login de estudiante
          const student = localUsers.find(
            u => u.email === formData.email && u.password === formData.password && u.rol === 'estudiante'
          );

          if (student) {
            localStorage.setItem('token', `student-${student.id}-${Date.now()}`);
            localStorage.setItem('user', JSON.stringify({
              id: student.id,
              nombre: student.nombre,
              email: student.email,
              nivel: student.nivel,
              grado: student.grado,
              seccion: student.seccion,
              rol: 'estudiante'
            }));
            
            alert(`Bienvenido ${student.nombre}`);
            router.push('/student/dashboard');
            router.refresh();
          } else {
            alert("Credenciales incorrectas. Verifica tu email y contraseña.");
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert("Error de conexión. Verifica que el servidor esté funcionando.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      fontFamily: "'Montserrat', sans-serif", 
      background: COLORES.deepBg, 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      
      {/* BOTÓN VOLVER AL INICIO */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 20 }}>
        <Link href="/" style={backButtonStyle}>
          ← Volver al Inicio
        </Link>
      </div>

      {/* Fondo decorativo sutil */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url("/assets/img/fondo2.gif")',
        backgroundSize: 'cover',
        opacity: 0.1,
        zIndex: 1
      }} />

      <main style={{ zIndex: 10, width: '100%', maxWidth: '450px', padding: '20px' }}>
        <div style={glassCardStyle}>
          
          {/* SELECTOR DE ROL */}
          <div style={roleSelectorStyle}>
            <button
              onClick={() => {
                setUserRole('teacher');
                setIsLogin(true);
                setFormData({ nombre: '', email: '', password: '', nivel: '', grado: '', seccion: '' });
              }}
              style={{
                ...roleButtonStyle,
                background: userRole === 'teacher' ? COLORES.principal : 'transparent',
                color: userRole === 'teacher' ? '#1a2e26' : 'white'
              }}
              disabled={loading}
            >
              Docente
            </button>
            <button
              onClick={() => {
                setUserRole('student');
                setIsLogin(true);
                setFormData({ nombre: '', email: '', password: '', nivel: '', grado: '', seccion: '' });
              }}
              style={{
                ...roleButtonStyle,
                background: userRole === 'student' ? COLORES.principal : 'transparent',
                color: userRole === 'student' ? '#1a2e26' : 'white'
              }}
              disabled={loading}
            >
              Estudiante
            </button>
          </div>

          <div style={tabContainerStyle}>
            <button 
              onClick={() => setIsLogin(true)}
              style={{ ...tabButtonStyle, background: isLogin ? COLORES.principal : 'transparent', color: isLogin ? '#1a2e26' : 'white' }}
              disabled={loading}
            >
              INGRESAR
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              style={{ ...tabButtonStyle, background: !isLogin ? COLORES.principal : 'transparent', color: !isLogin ? '#1a2e26' : 'white' }}
              disabled={loading}
            >
              REGISTRARSE
            </button>
          </div>

          <h1 style={titleStyle}>
            {isLogin 
              ? (userRole === 'teacher' ? 'DOCENTES' : 'ESTUDIANTES')
              : 'NUEVO REGISTRO'
            }
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {!isLogin && (
              <>
                <div style={{ textAlign: 'left' }}>
                  <label style={labelStyle}>Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder={userRole === 'teacher' ? "Ej. Prof. García" : "Ej. María Pérez"} 
                    style={inputStyle} 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Campos específicos para estudiantes en registro */}
                {userRole === 'student' && (
                  <>
                    <div style={{ textAlign: 'left' }}>
                      <label style={labelStyle}>Nivel de Estudio</label>
                      <select 
                        style={inputStyle}
                        value={formData.nivel}
                        onChange={(e) => {
                          setFormData({
                            ...formData, 
                            nivel: e.target.value,
                            grado: '' // Resetear grado cuando cambia el nivel
                          });
                        }}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccionar nivel</option>
                        {niveles.map((nivel) => (
                          <option key={nivel.value} value={nivel.value}>
                            {nivel.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={labelStyle}>Grado/Año</label>
                      <select 
                        style={inputStyle}
                        value={formData.grado}
                        onChange={(e) => setFormData({...formData, grado: e.target.value})}
                        required
                        disabled={loading || !formData.nivel}
                      >
                        <option value="">
                          {formData.nivel ? 'Seleccionar grado' : 'Primero selecciona un nivel'}
                        </option>
                        {getOpcionesGrado().map((grado) => (
                          <option key={grado.value} value={grado.value}>
                            {grado.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={labelStyle}>Sección</label>
                      <select 
                        style={inputStyle}
                        value={formData.seccion}
                        onChange={(e) => setFormData({...formData, seccion: e.target.value})}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccionar sección</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={labelStyle}>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder={userRole === 'teacher' ? "usuario@colegio.com" : "estudiante@email.com"} 
                style={inputStyle} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={labelStyle}>Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                style={inputStyle} 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              style={btnSubmitStyle}
              disabled={loading}
            >
              {loading ? 'PROCESANDO...' : (isLogin ? 'ACCEDER AL PANEL' : 'FINALIZAR REGISTRO')}
            </button>
          </form>

          {isLogin && (
            <p style={{ marginTop: '20px', color: '#9ca3af', fontSize: '0.75rem' }}>
              Prototipo - Sin base de datos
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

// Estilos adicionales
const backButtonStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '600',
  opacity: 0.7,
  transition: '0.3s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const glassCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  padding: '3rem 2rem',
  borderRadius: '35px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
  textAlign: 'center'
};

const roleSelectorStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '1.5rem',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '15px',
  padding: '4px'
};

const roleButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: '0.3s'
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex', 
  marginBottom: '2rem', 
  background: 'rgba(0,0,0,0.3)', 
  borderRadius: '15px', 
  padding: '4px'
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  border: 'none',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: '800',
  cursor: 'pointer',
  transition: '0.3s'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: '900',
  color: 'white',
  marginBottom: '2rem',
  letterSpacing: '1px'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: COLORES.principal,
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginBottom: '6px',
  marginLeft: '5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '1rem',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(0, 0, 0, 0.3)',
  color: 'white',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const btnSubmitStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '1.1rem',
  borderRadius: '12px',
  border: 'none',
  background: COLORES.principal,
  color: '#1a2e26',
  fontWeight: '900',
  fontSize: '0.9rem',
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(0, 187, 126, 0.2)',
  textTransform: 'uppercase',
  transition: '0.3s'
};

export default AuthPage;