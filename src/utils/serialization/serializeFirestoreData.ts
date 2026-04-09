import DateUtils from '@/utils/date/dateUtils';

type Primitive = string | number | boolean | null | undefined;
type FirestoreTimestampLike = { seconds: number; nanoseconds: number };
type FirestoreData =
  | Primitive
  | FirestoreTimestampLike
  | FirestoreData[]
  | { [key: string]: FirestoreData };

type SerializedFirestoreData<T> = T extends FirestoreTimestampLike
  ? number
  : T extends (infer U)[]
    ? SerializedFirestoreData<U>[]
    : T extends object
      ? { [K in keyof T]: SerializedFirestoreData<T[K]> }
      : T;

const isFirestoreTimestampLike = (
  value: unknown,
): value is FirestoreTimestampLike =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as FirestoreTimestampLike).seconds === 'number' &&
  typeof (value as FirestoreTimestampLike).nanoseconds === 'number';

/**
 * Recursively serializes Firestore Timestamp objects to milliseconds
 * to make them compatible with Redux state serialization requirements
 * @param {any} obj - The object to serialize
 * @returns {any} - The serialized object with timestamps converted to milliseconds
 */
export const serializeFirestoreData = <T extends FirestoreData>(
  obj: T,
): SerializedFirestoreData<T> => {
  if (obj === null || obj === undefined) {
    return obj as SerializedFirestoreData<T>;
  }

  // Check if it's a Firestore Timestamp
  if (isFirestoreTimestampLike(obj)) {
    return DateUtils.convertTimestampToMillis(
      obj,
    ) as SerializedFirestoreData<T>;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      serializeFirestoreData(item),
    ) as SerializedFirestoreData<T>;
  }

  // Handle objects
  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const key in obj as Record<string, FirestoreData>) {
      if (Object.hasOwn(obj, key)) {
        serialized[key] = serializeFirestoreData(
          (obj as Record<string, FirestoreData>)[key],
        ) as unknown;
      }
    }
    return serialized as SerializedFirestoreData<T>;
  }

  // Return primitive values as-is
  return obj as SerializedFirestoreData<T>;
};

/**
 * Serializes an array of Firestore documents
 * @param {Array} documents - Array of Firestore documents
 * @returns {Array} - Serialized array with timestamps converted
 */
export const serializeFirestoreDocuments = <T extends FirestoreData>(
  documents: T[] | null | undefined,
): SerializedFirestoreData<T>[] | null | undefined => {
  if (!Array.isArray(documents)) return documents;
  return documents.map((doc) => serializeFirestoreData(doc));
};
