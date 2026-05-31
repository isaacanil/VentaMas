import type {
  PasswordAuthUser,
  PasswordSignInResult,
} from '../repositories/passwordAuth.repository';

const isSignInUser = (value: unknown): value is PasswordAuthUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && record.id.length > 0;
};

const isValidSignInResult = (value: unknown): value is PasswordSignInResult => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isSignInUser(record.user);
};

export function assertIsValidSignInResult(
  value: unknown,
): asserts value is PasswordSignInResult {
  if (!isValidSignInResult(value)) {
    throw new Error('Respuesta invalida del servicio de autenticacion.');
  }
}
