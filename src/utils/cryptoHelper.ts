import crypto from 'crypto';
import { Employee, Payslip } from '../types';

// AES-256-GCM Encryption Key (32 bytes)
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'apex-payroll-aes256-secret-key-32b!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM mode

// Ensure key is exactly 32 bytes
function getSecretKeyBuffer(): Buffer {
  return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

/**
 * Encrypt a plain text string using AES-256-GCM
 */
export function encryptField(plainText: string | null | undefined): string {
  if (!plainText) return '';
  // If already encrypted, don't re-encrypt
  if (plainText.startsWith('ENC:GCM:')) {
    return plainText;
  }

  try {
    const key = getSecretKeyBuffer();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `ENC:GCM:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText;
  }
}

/**
 * Secure Decryption function - Used ONLY when raw unmasked values are explicitly required (e.g. WPS file generation)
 */
export function decryptField(encryptedText: string | null | undefined): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith('ENC:GCM:')) {
    // If not encrypted (legacy plain text), return as is
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 5) return encryptedText;

    const ivHex = parts[2];
    const authTagHex = parts[3];
    const encryptedHex = parts[4];

    const key = getSecretKeyBuffer();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[DECRYPTION_ERROR]';
  }
}

/**
 * Mask National ID / Iqama Number (e.g., "1010123456" -> "10******56")
 */
export function maskNationalId(nationalId: string | null | undefined): string {
  const plain = decryptField(nationalId);
  if (!plain) return '';
  const clean = plain.trim();
  if (clean.length <= 4) return '****';

  const firstTwo = clean.slice(0, 2);
  const lastTwo = clean.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(4, clean.length - 4));

  return `${firstTwo}${maskedMiddle}${lastTwo}`;
}

/**
 * Mask IBAN string (e.g., "SA0380000000608010101001" -> "SA03****************001")
 */
export function maskIban(iban: string | null | undefined): string {
  const plain = decryptField(iban);
  if (!plain) return '';
  const clean = plain.trim().replace(/\s+/g, '');
  if (clean.length <= 6) return 'SA****************';

  const firstFour = clean.slice(0, 4); // Country code & check digits (e.g. SA03)
  const lastThree = clean.slice(-3);   // Last 3 digits
  const maskedMiddle = '*'.repeat(Math.max(8, clean.length - 7));

  return `${firstFour}${maskedMiddle}${lastThree}`;
}

/**
 * Mask sensitive fields on an Employee object for standard API responses
 */
export function maskEmployeeSensitiveData(employee: Employee): Employee {
  return {
    ...employee,
    nationalId: maskNationalId(employee.nationalId),
    iban: maskIban(employee.iban)
  };
}

/**
 * Mask sensitive fields on a Payslip object for standard API responses
 */
export function maskPayslipSensitiveData(payslip: Payslip): Payslip {
  return {
    ...payslip,
    bankIban: maskIban(payslip.bankIban)
  };
}

/**
 * Decrypt all sensitive fields of an employee explicitly (e.g. for WPS Bank File generation)
 */
export function getDecryptedEmployeeSensitiveData(employee: Employee): { nationalId: string; iban: string } {
  return {
    nationalId: decryptField(employee.nationalId),
    iban: decryptField(employee.iban)
  };
}
