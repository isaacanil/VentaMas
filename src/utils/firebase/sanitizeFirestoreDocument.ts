import type {
  Bytes,
  DocumentReference,
  FieldValue,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';

type FirestorePrimitive = string | number | boolean | null;
type FirestorePassthrough =
  | Timestamp
  | Date
  | FieldValue
  | GeoPoint
  | Bytes
  | DocumentReference<unknown>;
export type FirestoreDocumentInput =
  | FirestorePrimitive
  | FirestorePassthrough
  | FirestoreDocumentInput[]
  | Record<string, unknown>
  | undefined;

export type SanitizedFirestoreDocument<T> = T extends undefined
  ? undefined
  : T extends FirestorePassthrough
    ? T
    : T extends FirestorePrimitive
      ? T
      : T extends readonly (infer U)[]
        ? Array<SanitizedFirestoreDocument<Exclude<U, undefined>>>
        : T extends object
          ? {
              [K in keyof T as T[K] extends undefined
                ? never
                : K]: SanitizedFirestoreDocument<Exclude<T[K], undefined>>;
            }
          : T;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const sanitizeFirestoreDocument = <T extends FirestoreDocumentInput>(
  input: T,
): SanitizedFirestoreDocument<T> => {
  const visit = <TValue>(value: TValue): SanitizedFirestoreDocument<TValue> => {
    if (value === undefined) {
      return undefined as SanitizedFirestoreDocument<TValue>;
    }

    if (Array.isArray(value)) {
      const sanitizedItems = value
        .map((item) => visit(item))
        .filter(
          (item): item is Exclude<typeof item, undefined> => item !== undefined,
        );
      return sanitizedItems as SanitizedFirestoreDocument<TValue>;
    }

    if (isPlainObject(value)) {
      const result: Record<string, unknown> = {};
      for (const [key, rawValue] of Object.entries(value)) {
        const sanitizedValue = visit(rawValue);
        if (sanitizedValue !== undefined) {
          result[key] = sanitizedValue;
        }
      }
      return result as SanitizedFirestoreDocument<TValue>;
    }

    return value as SanitizedFirestoreDocument<TValue>;
  };

  return visit(input);
};
