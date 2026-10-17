// app/page.tsx
"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { sileo } from 'sileo';
import { User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AuthForm, type AuthFormData, type AuthFormErrors, type AuthFormField, type UserRole } from '@/lib/auth/AuthForm';
import { AuthService } from '@/lib/auth/AuthService';
import { RememberedEmailStore } from '@/lib/auth/RememberedEmailStore';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const authService = new AuthService();
const rememberedEmailStore = new RememberedEmailStore();

const AuthPage: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginExitoso, setLoginExitoso] = useState(false);
  const [errores, setErrores] = useState<AuthFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showCodigo, setShowCodigo] = useState(false);
  const rememberedEmail = useSyncExternalStore(
    rememberedEmailStore.subscribe,
    rememberedEmailStore.getSnapshot,
    rememberedEmailStore.getServerSnapshot
  );
  const [rememberMe, setRememberMe] = useState<boolean | null>(null);
  const [emailEdited, setEmailEdited] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>(() => AuthForm.createEmptyData());
  const emailActual = emailEdited ? formData.email : rememberedEmail || formData.email;
  const datosFormulario: AuthFormData = { ...formData, email: emailActual };

  useEffect(() => {
    if (loginExitoso && session?.user) {
      const role = session.user.role;
      if (role === 'DOCENTE') router.push('/editar');
      else if (role === 'ADMIN' || role === 'COORDINACION') router.push('/control_estudios');
      else router.push('/dashboard/estudiante');
    }
  }, [loginExitoso, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !loginExitoso) {
      const role = session.user.role;
      if (role === 'DOCENTE') router.push('/editar');
      else if (role === 'ADMIN' || role === 'COORDINACION') router.push('/control_estudios');
      else router.push('/dashboard/estudiante');
    }
  }, [status, session, router, loginExitoso]);

  // ✅ ¿Se requiere código de acceso? Solo para docente y control en modo registro
  const authForm = new AuthForm(datosFormulario, userRole, isLogin);
  const requiereCodigo = authForm.requiresAccessCode;

  const handleBlur = (campo: AuthFormField) => {
    const error = authForm.validateField(campo);
    setErrores((prev) => ({ ...prev, [campo]: error }));
  };

  const handleChange = (campo: AuthFormField, valor: string | null) => {
    if (campo === 'email') setEmailEdited(true);
    setFormData((prev) => ({ ...prev, [campo]: valor ?? '' }));
    if (errores[campo]) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = new AuthForm(datosFormulario, userRole, isLogin);
    const nuevosErrores = form.validate();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      const primerCampo = Object.keys(nuevosErrores)[0];
      sileo.error({
        title: 'Datos incompletos',
        description: nuevosErrores[primerCampo as AuthFormField] || '',
      });
      return;
    }

    setErrores({});
    setLoading(true);

    try {
      if (!isLogin) {
        // ✅ Validación adicional del código antes de enviar
        if (form.requiresAccessCode && !form.hasValidAccessCode()) {
          sileo.error({
            title: 'Código incorrecto',
            description: 'El código de acceso es inválido',
          });
          setLoading(false);
          return;
        }

        const registration = await authService.register(form.toRegistrationPayload());

        if (registration.error) {
          sileo.error({
            title: 'Error al registrar',
            description: registration.error,
          });
          setLoading(false);
          return;
        }

        sileo.success({
          title: '¡Cuenta creada!',
          description: `Bienvenido ${formData.nombre}`,
        });

        setIsLogin(true);
        setFormData(AuthForm.createEmptyData());
        setErrores({});
        setLoading(false);
        return;
      }

      const result = await authService.login(emailActual, formData.password);

      if (result?.error) {
        sileo.error({
          title: 'Credenciales incorrectas',
          description: 'Verifica tu correo y contraseña',
        });
        setLoading(false);
        return;
      }

      if (result?.ok) {
        authService.rememberEmail(emailActual, rememberMe ?? Boolean(rememberedEmail));
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
    setFormData(AuthForm.createEmptyData());
    setEmailEdited(false);
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
            {!isLogin && (
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
            )}

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
                            {authForm.getGradeOptions().map((grado) => (
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
                    value={emailActual}
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
                        checked={rememberMe ?? Boolean(rememberedEmail)}
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