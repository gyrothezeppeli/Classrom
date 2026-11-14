import { createHash, randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { getAppBaseUrl, sendVerificationEmail } from '@/lib/email/smtp';

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export class EmailVerificationService {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  async sendVerification(userId: string, email: string): Promise<void> {
    const now = new Date();
    const existingToken = await this.prismaClient.emailVerificationToken.findUnique({
      where: { userId },
    });

    if (
      existingToken?.sentAt &&
      now.getTime() - existingToken.sentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS);

    await this.prismaClient.emailVerificationToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt },
      update: { tokenHash, expiresAt, sentAt: null },
    });

    const verificationUrl = new URL('/api/auth/verify-email', getAppBaseUrl());
    verificationUrl.searchParams.set('token', token);
    await sendVerificationEmail(email, verificationUrl.toString());

    await this.prismaClient.emailVerificationToken.update({
      where: { userId },
      data: { sentAt: now },
    });
  }

  async verify(token: string): Promise<boolean> {
    if (!/^[a-f0-9]{64}$/i.test(token)) return false;

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const verification = await this.prismaClient.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    if (!verification) return false;

    const now = new Date();
    if (verification.expiresAt <= now) {
      await this.prismaClient.emailVerificationToken.deleteMany({
        where: { id: verification.id },
      });
      return false;
    }

    return this.prismaClient.$transaction(async (transaction) => {
      const consumed = await transaction.emailVerificationToken.deleteMany({
        where: { id: verification.id, expiresAt: { gt: now } },
      });
      if (consumed.count !== 1) return false;

      await transaction.user.update({
        where: { id: verification.userId },
        data: { emailVerified: now, isVerified: true },
      });
      return true;
    });
  }
}

export const emailVerificationService = new EmailVerificationService();
