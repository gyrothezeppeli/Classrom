// app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';
import { User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLORES = {
  principal: '#00BB7E',
  deepBg: '#1a2e26',
  error: '#ef4444'
};

type UserRole = 'teacher' | 'student' | 'control';

// ============================================
// CÓDIGO DE ACCESO PARA DOCENTES Y CONTROL
// ============================================
const CODIGO_ACCESO_STAFF = 'cuatri.37';

// ============================================
// VALIDADORES
// ============================================

const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  nombre: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/,
  cedula: /^[VEJvej]?-?\d{6,9}$/,
  telefono: /^(\+58|0)?4\d{2}-?\d{7}$/,
  password: /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/,
};

const MENSAJES = {
  email: {
    requerido: 'El correo es obligatorio',
    formato: 'Ingresa un correo válido',
  },
  password: {
    requerido: 'La contraseña es obligatoria',
    formato: 'Mínimo 6 caracteres, con al menos 1 letra y 1 número',
  },
  nombre: {
    requerido: 'El nombre es obligatorio',
    formato: 'Mínimo 2 letras. Solo letras y espacios',
  },
  apellido: {
    formato: 'Solo letras y espacios',
  },
  cedula: {
    requerido: 'La cédula es obligatoria',
    formato: 'Formato inválido',
  },
  telefono: {
    formato: 'Formato inválido',
  },
  nivel: { requerido: 'Selecciona un nivel' },
  grado: { requerido: 'Selecciona un grado' },
  seccion: { requerido: 'Selecciona una sección' },
  codigoAcceso: {
    requerido: 'El código de acceso es obligatorio',
    formato: 'Código de acceso incorrecto',
  },
};

interface ErroresForm {
  nombre?: string;
  apellido?: string;
  cedula?: string;
  email?: string;
  password?: string;
  telefono?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
  codigoAcceso?: string;
}

function normalizarNivel(nivel: string): string {
  const mapa: { [key: string]: string } = {
    'preescolar': 'inicial',
    'primaria': 'primaria',
    'bachillerato': 'media',
    'inicial': 'inicial',
    'media': 'media',
  };
  return mapa[nivel] || nivel;
}

function normalizarGrado(grado: string): string {
  const mapa: { [key: string]: string } = {
    '1er_ano': '1ro', '2do_ano': '2do', '3er_ano': '3ro', '4to_ano': '4to', '5to_ano': '5to',
    '1er Año': '1ro', '2do Año': '2do', '3er Año': '3ro', '4to Año': '4to', '5to Año': '5to',
    '1er Grado': '1ro', '2do Grado': '2do', '3er Grado': '3ro', '4to Grado': '4to',
    '5to Grado': '5to', '6to Grado': '6to',
  };
  return mapa[grado] || grado;
}

function normalizarSeccion(seccion: string, nivel?: string): string {
  if (nivel === 'preescolar' || nivel === 'inicial') {
    return 'Única';
  }
  return seccion?.toUpperCase()?.trim() || '';
}

const REMEMBER_ME_KEY = 'portal_remember_email';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginExitoso, setLoginExitoso] = useState(false);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCodigo, setShowCodigo] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    password: '',
    telefono: '',
    nivel: '',
    grado: '',
    seccion: '',
    codigoAcceso: ''
  });

  useEffect(() => {
    try {
      const emailGuardado = localStorage.getItem(REMEMBER_ME_KEY);
      if (emailGuardado) {
        setFormData((prev) => ({ ...prev, email: emailGuardado }));
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error al leer localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (loginExitoso && session?.user) {
      const role = (session.user as any).role;
      if (role === 'DOCENTE') router.push('/editar');
      else if (role === 'ADMIN' || role === 'COORDINACION') router.push('/control_estudios');
      else router.push('/dashboard/estudiante');
    }
  }, [loginExitoso, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !loginExitoso) {
      const role = (session.user as any).role;
      if (role === 'DOCENTE') router.push('/editar');
      else if (role === 'ADMIN' || role === 'COORDINACION') router.push('/control_estudios');
      else router.push('/dashboard/estudiante');
    }
  }, [status, session, router, loginExitoso]);

  // ✅ ¿Se requiere código de acceso? Solo para docente y control en modo registro
  const requiereCodigo = !isLogin && (userRole === 'teacher' || userRole === 'control');

  const validarCampo = (campo: keyof ErroresForm, valor: string): string | undefined => {
    const esRegistro = !isLogin;

    switch (campo) {
      case 'email':
        if (!valor.trim()) return MENSAJES.email.requerido;
        if (!REGEX.email.test(valor.trim())) return MENSAJES.email.formato;
        return undefined;

      case 'password':
        if (!valor) return MENSAJES.password.requerido;
        if (esRegistro && !REGEX.password.test(valor)) return MENSAJES.password.formato;
        return undefined;

      case 'nombre':
        if (!esRegistro) return undefined;
        if (!valor.trim()) return MENSAJES.nombre.requerido;
        if (!REGEX.nombre.test(valor.trim())) return MENSAJES.nombre.formato;
        return undefined;

      case 'apellido':
        if (!esRegistro) return undefined;
        if (valor.trim() && !REGEX.nombre.test(valor.trim())) return MENSAJES.apellido.formato;
        return undefined;

      case 'cedula':
        if (!esRegistro) return undefined;
        if (!valor.trim()) return MENSAJES.cedula.requerido;
        if (!REGEX.cedula.test(valor.trim())) return MENSAJES.cedula.formato;
        return undefined;

      case 'telefono':
        if (!esRegistro) return undefined;
        if (valor.trim() && !REGEX.telefono.test(valor.trim())) return MENSAJES.telefono.formato;
        return undefined;

      case 'nivel':
        if (!esRegistro || userRole !== 'student') return undefined;
        if (!valor) return MENSAJES.nivel.requerido;
        return undefined;

      case 'grado':
        if (!esRegistro || userRole !== 'student') return undefined;
        if (!valor) return MENSAJES.grado.requerido;
        return undefined;

      case 'seccion':
        if (!esRegistro || userRole !== 'student') return undefined;
        if (formData.nivel === 'preescolar') return undefined;
        if (!valor) return MENSAJES.seccion.requerido;
        return undefined;

      // ✅ Validación del código de acceso
      case 'codigoAcceso':
        if (!esRegistro) return undefined;
        if (userRole !== 'teacher' && userRole !== 'control') return undefined;
        if (!valor.trim()) return MENSAJES.codigoAcceso.requerido;
        if (valor.trim() !== CODIGO_ACCESO_STAFF) return MENSAJES.codigoAcceso.formato;
        return undefined;

      default:
        return undefined;
    }
  };

  const validarFormulario = (): ErroresForm => {
    const nuevosErrores: ErroresForm = {};

    let camposAValidar: (keyof ErroresForm)[] = isLogin
      ? ['email', 'password']
      : ['nombre', 'apellido', 'cedula', 'email', 'password', 'telefono', 'nivel', 'grado', 'seccion'];

    // ✅ Agregar validación de código para docente y control
    if (!isLogin && (userRole === 'teacher' || userRole === 'control')) {
      camposAValidar = [...camposAValidar, 'codigoAcceso'];
    }

    camposAValidar.forEach((campo) => {
      const error = validarCampo(campo, formData[campo] || '');
      if (error) nuevosErrores[campo] = error;
    });

    return nuevosErrores;
  };

  const handleBlur = (campo: keyof ErroresForm) => {
    const error = validarCampo(campo, formData[campo] || '');
    setErrores((prev) => ({ ...prev, [campo]: error }));
  };

  const handleChange = (campo: string, valor: string | null) => {
    setFormData((prev) => ({ ...prev, [campo]: valor ?? '' }));
    if (errores[campo as keyof ErroresForm]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };

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
    switch (formData.nivel) {
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

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      const primerCampo = Object.keys(nuevosErrores)[0];
      sileo.error({
        title: 'Datos incompletos',
        description: nuevosErrores[primerCampo as keyof ErroresForm] || '',
      });
      return;
    }

    setErrores({});
    setLoading(true);

    try {
      if (!isLogin) {
        // ✅ Validación adicional del código antes de enviar
        if (
          (userRole === 'teacher' || userRole === 'control') &&
          formData.codigoAcceso.trim() !== CODIGO_ACCESO_STAFF
        ) {
          sileo.error({
            title: 'Código incorrecto',
            description: 'El código de acceso es inválido',
          });
          setLoading(false);
          return;
        }

        const roleMap = {
          teacher: 'DOCENTE',
          student: 'ESTUDIANTE',
          control: 'COORDINACION'
        };

        const nivelNormalizado = normalizarNivel(formData.nivel);
        const gradoNormalizado = normalizarGrado(formData.grado);
        const seccionNormalizada = normalizarSeccion(formData.seccion, formData.nivel);

        const userData = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          nombre: formData.nombre.trim() || 'Usuario',
          apellido: formData.apellido?.trim() || '',
          telefono: formData.telefono || '',
          cedulaIdentidad: formData.cedula.trim() || '',
          role: roleMap[userRole],
          nivel: userRole === 'student' ? nivelNormalizado : undefined,
          grado: userRole === 'student' ? gradoNormalizado : undefined,
          seccion: userRole === 'student' ? seccionNormalizada : undefined,
          especialidad: userRole === 'teacher' ? 'General' : undefined,
        };

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
          sileo.error({
            title: 'Error al registrar',
            description: data.error || 'Intenta de nuevo',
          });
          setLoading(false);
          return;
        }

        sileo.success({
          title: '¡Cuenta creada!',
          description: `Bienvenido ${formData.nombre}`,
        });

        setIsLogin(true);
        setFormData({
          nombre: '', apellido: '', cedula: '', email: '', password: '',
          telefono: '', nivel: '', grado: '', seccion: '', codigoAcceso: ''
        });
        setErrores({});
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        sileo.error({
          title: 'Credenciales incorrectas',
          description: 'Verifica tu correo y contraseña',
        });
        setLoading(false);
        return;
      }

      if (result?.ok) {
        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, formData.email.trim().toLowerCase());
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
          }
        } catch (error) {
          console.error('Error al guardar en localStorage:', error);
        }
        setLoginExitoso(true);
      }
    } catch (error) {
      console.error('Error general:', error);
      sileo.error({
        title: 'Error de conexión',
        description: 'Verifica que el servidor esté funcionando',
      });
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      nombre: '', apellido: '', cedula: '', email: '', password: '',
      telefono: '', nivel: '', grado: '', seccion: '', codigoAcceso: ''
    });
    setErrores({});
  };

  const inputClass = "w-full bg-white/10 border border-white/15 text-white placeholder:text-white/50 rounded-2xl h-14 pl-5 pr-14 outline-none focus:border-white/40 focus:bg-white/15 transition-all backdrop-blur-md text-sm";
  const inputNoIconClass = "w-full bg-white/10 border border-white/15 text-white placeholder:text-white/50 rounded-2xl h-14 px-5 outline-none focus:border-white/40 focus:bg-white/15 transition-all backdrop-blur-md text-sm";
  const inputErrorClass = "w-full bg-white/10 border border-red-400/60 text-white placeholder:text-white/50 rounded-2xl h-14 pl-5 pr-14 outline-none focus:border-red-400 focus:bg-white/15 transition-all backdrop-blur-md text-sm";
  const inputNoIconErrorClass = "w-full bg-white/10 border border-red-400/60 text-white placeholder:text-white/50 rounded-2xl h-14 px-5 outline-none focus:border-red-400 focus:bg-white/15 transition-all backdrop-blur-md text-sm";

  // Índice del rol activo (para el indicador deslizante)
  const roleIndex = userRole === 'teacher' ? 0 : userRole === 'student' ? 1 : 2;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative p-5"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Fondo: imagen nítida + overlay oscuro sutil */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/assets/img/pc2.jpeg")' }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <div className="liquid-login-card rounded-[40px] p-8 sm:p-10">
          <div className="liquid-login-content">

            {/* Título */}
            <div className="text-left mb-6">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
              </h1>
              <p className="text-white/60 text-sm">
                {isLogin
                  ? 'Bienvenido de nuevo, ingresa a tu cuenta'
                  : 'Completa tus datos para registrarte'}
              </p>
            </div>

            {/* Selector de rol con indicador deslizante */}
            <div className="relative flex gap-2 mb-6 p-1 rounded-2xl bg-black/25 backdrop-blur-md">
              {/* Indicador deslizante verde */}
              <div
                className="absolute top-1 bottom-1 rounded-xl transition-all duration-500 pointer-events-none"
                style={{
                  width: 'calc((100% - 0.5rem - 1rem) / 3)',
                  left: `calc(0.25rem + ${roleIndex} * ((100% - 0.5rem - 1rem) / 3) + ${roleIndex * 0.5}rem)`,
                  background: 'linear-gradient(135deg, rgba(0, 187, 126, 0.95), rgba(0, 187, 126, 0.75))',
                  boxShadow: '0 4px 20px rgba(0, 187, 126, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />

              {/* Botones */}
              {[
                { id: 'teacher' as const, label: 'Docente' },
                { id: 'student' as const, label: 'Estudiante' },
                { id: 'control' as const, label: 'Control' }
              ].map((rol) => (
                <button
                  key={rol.id}
                  onClick={() => {
                    setUserRole(rol.id);
                    setIsLogin(true);
                    resetFormData();
                  }}
                  disabled={loading}
                  className="relative flex-1 py-2 rounded-xl text-[11px] font-semibold transition-colors duration-300 z-10 disabled:cursor-not-allowed"
                  style={{
                    color: userRole === rol.id ? '#0a1f15' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <span
                    className="block transition-transform duration-300"
                    style={{
                      transform: userRole === rol.id ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    {rol.label}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {!isLogin && (
                <>
                  <div>
                    <input
                      type="text"
                      placeholder="Nombres *"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      onBlur={() => handleBlur('nombre')}
                      disabled={loading}
                      className={errores.nombre ? inputNoIconErrorClass : inputNoIconClass}
                    />
                    {errores.nombre && (
                      <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.nombre}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Apellidos"
                      value={formData.apellido}
                      onChange={(e) => handleChange('apellido', e.target.value)}
                      onBlur={() => handleBlur('apellido')}
                      disabled={loading}
                      className={errores.apellido ? inputNoIconErrorClass : inputNoIconClass}
                    />
                    {errores.apellido && (
                      <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.apellido}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Cédula de identidad *"
                      value={formData.cedula}
                      onChange={(e) => handleChange('cedula', e.target.value)}
                      onBlur={() => handleBlur('cedula')}
                      disabled={loading}
                      className={errores.cedula ? inputNoIconErrorClass : inputNoIconClass}
                    />
                    {errores.cedula && (
                      <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.cedula}</p>
                    )}
                  </div>

                  {/* ✅ CAMPO DE CÓDIGO DE ACCESO (solo docente y control) */}
                  {requiereCodigo && (
                    <div>
                      <div className="relative">
                        <input
                          type={showCodigo ? 'text' : 'password'}
                          placeholder="Código de acceso *"
                          value={formData.codigoAcceso}
                          onChange={(e) => handleChange('codigoAcceso', e.target.value)}
                          onBlur={() => handleBlur('codigoAcceso')}
                          disabled={loading}
                          className={errores.codigoAcceso ? inputErrorClass : inputClass}
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCodigo(!showCodigo)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                          tabIndex={-1}
                        >
                          {showCodigo ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <ShieldCheck className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {errores.codigoAcceso && (
                        <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.codigoAcceso}</p>
                      )}
                      <p className="text-[11px] text-white/50 mt-1 pl-2">
                        Requerido para docentes y personal de control
                      </p>
                    </div>
                  )}

                  {userRole === 'student' && (
                    <>
                      <div>
                        <Select
                          value={formData.nivel}
                          onValueChange={(value) => {
                            const nivel = value ?? '';
                            setFormData({ ...formData, nivel, grado: '', seccion: '' });
                            setErrores((prev) => ({ ...prev, nivel: undefined, grado: undefined, seccion: undefined }));
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger className={errores.nivel ? `${inputNoIconErrorClass} flex items-center` : `${inputNoIconClass} flex items-center`}>
                            <SelectValue placeholder="Nivel de estudio *" />
                          </SelectTrigger>
                          <SelectContent>
                            {niveles.map((nivel) => (
                              <SelectItem key={nivel.value} value={nivel.value}>
                                {nivel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errores.nivel && (
                          <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.nivel}</p>
                        )}
                      </div>

                      <div>
                        <Select
                          value={formData.grado}
                          onValueChange={(value) => handleChange('grado', value)}
                          disabled={loading || !formData.nivel}
                        >
                          <SelectTrigger className={errores.grado ? `${inputNoIconErrorClass} flex items-center` : `${inputNoIconClass} flex items-center`}>
                            <SelectValue placeholder={formData.nivel ? 'Grado/Año *' : 'Primero selecciona un nivel'} />
                          </SelectTrigger>
                          <SelectContent>
                            {getOpcionesGrado().map((grado) => (
                              <SelectItem key={grado.value} value={grado.value}>
                                {grado.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errores.grado && (
                          <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.grado}</p>
                        )}
                      </div>

                      {formData.nivel !== 'preescolar' && (
                        <div>
                          <Select
                            value={formData.seccion}
                            onValueChange={(value) => handleChange('seccion', value)}
                            disabled={loading}
                          >
                            <SelectTrigger className={errores.seccion ? `${inputNoIconErrorClass} flex items-center` : `${inputNoIconClass} flex items-center`}>
                              <SelectValue placeholder="Sección *" />
                            </SelectTrigger>
                            <SelectContent>
                              {secciones.map((seccion) => (
                                <SelectItem key={seccion.value} value={seccion.value}>
                                  {seccion.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errores.seccion && (
                            <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.seccion}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      onBlur={() => handleBlur('telefono')}
                      disabled={loading}
                      className={errores.telefono ? inputNoIconErrorClass : inputNoIconClass}
                    />
                    {errores.telefono && (
                      <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.telefono}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={loading}
                    className={errores.email ? inputErrorClass : inputClass}
                  />
                  <User className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                </div>
                {errores.email && (
                  <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.email}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    className={errores.password ? inputErrorClass : inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errores.password && (
                  <p className="text-xs text-red-300 mt-1 font-medium pl-2">{errores.password}</p>
                )}
              </div>

              {isLogin && (
                <div className="flex items-center gap-2 mt-1 pl-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <span className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="w-5 h-5 rounded-md border border-white/30 bg-white/5 backdrop-blur-sm flex items-center justify-center transition-all peer-checked:bg-white/90 peer-checked:border-white/90">
                        {rememberMe && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-3.5 h-3.5 text-[#1a2e26]"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
                      Recordarme
                    </span>
                  </label>
                </div>
              )}

              {/* Botón principal con hover verde */}
              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full h-14 rounded-2xl font-semibold text-base text-[#1a2e26] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? 'rgba(255,255,255,0.5)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00BB7E, #00d68f)';
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,187,126,0.5), inset 0 1px 0 rgba(255,255,255,0.6)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)';
                    e.currentTarget.style.color = '#1a2e26';
                  }
                }}
              >
                {loading ? 'Procesando...' : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
              </button>

              <p className="text-center text-white/60 text-sm mt-2">
                {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrores({});
                    resetFormData();
                  }}
                  className="text-white hover:text-emerald-400 font-semibold underline-offset-2 hover:underline transition-all"
                >
                  {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;