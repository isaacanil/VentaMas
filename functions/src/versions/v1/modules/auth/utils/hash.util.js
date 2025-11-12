
import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export const isBcrypt = (hash) =>
  /^\$2[aby]?\$/.test(hash);

export const isArgon2 = (hash) =>
  /^\$argon2(id|i|d)\$/.test(hash);

export const argon2Options = {
  type        : argon2.argon2id,
  memoryCost  : 2 ** 16,   // 65 536 KiB = 64 MiB
  timeCost    : 3,
  parallelism : 1,
  hashLength  : 32,        // 256-bit
  saltLength  : 16,        // 128-bit
};

export async function verifyAndUpgrade(
  plain,
  stored,
) {
  if (isBcrypt(stored)) {
    const ok = await bcrypt.compare(plain, stored);
    return ok
      ? { ok, newHash: await argon2.hash(plain, argon2Options) }
      : { ok };
  }

  if (isArgon2(stored)) {
    return { ok: await argon2.verify(stored, plain) };
  }

  return { ok: false };
}
