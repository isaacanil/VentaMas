import { getDoc, type DocumentReference } from 'firebase/firestore';
import type { CashCountEmployee } from '@/utils/cashCount/types';
import { normalizeFirestoreUser } from '@/utils/users/normalizeFirestoreUser';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const isDocumentReferenceLike = (value: unknown): value is DocumentReference =>
  isRecord(value) &&
  typeof (value as { path?: unknown }).path === 'string' &&
  typeof (value as { id?: unknown }).id === 'string';

const resolveEmbeddedEmployee = (
  raw: unknown,
): CashCountEmployee | null => {
  const root = asRecord(raw);
  const legacyUser = asRecord(root.user);
  const source = Object.keys(legacyUser).length ? legacyUser : root;

  const id =
    toCleanString(source.id) ||
    toCleanString(source.uid) ||
    null;
  const realName = toCleanString(source.realName);
  const displayName = toCleanString(source.displayName);
  const name = realName || displayName || toCleanString(source.name) || null;

  if (!id && !name) return null;

  return {
    id: id || undefined,
    uid: toCleanString(source.uid) || id || undefined,
    realName: realName || undefined,
    name: name || undefined,
  };
};

export async function getEmployeeData(
  employeeRef?: DocumentReference | CashCountEmployee | UnknownRecord | null,
): Promise<CashCountEmployee | null> {
  // Comprobación anticipada para un argumento nulo
  if (!employeeRef) return null;
  if (!isDocumentReferenceLike(employeeRef)) {
    return resolveEmbeddedEmployee(employeeRef);
  }
  try {
    const employeeSnap = await getDoc(employeeRef);
    if (!employeeSnap.exists()) {
      throw new Error('Documento de empleado no encontrado');
    }

    const employeeUser = normalizeFirestoreUser(employeeSnap.id, employeeSnap.data());
    const resolvedId =
      employeeUser.id ||
      employeeUser.uid ||
      null;
    const resolvedName =
      employeeUser.realName?.trim()
        ? employeeUser.realName
        : employeeUser.displayName?.trim()
          ? employeeUser.displayName
          : employeeUser.name || null;

    if (!resolvedId && !resolvedName) {
      throw new Error('Documento de empleado sin identidad visible');
    }

    return {
      id: resolvedId,
      name: resolvedName,
    };
  } catch (error) {
    // Mantener tolerancia para datos históricos mixtos y evitar romper la UI.
    console.error('Error al obtener datos del empleado:', error);
    return null;
  }
}
