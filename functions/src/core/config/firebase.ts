import admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();
const rtdb = admin.database();

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
