/**
 * MFA (Multi-Factor Authentication) Utilities
 * Implements TOTP (Time-based One-Time Password) using RFC 6238
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';

// Configure authenticator settings
authenticator.options = {
  window: 1, // Allow 1 step tolerance (30 seconds before/after)
  digits: 6,
  step: 30, // 30 second intervals
};

const APP_NAME = 'VistralAI';
const BACKUP_CODES_COUNT = 10;

/**
 * Generate a new MFA secret for a user
 */
export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for MFA setup
 */
export async function generateMfaQrCode(email: string, secret: string): Promise<string> {
  const otpauth = authenticator.keyuri(email, APP_NAME, secret);
  return QRCode.toDataURL(otpauth);
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyMfaCode(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * Generate backup codes for MFA recovery
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Hash backup codes for secure storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code =>
    crypto.createHash('sha256').update(code).digest('hex')
  );
}

/**
 * Verify a backup code against stored hashed codes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
  return hashedCodes.includes(hashedInput);
}

/**
 * Setup MFA for a user
 * Returns the secret, QR code data URL, and backup codes
 */
export async function setupMfa(userId: string, email: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  const secret = generateMfaSecret();
  const qrCode = await generateMfaQrCode(email, secret);
  const backupCodes = generateBackupCodes();

  return { secret, qrCode, backupCodes };
}

/**
 * Enable MFA for a user after successful verification
 */
export async function enableMfa(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: hashedBackupCodes,
    },
  });
}

/**
 * Disable MFA for a user
 */
export async function disableMfa(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    },
  });
}

/**
 * Verify MFA for a user (TOTP or backup code)
 */
export async function verifyUserMfa(
  userId: string,
  code: string
): Promise<{ success: boolean; usedBackupCode: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
      mfaSecret: true,
      mfaBackupCodes: true,
    },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return { success: false, usedBackupCode: false };
  }

  // Try TOTP verification first
  if (verifyMfaCode(code, user.mfaSecret)) {
    return { success: true, usedBackupCode: false };
  }

  // Try backup code verification
  // Normalize code format (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`;

  if (verifyBackupCode(formattedCode, user.mfaBackupCodes)) {
    // Remove used backup code
    const hashedUsedCode = crypto.createHash('sha256').update(formattedCode).digest('hex');
    const remainingCodes = user.mfaBackupCodes.filter((c: string) => c !== hashedUsedCode);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: remainingCodes },
    });

    return { success: true, usedBackupCode: true };
  }

  return { success: false, usedBackupCode: false };
}

/**
 * Check if a user has MFA enabled
 */
export async function userHasMfaEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  return user?.mfaEnabled ?? false;
}

/**
 * Get remaining backup codes count for a user
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaBackupCodes: true },
  });

  return user?.mfaBackupCodes.length ?? 0;
}

/**
 * Regenerate backup codes for a user
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: { mfaBackupCodes: hashedBackupCodes },
  });

  return backupCodes;
}
