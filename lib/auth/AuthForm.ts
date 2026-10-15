export type UserRole = 'teacher' | 'student' | 'control';

export interface AuthFormData {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  password: string;
  telefono: string;
  nivel: string;
  grado: string;
  seccion: string;
  codigoAcceso: string;
}

export type AuthFormField = keyof AuthFormData;
export type AuthFormErrors = Partial<Record<AuthFormField, string>>;

export interface RegistrationPayload {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
  cedulaIdentidad: string;
  role: 'DOCENTE' | 'ESTUDIANTE' | 'COORDINACION';
  nivel?: string;
  grado?: string;
  seccion?: string;
  especialidad?: string;
}

interface GradeOption {
  value: string;
  label: string;
}

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

const CODIGO_ACCESO_STAFF = 'cuatri.37';

export class AuthForm {
  constructor(
    private readonly data: AuthFormData,
    private readonly role: UserRole,
    private readonly isLogin: boolean
  ) {}

  static createEmptyData(): AuthFormData {
    return {
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      password: '',
      telefono: '',
      nivel: '',
      grado: '',
      seccion: '',
      codigoAcceso: '',
    };
  }

  get requiresAccessCode(): boolean {
    return !this.isLogin && this.isStaffRole;
  }

  validateField(field: AuthFormField): string | undefined {
    const value = this.data[field];
    const isRegistration = !this.isLogin;

    switch (field) {
      case 'email':
        if (!value.trim()) return MENSAJES.email.requerido;
        if (!REGEX.email.test(value.trim())) return MENSAJES.email.formato;
        return undefined;

      case 'password':
        if (!value) return MENSAJES.password.requerido;
        if (isRegistration && !REGEX.password.test(value)) {
          return MENSAJES.password.formato;
        }
        return undefined;

      case 'nombre':
        if (!isRegistration) return undefined;
        if (!value.trim()) return MENSAJES.nombre.requerido;
        if (!REGEX.nombre.test(value.trim())) return MENSAJES.nombre.formato;
        return undefined;

      case 'apellido':
        if (!isRegistration) return undefined;
        if (value.trim() && !REGEX.nombre.test(value.trim())) {
          return MENSAJES.apellido.formato;
        }
        return undefined;

      case 'cedula':
        if (!isRegistration) return undefined;
        if (!value.trim()) return MENSAJES.cedula.requerido;
        if (!REGEX.cedula.test(value.trim())) return MENSAJES.cedula.formato;
        return undefined;

      case 'telefono':
        if (!isRegistration) return undefined;
        if (value.trim() && !REGEX.telefono.test(value.trim())) {
          return MENSAJES.telefono.formato;
        }
        return undefined;

      case 'nivel':
        if (!isRegistration || this.role !== 'student') return undefined;
        if (!value) return MENSAJES.nivel.requerido;
        return undefined;

      case 'grado':
        if (!isRegistration || this.role !== 'student') return undefined;
        if (!value) return MENSAJES.grado.requerido;
        return undefined;

      case 'seccion':
        if (!isRegistration || this.role !== 'student') return undefined;
        if (this.data.nivel === 'preescolar') return undefined;
        if (!value) return MENSAJES.seccion.requerido;
        return undefined;

      case 'codigoAcceso':
        if (!this.requiresAccessCode) return undefined;
        if (!value.trim()) return MENSAJES.codigoAcceso.requerido;
        if (!this.hasValidAccessCode()) return MENSAJES.codigoAcceso.formato;
        return undefined;
    }
  }

  validate(): AuthFormErrors {
    const fields: AuthFormField[] = this.isLogin
      ? ['email', 'password']
      : [
          'nombre',
          'apellido',
          'cedula',
          'email',
          'password',
          'telefono',
          'nivel',
          'grado',
          'seccion',
        ];

    if (this.requiresAccessCode) fields.push('codigoAcceso');

    return fields.reduce<AuthFormErrors>((errors, field) => {
      const error = this.validateField(field);
      if (error) errors[field] = error;
      return errors;
    }, {});
  }

  getGradeOptions(): GradeOption[] {
    switch (this.data.nivel) {
      case 'preescolar':
        return [
          { value: '1er_nivel', label: '1er Nivel' },
          { value: '2do_nivel', label: '2do Nivel' },
          { value: '3er_nivel', label: '3er Nivel' },
        ];
      case 'primaria':
        return [
          { value: '1er_grado', label: '1er Grado' },
          { value: '2do_grado', label: '2do Grado' },
          { value: '3er_grado', label: '3er Grado' },
          { value: '4to_grado', label: '4to Grado' },
          { value: '5to_grado', label: '5to Grado' },
          { value: '6to_grado', label: '6to Grado' },
        ];
      case 'bachillerato':
        return [
          { value: '1er_ano', label: '1er Año' },
          { value: '2do_ano', label: '2do Año' },
          { value: '3er_ano', label: '3er Año' },
          { value: '4to_ano', label: '4to Año' },
          { value: '5to_ano', label: '5to Año' },
        ];
      default:
        return [];
    }
  }

  hasValidAccessCode(): boolean {
    return this.data.codigoAcceso.trim() === CODIGO_ACCESO_STAFF;
  }

  toRegistrationPayload(): RegistrationPayload {
    const roleMap: Record<UserRole, RegistrationPayload['role']> = {
      teacher: 'DOCENTE',
      student: 'ESTUDIANTE',
      control: 'COORDINACION',
    };

    const nivelNormalizado = this.normalizeLevel(this.data.nivel);

    return {
      email: this.data.email.trim().toLowerCase(),
      password: this.data.password,
      nombre: this.data.nombre.trim() || 'Usuario',
      apellido: this.data.apellido.trim(),
      telefono: this.data.telefono || '',
      cedulaIdentidad: this.data.cedula.trim(),
      role: roleMap[this.role],
      nivel: this.role === 'student' ? nivelNormalizado : undefined,
      grado: this.role === 'student' ? this.normalizeGrade(this.data.grado) : undefined,
      seccion: this.role === 'student'
        ? this.normalizeSection(this.data.seccion, this.data.nivel)
        : undefined,
      especialidad: this.role === 'teacher' ? 'General' : undefined,
    };
  }

  private get isStaffRole(): boolean {
    return this.role === 'teacher' || this.role === 'control';
  }

  private normalizeLevel(level: string): string {
    const levels: Record<string, string> = {
      preescolar: 'inicial',
      primaria: 'primaria',
      bachillerato: 'media',
      inicial: 'inicial',
      media: 'media',
    };
    return levels[level] || level;
  }

  private normalizeGrade(grade: string): string {
    const grades: Record<string, string> = {
      '1er_nivel': 'Pre-Kinder',
      '2do_nivel': 'Kinder',
      '3er_nivel': 'Preparatorio',
      '1er_grado': '1er Grado',
      '2do_grado': '2do Grado',
      '3er_grado': '3er Grado',
      '4to_grado': '4to Grado',
      '5to_grado': '5to Grado',
      '6to_grado': '6to Grado',
      '1er_ano': '1er Año',
      '2do_ano': '2do Año',
      '3er_ano': '3er Año',
      '4to_ano': '4to Año',
      '5to_ano': '5to Año',
    };
    if (
      grade.includes(' ') ||
      grade === 'Pre-Kinder' ||
      grade === 'Kinder' ||
      grade === 'Preparatorio'
    ) {
      return grade;
    }
    return grades[grade] || grade;
  }

  private normalizeSection(section: string, level?: string): string {
    if (level === 'preescolar' || level === 'inicial') return 'Única';
    return section.toUpperCase().trim();
  }
}
