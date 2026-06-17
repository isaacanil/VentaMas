import { serializeTimestampsToMillis } from '@/utils/date/toMillis';

type Primitive = string | number | boolean | null | undefined;
type FirestoreTimestampLike =
  | Date
  | { toDate: () => Date }
  | { toMillis: () => number }
  | { seconds: number | string; nanoseconds?: number | string }
  | { _seconds: number | string; _nanoseconds?: number | string };
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

/**
 * Recursively serializes Firestore Timestamp objects to milliseconds
 * to make them compatible with Redux state serialization requirements
 * @param {any} obj - The object to serialize
 * @returns {any} - The serialized object with timestamps converted to milliseconds
 */
export const serializeFirestoreData = <T extends FirestoreData>(
  obj: T,
): SerializedFirestoreData<T> =>
  serializeTimestampsToMillis(obj) as SerializedFirestoreData<T>;

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
