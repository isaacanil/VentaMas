import { beforeEach, describe, expect, it } from 'vitest';

import {
  decryptPin,
  encryptPin,
  ensureEncryptionKey,
  generatePinValue,
} from './pin.crypto.js';

const VALID_KEY = Buffer.alloc(32, 7).toString('base64');

describe('pin.crypto', () => {
  beforeEach(() => {
    delete process.env.PIN_ENCRYPTION_KEY;
  });

  it('requires an encryption key to be configured', () => {
    expect(() => ensureEncryptionKey()).toThrow(
      'PIN_ENCRYPTION_KEY is not configured',
    );
  });

  it('rejects keys that do not decode to 32 bytes', () => {
    process.env.PIN_ENCRYPTION_KEY = Buffer.from('short-key').toString('base64');

    expect(() => ensureEncryptionKey()).toThrow(
      'PIN_ENCRYPTION_KEY must decode to 32 bytes',
    );
  });

  it('generates six-digit pins and round-trips encrypted values', () => {
    process.env.PIN_ENCRYPTION_KEY = VALID_KEY;

    expect(generatePinValue()).toMatch(/^\d{6}$/);

    const encrypted = encryptPin('123456');

    expect(encrypted).toEqual(
      expect.objectContaining({
        algorithm: 'aes-256-gcm',
        version: 2,
      }),
    );
    expect(decryptPin(encrypted)).toBe('123456');
  });

  it('throws when the encrypted payload is tampered with', () => {
    process.env.PIN_ENCRYPTION_KEY = VALID_KEY;

    const encrypted = encryptPin('123456');
    const tampered = {
      ...encrypted,
      cipherText: `${encrypted.cipherText.slice(0, -2)}xx`,
    };

    expect(() => decryptPin(tampered)).toThrow(
      'No se pudo validar el PIN cifrado.',
    );
  });
});
