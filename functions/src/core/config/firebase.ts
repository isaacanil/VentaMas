import admin from 'firebase-admin';

let databaseURL: string | undefined;

if (process.env.FIREBASE_DATABASE_URL) {
  databaseURL = process.env.FIREBASE_DATABASE_URL;
} else if (process.env.FIREBASE_CONFIG) {
  try {
    const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
    if (
      parsed &&
      typeof parsed.databaseURL === 'string' &&
      parsed.databaseURL.length > 0
    ) {
      databaseURL = parsed.databaseURL;
    }
  } catch (err) {
    console.warn('[firebase-config] Invalid FIREBASE_CONFIG JSON:', err);
  }
}

if (!databaseURL) {
  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.PROJECT_ID ||
    null;
  if (projectId) {
    databaseURL = `https://${projectId}.firebaseio.com`;
  }
}

const appOptions = databaseURL ? { databaseURL } : undefined;

if (!admin.apps.length) {
  admin.initializeApp(appOptions);
}

const db = admin.firestore();
const storage = admin.storage();
const rtdb = databaseURL ? admin.database() : undefined;

// Firestore settings
export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;
export const FieldPath = admin.firestore.FieldPath;
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
export const increment = admin.firestore.FieldValue.increment;
export const arrayUnion = admin.firestore.FieldValue.arrayUnion;
export const arrayRemove = admin.firestore.FieldValue.arrayRemove;

export { admin, db, storage, rtdb };

export default admin;
