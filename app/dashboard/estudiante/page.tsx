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

interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  seccion: string;
  cedula: string;
  correo: string;
  fechaNacimiento?: string;
}

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

const EstudianteDashboard: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { width, isMounted } = useWindowSize();
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
          setEstudiante(data);
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
          label="Grado"
          value={estudiante.grado}
          color="#60a5fa"
        />
        <StatCard
          label="Sección"
          value={estudiante.seccion}
          color="#a78bfa"
        />
        <StatCard
          label="Cédula"
          value={estudiante.cedula}
          color={PALETTE.warning}
        />
        <StatCard
          label="Estado"
          value="Activo"
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
            Mi Perfil
          </h2>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '20px',
          padding: '25px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '15px'
          }}>
            <div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Nombre completo</p>
              <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                {estudiante.nombre} {estudiante.apellido}
              </p>
            </div>
            <div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Correo electrónico</p>
              <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                {estudiante.correo}
              </p>
            </div>
            <div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Grado</p>
              <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                {estudiante.grado}° Grado
              </p>
            </div>
            <div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Sección</p>
              <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                {estudiante.seccion}
              </p>
            </div>
            <div>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Cédula</p>
              <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                {estudiante.cedula}
              </p>
            </div>
            {estudiante.fechaNacimiento && (
              <div>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Fecha de Nacimiento</p>
                <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>
                  {new Date(estudiante.fechaNacimiento).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
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