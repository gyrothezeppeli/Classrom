"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PALETTE = {
  sandBorder: '#5c7564', 
  darkBanner: 'linear-gradient(160deg, #102d22 0%, #081a14 100%)',
  deepBg: '#1a2e26', 
  textLight: '#f3f4f6',
  accent: '#00BB7E',
  glass: 'rgba(255, 255, 255, 0.08)'
};

// --- HOOK PARA DETECTAR TAMAÑO DE PANTALLA (CON PREVENCIÓN DE HIDRATACIÓN) ---
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 1024, // Valor por defecto para desktop (evita hidratación)
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

const ClassroomPortalPage: React.FC = () => {
  const router = useRouter();
  const { width, isMounted } = useWindowSize();
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [tempYear, setTempYear] = useState<string>("");
  const [tempSection, setTempSection] = useState<string>("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  // Refs para cada menú
  const menuRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Determinar si es móvil solo después del montaje
  const isMobile = isMounted ? width < 768 : false;
  const isTablet = isMounted ? (width >= 768 && width < 1024) : false;

  const sections = ["A", "B", "C"];

  const levels = [
    { 
      id: "inicial",
      href: "/Classroom/inicial", 
      label: "Educación Inicial", 
      sub: "Preescolar y Maternal",
      hasYearSelect: false
    },
    { 
      id: "primaria",
      href: "/Classroom/primaria", 
      label: "Educación Primaria", 
      sub: "1ero a 6to Grado",
      hasYearSelect: true,
      years: ["1ero", "2do", "3ero", "4to", "5to", "6to"]
    },
    { 
      id: "media",
      href: "/Classroom/media", 
      label: "Educación Media", 
      sub: "Bachillerato",
      hasYearSelect: true,
      years: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
    }
  ];

  const handleNavigation = (basePath: string) => {
    if (tempYear && tempSection) {
      const yearSlug = tempYear.toLowerCase().replace(" ", "-").replace("ñ", "n");
      const sectionSlug = tempSection.toLowerCase();
      router.push(`${basePath}/${yearSlug}/${sectionSlug}`);
      setActiveMenu(null);
      setTempYear("");
      setTempSection("");
    } else {
      alert("Por favor selecciona Grado/Año y Sección");
    }
  };

  // Manejar click fuera del menú para cerrarlo
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu !== null && !isMobile) {
        // Verificar si el click fue fuera del menú activo
        const activeMenuElement = menuRefs.current[activeMenu];
        if (activeMenuElement && !activeMenuElement.contains(e.target as Node)) {
          setActiveMenu(null);
          setTempYear("");
          setTempSection("");
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu, isMobile]);

  // Cerrar menús al hacer click fuera (solo móvil)
  useEffect(() => {
    const handleClickOutsideMobile = (e: MouseEvent) => {
      if (isMobile && showMobileMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('nav')) {
          setShowMobileMenu(false);
        }
      }
    };
    
    document.addEventListener('click', handleClickOutsideMobile);
    return () => document.removeEventListener('click', handleClickOutsideMobile);
  }, [isMobile, showMobileMenu]);

  // Manejar click en un nivel (para desktop y mobile)
  const handleLevelClick = (index: number) => {
    if (activeMenu === index) {
      setActiveMenu(null);
      setTempYear("");
      setTempSection("");
    } else {
      setActiveMenu(index);
      setTempYear("");
      setTempSection("");
    }
  };

  // Mostrar un loading inicial para evitar hidratación
  if (!isMounted) {
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
        Cargando...
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
      {/* Navegación - Distinta en móvil vs desktop */}
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
          background: PALETTE.deepBg
        } : {
          position: 'absolute',
          padding: '1.5rem 8%',
          background: 'transparent'
        })
      }}>
        <a 
          href="https://u-e-cuatricentenaria-pi.vercel.app/" 
          style={{ 
            color: 'white', 
            fontWeight: 'bold', 
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            ...(isMobile ? {
              fontSize: '0.9rem',
              maxWidth: '60%'
            } : {
              fontSize: '1.2rem'
            })
          }}
          onMouseEnter={() => setHoveredButton('logo')}
          onMouseLeave={() => setHoveredButton(null)}
          className={hoveredButton === 'logo' ? 'hover-glow' : ''}
        >
          U.E Ciudad Cuatricentenaria
        </a>
        
        {/* Botón Hamburguesa solo para móviles */}
        {isMobile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileMenu(!showMobileMenu);
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              zIndex: 1001,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={() => setHoveredButton('hamburger')}
            onMouseLeave={() => setHoveredButton(null)}
            className={hoveredButton === 'hamburger' ? 'hover-pulse' : ''}
            aria-label="Menú"
          >
            <div style={{
              width: '25px',
              height: '2px',
              background: 'white',
              transition: 'all 0.3s ease',
              transform: showMobileMenu ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }} />
            <div style={{
              width: '25px',
              height: '2px',
              background: 'white',
              transition: 'all 0.3s ease',
              opacity: showMobileMenu ? 0 : 1
            }} />
            <div style={{
              width: '25px',
              height: '2px',
              background: 'white',
              transition: 'all 0.3s ease',
              transform: showMobileMenu ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
            }} />
          </button>
        )}
        
        {/* Menú Desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
            <div style={{ display: 'flex', gap: '25px' }}>
              <a 
                href="https://u-e-cuatricentenaria-pi.vercel.app/" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '0.95rem', 
                  fontWeight: '500', 
                  opacity: 0.8,
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  setHoveredButton('inicio');
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  setHoveredButton(null);
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Inicio
              </a>
              <a 
                href="https://u-e-cuatricentenaria-pi.vercel.app/#contacto" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '0.95rem', 
                  fontWeight: '500', 
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  setHoveredButton('contacto');
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  setHoveredButton(null);
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Contacto
              </a>
            </div>
            <Link 
              href="/inicio"
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: 'white', 
                textDecoration: 'none', 
                fontWeight: '700', 
                borderRadius: '15px', 
                padding: '12px 24px', 
                fontSize: '0.9rem',
                border: `1px solid ${PALETTE.accent}`, 
                transition: 'all 0.3s ease', 
                boxShadow: `0 0 15px rgba(0, 187, 126, 0.15)`, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                setHoveredButton('docente');
                e.currentTarget.style.background = PALETTE.accent;
                e.currentTarget.style.color = '#081a14';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 0 25px rgba(0, 187, 126, 0.4)`;
              }}
              onMouseLeave={(e) => {
                setHoveredButton(null);
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 0 15px rgba(0, 187, 126, 0.15)`;
              }}
            >
              Acceso Docente
            </Link>
          </div>
        )}
        
        {/* Menú Mobile */}
        {isMobile && showMobileMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: PALETTE.deepBg,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            gap: '15px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            zIndex: 1000,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <a 
              href="https://u-e-cuatricentenaria-pi.vercel.app/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontSize: '1rem', 
                fontWeight: '500', 
                opacity: 0.8,
                padding: '12px',
                textAlign: 'center',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setShowMobileMenu(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              Inicio
            </a>
            <a 
              href="https://u-e-cuatricentenaria-pi.vercel.app/#contacto" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontSize: '1rem', 
                fontWeight: '500', 
                opacity: 0.8,
                padding: '12px',
                textAlign: 'center',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setShowMobileMenu(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              Contacto
            </a>
            <Link 
              href="/inicio"
              style={{
                background: 'rgba(255, 255, 255, 0.05)', 
                color: 'white', 
                textDecoration: 'none', 
                fontWeight: '700', 
                borderRadius: '15px', 
                padding: '12px', 
                textAlign: 'center',
                border: `1px solid ${PALETTE.accent}`,
                transition: 'all 0.3s ease'
              }}
              onClick={() => setShowMobileMenu(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = PALETTE.accent;
                e.currentTarget.style.color = '#081a14';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Acceso Docente
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        ...(isMobile ? {
          height: '50vh',
          padding: '0 5%',
          borderBottom: `20px solid ${PALETTE.sandBorder}`
        } : {
          height: '65vh',
          padding: '0 10%',
          borderBottom: `45px solid ${PALETTE.sandBorder}`
        })
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("/assets/img/fondo2.gif")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(45, 62, 54, 0.85) 0%, rgba(26, 46, 38, 0.65) 100%)',
          zIndex: 2
        }} />
        <div style={{ maxWidth: '800px', zIndex: 10, position: 'relative' }}>
          <h1 style={{
            color: PALETTE.textLight,
            fontWeight: '900',
            lineHeight: '0.9',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            ...(isMobile ? {
              fontSize: 'clamp(2rem, 8vw, 3rem)',
              letterSpacing: '-1px'
            } : {
              fontSize: 'clamp(3.5rem, 9vw, 6rem)',
              letterSpacing: '-3px'
            })
          }}>
            Portal de<br/>Aprendizaje
          </h1>
          <p style={{
            color: '#d1d5db',
            fontWeight: '400',
            maxWidth: '600px',
            lineHeight: '1.4',
            ...(isMobile ? {
              fontSize: '1rem'
            } : {
              fontSize: '1.4rem'
            })
          }}>
            Accede a tus aulas virtuales seleccionando tu nivel académico y sección.
          </p>
        </div>
      </header>

      {/* Sección de Niveles */}
      <section style={{ 
        position: 'relative',
        zIndex: 50,
        ...(isMobile ? {
          marginTop: '-40px',
          padding: '0 5%'
        } : {
          marginTop: '-85px',
          padding: '0 5%'
        })
      }}>
        <div style={{
          background: PALETTE.darkBanner,
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          ...(isMobile ? {
            borderRadius: '30px',
            padding: '2rem 1rem',
            flexDirection: 'column',
            gap: '20px'
          } : {
            borderRadius: '120px',
            padding: '2.5rem 4rem',
            flexDirection: 'row',
            justifyContent: 'space-around'
          })
        }}>
          {levels.map((item, i) => (
            <div 
              key={i} 
              ref={(el) => { menuRefs.current[i] = el; }}
              style={{ 
                position: 'relative',
                ...(isMobile ? {
                  width: '100%',
                  textAlign: 'center'
                } : {
                  width: 'auto',
                  textAlign: 'center'
                })
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: 'white',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  ...(isMobile ? {
                    padding: '15px',
                    borderRadius: '15px'
                  } : {
                    padding: '10px 20px',
                    borderRadius: '20px'
                  }),
                  ...(activeMenu === i ? { background: 'rgba(255,255,255,0.05)' } : {})
                }}
                onClick={() => handleLevelClick(i)}
                onMouseEnter={(e) => {
                  if (!isMobile && activeMenu !== i) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && activeMenu !== i) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <h3 style={{
                  margin: '0 0 5px 0',
                  transition: 'all 0.3s ease',
                  ...(isMobile ? { fontSize: '1.2rem' } : { fontSize: '1.4rem' })
                }}>{item.label}</h3>
                <p style={{
                  margin: 0,
                  transition: 'all 0.3s ease',
                  ...(isMobile ? { fontSize: '0.85rem' } : { fontSize: '0.95rem' })
                }}>{item.sub}</p>
              </div>

              {(activeMenu === i) && (
                <div style={{
                  background: '#081a14',
                  padding: '20px',
                  borderRadius: '25px',
                  border: `1px solid ${PALETTE.accent}`,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                  zIndex: 100,
                  ...(isMobile ? {
                    position: 'relative',
                    marginTop: '10px',
                    width: '100%'
                  } : {
                    position: 'absolute',
                    top: '110%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: '220px'
                  })
                }} className="fade-in">
                  {item.hasYearSelect ? (
                    <>
                      <span style={{
                        display: 'block',
                        color: PALETTE.accent,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        letterSpacing: '2px',
                        textAlign: 'center'
                      }}>Seleccionar Grado</span>
                      <select 
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '10px',
                          background: '#1a2e26',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          marginBottom: '15px',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        value={tempYear}
                        onChange={(e) => setTempYear(e.target.value)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = PALETTE.accent;
                          e.currentTarget.style.background = '#243b31';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                          e.currentTarget.style.background = '#1a2e26';
                        }}
                      >
                        <option value="">-- Elige --</option>
                        {item.years?.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>

                      <span style={{
                        display: 'block',
                        color: PALETTE.accent,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        letterSpacing: '2px',
                        textAlign: 'center'
                      }}>Sección</span>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        marginBottom: '15px',
                        flexWrap: 'wrap',
                        ...(isMobile ? { gap: '8px' } : { gap: '10px' })
                      }}>
                        {sections.map((sec) => (
                          <button 
                            key={sec} 
                            onClick={() => setTempSection(sec)}
                            style={{
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.3s ease',
                              border: '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              ...(isMobile ? {
                                width: '40px',
                                height: '40px'
                              } : {
                                width: '45px',
                                height: '45px'
                              }),
                              background: tempSection === sec ? PALETTE.accent : 'rgba(255,255,255,0.05)',
                              color: tempSection === sec ? '#081a14' : 'white'
                            }}
                            onMouseEnter={(e) => {
                              if (tempSection !== sec) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (tempSection !== sec) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            {sec}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          handleNavigation(item.href);
                          if (isMobile) setActiveMenu(null);
                        }} 
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '15px',
                          border: 'none',
                          background: PALETTE.accent,
                          color: '#081a14',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textTransform: 'uppercase',
                          fontSize: '0.8rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#00cc88';
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 187, 126, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = PALETTE.accent;
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        CONFIRMAR
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{
                        display: 'block',
                        color: PALETTE.accent,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        letterSpacing: '2px',
                        textAlign: 'center'
                      }}>Secciones</span>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        ...(isMobile ? { gap: '8px' } : { gap: '12px' })
                      }}>
                        {sections.map((sec) => (
                          <Link 
                            key={sec} 
                            href={`${item.href}/${sec.toLowerCase()}`}
                            style={{
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.3s ease',
                              border: '1px solid rgba(255,255,255,0.1)',
                              ...(isMobile ? {
                                width: '40px',
                                height: '40px'
                              } : {
                                width: '45px',
                                height: '45px'
                              }),
                              background: 'rgba(255,255,255,0.03)',
                              color: 'white'
                            }}
                            className="sec-btn"
                            onClick={() => isMobile && setActiveMenu(null)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = PALETTE.accent;
                              e.currentTarget.style.color = '#081a14';
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 187, 126, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {sec}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sección Calendario */}
      <section style={{ 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'center',
        ...(isMobile ? {
          padding: '80px 5% 60px'
        } : {
          padding: '140px 10% 100px'
        })
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s ease',
            ...(isMobile ? {
              padding: '2rem 1rem',
              borderRadius: '30px'
            } : {
              padding: '4rem 3rem',
              borderRadius: '50px'
            })
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <h4 style={{
              fontWeight: '900',
              marginBottom: '1rem',
              letterSpacing: '-1px',
              ...(isMobile ? {
                fontSize: '1.6rem'
              } : {
                fontSize: '2.5rem'
              })
            }}>
              CALENDARIO ESCOLAR
            </h4>
            <p style={{
              opacity: 0.8,
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto',
              ...(isMobile ? {
                fontSize: '0.9rem'
              } : {
                fontSize: '1.3rem'
              })
            }}>
              Mantente al tanto de eventos, feriados y evaluaciones para este año escolar 2026.
            </p>
            <button 
              style={{
                border: 'none',
                background: 'linear-gradient(180deg, #e3c5a5 0%, #c1a17b 100%)',
                fontWeight: 'bold',
                color: '#1a2e26',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '50px',
                ...(isMobile ? {
                  marginTop: '1.5rem',
                  padding: '12px 30px',
                  fontSize: '0.9rem'
                } : {
                  marginTop: '2.5rem',
                  padding: '16px 40px',
                  fontSize: '1.1rem'
                })
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, #f0d5b5 0%, #d4b08c 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, #e3c5a5 0%, #c1a17b 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center',
        color: '#6b7280',
        ...(isMobile ? {
          padding: '40px 20px',
          fontSize: '0.9rem'
        } : {
          padding: '60px',
          fontSize: '1.1rem'
        })
      }}>
        U.E Ciudad Cuatricentenaria © 2026
      </footer>

      {/* Scroll to top button solo para móviles */}
      {isMobile && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: PALETTE.accent,
            color: '#081a14',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00cc88';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = PALETTE.accent;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
          }}
        >
          ↑
        </button>
      )}

      <style jsx global>{`
        body { margin: 0; padding: 0; overflow-x: hidden; }
        
        .fade-in { 
          animation: fadeIn 0.25s ease-out; 
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .hover-glow {
          animation: glow 0.3s ease-out;
          text-shadow: 0 0 10px rgba(0, 187, 126, 0.5);
        }
        
        .hover-pulse {
          animation: pulse 0.3s ease-out;
        }
        
        @keyframes glow {
          from {
            text-shadow: 0 0 0px rgba(0, 187, 126, 0);
          }
          to {
            text-shadow: 0 0 10px rgba(0, 187, 126, 0.5);
          }
        }
        
        .sec-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @media (max-width: 768px) {
          .sec-btn:active {
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default ClassroomPortalPage;