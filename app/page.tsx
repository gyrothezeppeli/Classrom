"use client";

import React, { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const COLORES = {
  principal: '#00BB7E',
  oscuro: '#102d22',
  deepBg: '#1a2e26',
  textLight: '#f3f4f6'
};

type UserRole = 'teacher' | 'student' | 'control';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    fechaNacimiento: '',
    email: '',
    password: '',
    telefono: '',
    nivel: '',
    grado: '',
    seccion: ''
  });

  const niveles = [
    { value: 'preescolar', label: 'Preescolar' },
    { value: 'primaria', label: 'Primaria' },
    { value: 'bachillerato', label: 'Bachillerato' }
  ];

  const secciones = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' }
  ];

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

  const construirRutaClassroom = (nivel: string, grado: string, seccion: string) => {
    const nivelMap: { [key: string]: string } = {
      'preescolar': 'inicial',
      'primaria': 'primaria',
      'bachillerato': 'media'
    };

    const gradoMap: { [key: string]: string } = {
      '1er_nivel': '1er-nivel',
      '2do_nivel': '2do-nivel',
      '3er_nivel': '3er-nivel',
      '1er_grado': '1ero',
      '2do_grado': '2do',
      '3er_grado': '3ero',
      '4to_grado': '4to',
      '5to_grado': '5to',
      '6to_grado': '6to',
      '1er_ano': '1er-ano',
      '2do_ano': '2do-ano',
      '3er_ano': '3er-ano',
      '4to_ano': '4to-ano',
      '5to_ano': '5to-ano'
    };

    const nivelPath = nivelMap[nivel] || nivel;
    const gradoPath = gradoMap[grado] || grado;
    const seccionPath = seccion.toLowerCase();

    return `/Classroom/${nivelPath}/${gradoPath}/${seccionPath}`;
  };

  const handleQuickLogin = async (rol: 'teacher' | 'student' | 'control') => {
    setLoading(true);
    
    try {
      const email = rol === 'teacher' ? 'prueba@docente.com' : 
                     rol === 'control' ? 'control@colegio.com' : 'prueba@estudiante.com';
      const password = '123456';

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        alert('Error en el inicio rapido. Por favor, registrese primero.');
        setLoading(false);
        return;
      }

      const userResponse = await fetch('/api/auth/session');
      const sessionData = await userResponse.json();
      
      if (sessionData?.user) {
        localStorage.setItem('user', JSON.stringify(sessionData.user));
        
        const rol = sessionData.user.rol;
        
        if (rol === 'docente') {
          router.push('/editar');
        } else if (rol === 'control_estudios') {
          router.push('/control_estudios');
        } else if (rol === 'estudiante') {
          router.push('/dashboard/estudiante');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (error) {
      console.error('Error en inicio rapido:', error);
      alert('Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        const roleMap = {
          teacher: 'docente',
          student: 'estudiante',
          control: 'control_estudios'
        };

        const userData = {
          nombre: `${formData.nombres} ${formData.apellidos}`,
          email: formData.email,
          password: formData.password,
          rol: roleMap[userRole],
          nivel: formData.nivel || null,
          grado: formData.grado || null,
          seccion: formData.seccion || null
        };

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || 'Error al registrar usuario');
          setLoading(false);
          return;
        }

        // ========== CREAR ESTUDIANTE ==========
        if (userRole === 'student') {
          console.log('📌 Datos del formulario:', {
            nivel: formData.nivel,
            grado: formData.grado,
            seccion: formData.seccion,
            fechaNacimiento: formData.fechaNacimiento
          });

          let cedula = formData.cedula && formData.cedula.trim() !== '' 
            ? formData.cedula 
            : `V-${Date.now().toString().slice(-8)}`;

          const estudianteData = {
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            cedulaIdentidad: cedula,
            fechaNacimiento: formData.fechaNacimiento || new Date().toISOString().split('T')[0],
            edad: '',
            sexo: '',
            nivel: formData.nivel || '',
            grado: formData.grado || '',
            seccion: formData.seccion || '',
            numeroTelefonoCelular: formData.telefono || '',
            correoElectronico: formData.email,
            userId: data.id
          };

          console.log('📤 Enviando datos de estudiante:', JSON.stringify(estudianteData, null, 2));

          let resEstudiante = await fetch('/api/estudiantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estudianteData)
          });

          // Si falla por cédula duplicada, intentar con una cédula generada
          if (!resEstudiante.ok) {
            const errorText = await resEstudiante.text();
            console.error('❌ Error al crear estudiante:', errorText);
            
            if (errorText.includes('cedulaIdentidad') || errorText.includes('Unique constraint')) {
              console.log('🔄 Cédula duplicada, generando una automática...');
              
              const nuevoEstudianteData = {
                ...estudianteData,
                cedulaIdentidad: `V-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`
              };
              
              resEstudiante = await fetch('/api/estudiantes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoEstudianteData)
              });
              
              if (resEstudiante.ok) {
                const estudianteCreado = await resEstudiante.json();
                console.log('✅ Estudiante creado con cédula generada:', estudianteCreado);
              } else {
                const errorText2 = await resEstudiante.text();
                console.error('❌ Error al crear estudiante con cédula generada:', errorText2);
              }
            }
          }

          if (resEstudiante.ok) {
            const estudianteCreado = await resEstudiante.json();
            console.log('✅ Estudiante creado exitosamente:', estudianteCreado);
          }
        }

        // ========== CREAR DOCENTE ==========
        if (userRole === 'teacher') {
          const docenteData = {
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            cedulaIdentidad: formData.cedula || 'V-00000000',
            email: formData.email,
            telefono: formData.telefono || '',
            especialidad: '',
            nivel: '',
            seccion: '',
            fechaContratacion: new Date().toISOString().split('T')[0],
            userId: data.id
          };

          console.log('📤 Enviando datos de docente:', JSON.stringify(docenteData, null, 2));

          const resDocente = await fetch('/api/docentes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(docenteData)
          });

          if (!resDocente.ok) {
            console.error('❌ Error al crear docente:', await resDocente.text());
          }
        }

        alert(`Cuenta creada con exito. Bienvenido ${formData.nombres}`);
        setIsLogin(true);
        setFormData({ 
          nombres: '', 
          apellidos: '', 
          cedula: '', 
          fechaNacimiento: '', 
          email: '', 
          password: '', 
          telefono: '', 
          nivel: '', 
          grado: '', 
          seccion: '' 
        });
        setLoading(false);
        return;
      }

      // ========== LOGIN ==========
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        alert('Credenciales incorrectas. Verifica tu email y contrasena.');
        setLoading(false);
        return;
      }

      const userResponse = await fetch('/api/auth/session');
      const sessionData = await userResponse.json();
      
      if (sessionData?.user) {
        localStorage.setItem('user', JSON.stringify(sessionData.user));
        
        const rol = sessionData.user.rol;
        
        if (rol === 'docente') {
          router.push('/editar');
        } else if (rol === 'control_estudios') {
          router.push('/control_estudios');
        } else if (rol === 'estudiante') {
          router.push('/dashboard/estudiante');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexion. Verifica que el servidor este funcionando.');
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
      
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url("/assets/img/pc2.jpeg")',
        backgroundSize: 'cover',
        opacity: 0.1,
        zIndex: 1
      }} />

      <main style={{ zIndex: 10, width: '100%', maxWidth: '480px', padding: '20px' }}>
        <div style={glassCardStyle}>
          
          <div style={roleSelectorStyle}>
            <button
              onClick={() => {
                setUserRole('teacher');
                setIsLogin(true);
                setFormData({ nombres: '', apellidos: '', cedula: '', fechaNacimiento: '', email: '', password: '', telefono: '', nivel: '', grado: '', seccion: '' });
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
                setFormData({ nombres: '', apellidos: '', cedula: '', fechaNacimiento: '', email: '', password: '', telefono: '', nivel: '', grado: '', seccion: '' });
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
            <button
              onClick={() => {
                setUserRole('control');
                setIsLogin(true);
                setFormData({ nombres: '', apellidos: '', cedula: '', fechaNacimiento: '', email: '', password: '', telefono: '', nivel: '', grado: '', seccion: '' });
              }}
              style={{
                ...roleButtonStyle,
                background: userRole === 'control' ? COLORES.principal : 'transparent',
                color: userRole === 'control' ? '#1a2e26' : 'white'
              }}
              disabled={loading}
            >
              Control
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
              ? (userRole === 'teacher' ? 'DOCENTES' : 
                 userRole === 'control' ? 'CONTROL DE ESTUDIOS' : 'ESTUDIANTES')
              : 'NUEVO REGISTRO'
            }
          </h1>

          <div style={quickLoginContainerStyle}>
            <button
              onClick={() => handleQuickLogin(userRole)}
              style={quickLoginButtonStyle}
              disabled={loading}
            >
              Inicio Rapido ({userRole === 'teacher' ? 'Docente' : 
                            userRole === 'control' ? 'Control' : 'Estudiante'})
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {!isLogin && (
              <>
                <div style={{ textAlign: 'left' }}>
                  <label style={labelStyle}>Nombres *</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Maria Jose" 
                    style={inputStyle} 
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={labelStyle}>Apellidos *</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Perez Gonzalez" 
                    style={inputStyle} 
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={labelStyle}>Cedula *</label>
                  <input 
                    type="text" 
                    placeholder="V-12345678" 
                    style={inputStyle} 
                    value={formData.cedula}
                    onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>

                {userRole === 'student' && (
                  <>
                    <div style={{ textAlign: 'left' }}>
                      <label style={labelStyle}>Fecha de Nacimiento *</label>
                      <input 
                        type="date" 
                        style={inputStyle} 
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={labelStyle}>Telefono</label>
                      <input 
                        type="text" 
                        placeholder="0412-1234567" 
                        style={inputStyle} 
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        disabled={loading}
                      />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={labelStyle}>Nivel de Estudio *</label>
                      <select 
                        style={inputStyle}
                        value={formData.nivel}
                        onChange={(e) => {
                          setFormData({
                            ...formData, 
                            nivel: e.target.value,
                            grado: ''
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
                      <label style={labelStyle}>Grado/Año *</label>
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
                      <label style={labelStyle}>Seccion *</label>
                      <select 
                        style={inputStyle}
                        value={formData.seccion}
                        onChange={(e) => setFormData({...formData, seccion: e.target.value})}
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccionar seccion</option>
                        {secciones.map((seccion) => (
                          <option key={seccion.value} value={seccion.value}>
                            {seccion.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {userRole === 'teacher' && (
                  <div style={{ textAlign: 'left' }}>
                    <label style={labelStyle}>Telefono</label>
                    <input 
                      type="text" 
                      placeholder="0412-1234567" 
                      style={inputStyle} 
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                )}
              </>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={labelStyle}>Correo Electronico *</label>
              <input 
                type="email" 
                placeholder={userRole === 'teacher' ? "usuario@colegio.com" : 
                            userRole === 'control' ? "control@colegio.com" : "estudiante@email.com"} 
                style={inputStyle} 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={labelStyle}>Contraseña *</label>
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

          <p style={{ marginTop: '20px', color: '#9ca3af', fontSize: '0.75rem', opacity: 0.5 }}>
            Sistema de Gestion Educativa 2024
          </p>
        </div>
      </main>
    </div>
  );
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
  marginBottom: '1.5rem',
  letterSpacing: '1px'
};

const quickLoginContainerStyle: React.CSSProperties = {
  marginBottom: '1.5rem'
};

const quickLoginButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '12px',
  border: '2px solid rgba(0, 187, 126, 0.3)',
  background: 'rgba(0, 187, 126, 0.1)',
  color: COLORES.principal,
  fontWeight: '700',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: '0.3s'
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