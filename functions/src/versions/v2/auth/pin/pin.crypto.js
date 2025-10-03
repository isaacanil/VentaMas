import crypto from 'node:crypto';
import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';

let cachedEncryptionKey = null;

export const ensureEncryptionKey = () => {
  if (cachedEncryptionKey) return cachedEncryptionKey;
  const rawKey = process.env.PIN_ENCRYPTION_KEY || '';
  if (!rawKey) {
    throw new HttpsError(
      'failed-precondition',
      'PIN_ENCRYPTION_KEY is not configured. Set it as a base64-encoded 32-byte value.'
    );
  }
  try {
    const key = Buffer.from(rawKey, 'base64');
    if (key.length !== 32) {
      throw new HttpsError(
        'failed-precondition',
        'PIN_ENCRYPTION_KEY must decode to 32 bytes (AES-256 key).'
      );
    }
    cachedEncryptionKey = key;
    return cachedEncryptionKey;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('failed-precondition', 'Invalid PIN_ENCRYPTION_KEY configuration.');
  }
};

export const generatePinValue = () => {
  const value = crypto.randomInt(0, 1_000_000);
  return value.toString().padStart(6, '0');
};

export const encryptPin = (pin) => {
  const key = ensureEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: 'aes-256-gcm',
    version: 2,
  };
};

export const decryptPin = (encryptedRecord) => {
  const key = ensureEncryptionKey();
  try {
    const decipher = crypto.createDecipheriv(
      encryptedRecord.algorithm || 'aes-256-gcm',
      key,
      Buffer.from(encryptedRecord.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(encryptedRecord.authTag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRecord.cipherText, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('[pinAuth] Failed to decrypt PIN', { error });
    throw new HttpsError('internal', 'No se pudo validar el PIN cifrado.');
  }
};
