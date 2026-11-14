import { Role, type PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import { StudentAssignmentService } from '@/lib/asignar';
import { EmailVerificationService } from '@/lib/services/email-verification-service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

interface RegistrationPayload {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  cedulaIdentidad?: string;
  role?: string;
  especialidad?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  nombre: string;
  role: Role;
}

export type RegistrationResult =
  | { success: true; message: string; user: RegisteredUser }
  | { success: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOptionalString(
  payload: Record<string, unknown>,
  field: keyof RegistrationPayload,
): string | undefined {
  const value = payload[field];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new TypeError(`Invalid registration field: ${field}`);
  return value;
}

function getRegistrationValidationError(value: unknown): string | undefined {
  if (!isRecord(value)) return 'Faltan campos requeridos: email, password y nombre';

  const email = value.email;
  const password = value.password;
  const nombre = value.nombre;

  if (typeof email !== 'string' || !email.trim()) return 'El correo es obligatorio';
  if (!EMAIL_REGEX.test(email.trim().toLowerCase())) return 'Ingresa un correo válido';

  if (typeof password !== 'string' || !password.trim()) return 'La contraseña es obligatoria';
  if (!PASSWORD_REGEX.test(password.trim())) {
    return 'La contraseña debe tener mínimo 6 caracteres, con al menos 1 letra y 1 número';
  }

  if (typeof nombre !== 'string' || !nombre.trim()) return 'El nombre es obligatorio';

  return undefined;
}

function parsePayload(value: unknown): RegistrationPayload | null {
  if (!isRecord(value)) return null;

  if (getRegistrationValidationError(value)) return null;

  const email = value.email as string;
  const password = value.password as string;
  const nombre = value.nombre as string;

  const optionalFields = [
    'apellido',
    'telefono',
    'cedulaIdentidad',
    'role',
    'especialidad',
    'nivel',
    'grado',
    'seccion',
  ] as const;
  if (
    optionalFields.some((field) => {
      const fieldValue = value[field];
      return fieldValue !== undefined
        && fieldValue !== null
        && fieldValue !== ''
        && typeof fieldValue !== 'string';
    })
  ) {
    return null;
  }

  return {
    email: email.trim().toLowerCase(),
    password: password.trim(),
    nombre: nombre.trim(),
    apellido: readOptionalString(value, 'apellido'),
    telefono: readOptionalString(value, 'telefono'),
    cedulaIdentidad: readOptionalString(value, 'cedulaIdentidad'),
    role: readOptionalString(value, 'role'),
    especialidad: readOptionalString(value, 'especialidad'),
    nivel: readOptionalString(value, 'nivel'),
    grado: readOptionalString(value, 'grado'),
    seccion: readOptionalString(value, 'seccion'),
  };
}

export class AuthRegisterService {
  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    private readonly contentAssignmentService: StudentAssignmentService =
      new StudentAssignmentService(prismaClient),
    private readonly emailVerificationService: EmailVerificationService =
      new EmailVerificationService(prismaClient),
  ) {}

  private async sendConfirmationEmail(user: RegisteredUser): Promise<string | undefined> {
    try {
      await this.emailVerificationService.sendVerification(user.id, user.email);
      return undefined;
    } catch (error) {
      console.error('Error al enviar el correo de verificación:', error);
      return 'La cuenta quedó pendiente de verificación, pero no se pudo enviar el correo. Revisa la configuración del servicio e inténtalo de nuevo.';
    }
  }

  async register(input: unknown): Promise<RegistrationResult> {
    const validationError = getRegistrationValidationError(input);
    const payload = parsePayload(input);
    if (!payload) {
      return {
        success: false,
        error: validationError ?? 'Faltan campos requeridos o el formato es inválido: email, password y nombre',
      };
    }

    const rolesValidos: Role[] = [
      Role.ESTUDIANTE,
      Role.DOCENTE,
      Role.ADMIN,
      Role.COORDINACION,
    ];
    const rolFinal = (payload.role && rolesValidos.includes(payload.role as Role))
      ? (payload.role as Role)
      : Role.ESTUDIANTE;

    const existingUser = await this.prismaClient.user.findUnique({
      where: { email: payload.email },
    });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return { success: false, error: 'El email ya está registrado' };
      }

      const emailError = await this.sendConfirmationEmail(existingUser);
      if (emailError) return { success: false, error: emailError };

      return {
        success: true,
        message: 'Se envió el enlace de verificación',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          nombre: existingUser.nombre,
          role: existingUser.role,
        },
      };
    }

    if (payload.cedulaIdentidad && rolFinal === Role.ESTUDIANTE) {
      const existingCedula = await this.prismaClient.estudiante.findUnique({
        where: { cedulaIdentidad: payload.cedulaIdentidad },
      });
      if (existingCedula) {
        return { success: false, error: 'La cédula ya está registrada' };
      }
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const result = await this.prismaClient.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: payload.email,
          password: hashedPassword,
          nombre: payload.nombre,
          apellido: payload.apellido || null,
          telefono: payload.telefono || null,
          role: rolFinal,
          isVerified: false,
        },
      });

      let estudiante;
      if (rolFinal === Role.DOCENTE) {
        await tx.docente.create({
          data: {
            userId: user.id,
            especialidad: payload.especialidad || null,
          },
        });
      } else if (rolFinal === Role.ESTUDIANTE) {
        estudiante = await tx.estudiante.create({
          data: {
            userId: user.id,
            cedulaIdentidad: payload.cedulaIdentidad || null,
            nivel: payload.nivel || '',
            grado: payload.grado || '',
            seccion: payload.seccion || '',
          },
          select: { id: true, nivel: true, grado: true, seccion: true },
        });
      }

      return { user, estudiante };
    });

    if (result.estudiante) {
      await this.contentAssignmentService.assignExistingContent(result.estudiante);
    }

    const registeredUser = {
      id: result.user.id,
      email: result.user.email,
      nombre: result.user.nombre,
      role: result.user.role,
    };
    const emailError = await this.sendConfirmationEmail(registeredUser);
    if (emailError) return { success: false, error: emailError };

    return {
      success: true,
      message: 'Usuario registrado. Confirma tu correo para activar la cuenta.',
      user: registeredUser,
    };
  }
}

export const authRegisterService = new AuthRegisterService();
