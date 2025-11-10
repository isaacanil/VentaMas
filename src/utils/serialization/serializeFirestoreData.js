import DateUtils from '../date/dateUtils';

/**
 * Recursively serializes Firestore Timestamp objects to milliseconds
 * to make them compatible with Redux state serialization requirements
 * @param {any} obj - The object to serialize
 * @returns {any} - The serialized object with timestamps converted to milliseconds
 */
export const serializeFirestoreData = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Check if it's a Firestore Timestamp
  if (obj && typeof obj === 'object' && obj.seconds !== undefined && obj.nanoseconds !== undefined) {
    return DateUtils.convertTimestampToMillis(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeFirestoreData(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const serialized = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        serialized[key] = serializeFirestoreData(obj[key]);
      }
    }
    return serialized;
  }

  // Return primitive values as-is
  return obj;
};

/**
 * Serializes an array of Firestore documents
 * @param {Array} documents - Array of Firestore documents
 * @returns {Array} - Serialized array with timestamps converted
 */
export const serializeFirestoreDocuments = (documents) => {
  if (!Array.isArray(documents)) {
    return documents;
  }
  
  return documents.map(doc => serializeFirestoreData(doc));
};
