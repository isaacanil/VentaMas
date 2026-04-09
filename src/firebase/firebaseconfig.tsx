// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
//TODO ***AUTH**************************************
import { getAuth } from 'firebase/auth';
//TODO ***FIRESTORE***********************************
import { getDatabase, type Database } from 'firebase/database';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
//TODO ***STORAGE***********************************
import { getStorage } from 'firebase/storage';
import type { GenerativeModel } from 'firebase/vertexai';

const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const hasRealtimeDatabase = Boolean(databaseURL);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
// export const db = getFirestore(app);

export const storage = getStorage(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export const realtimeDB: Database | null = hasRealtimeDatabase
  ? getDatabase(app, databaseURL)
  : null;

let _generativeModelInstance: GenerativeModel | null = null;

export const getLazyGenerativeModel = async (): Promise<GenerativeModel> => {
  if (!_generativeModelInstance) {
    const { getVertexAI, getGenerativeModel } =
      await import('firebase/vertexai');
    const vertexAI = getVertexAI(app);
    _generativeModelInstance = getGenerativeModel(vertexAI, {
      model: 'gemini-2.5-flash',
    });
  }
  return _generativeModelInstance;
};

interface UserDocument {
  name?: string;
}

export const listFirst5UserNames = async (): Promise<string[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('name', '==', 'dev#3407'));
  const snap = await getDocs(q);

  return snap.docs
    .map((docSnap) => docSnap.data() as UserDocument)
    .map((user) => user.name)
    .filter((name): name is string => Boolean(name));
};

// function servicesEmulator() {
//   const host = '127.0.0.1';
//   const services = [
//     {
//       name: 'functions',
//       port: 5001,
//       connect: () => connectFunctionsEmulator(functions, host, 5001)
//     },
//     {
//       name: 'firestore',
//       port: 8081,
//       connect: () => connectFirestoreEmulator(db, host, 8081)
//     }
//   ];
//   onEnv('dev', async () => {
//     // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
//     // connectFirestoreEmulator(db, '127.0.0.1', 8081);
//     // console.info('[Emulator] connected to functions & firestore');
//     const status =  await connectEmulatorsIfAvailable(services);
//     console.log('Emuladores: ', status);
//     const upList = status
//     .filter(s => s.connected)
//     .map(s => s.name);
//     console.log(`Emuladores conectados: ${upList.join(', ')}`);
//   });
// };

// servicesEmulator();

// export const getTaxes = async (setTaxes) => {
//   const taxesRef = collection(db, "taxes")
//   const { docs } = await getDocs(taxesRef)
//   const taxesArray = docs.map(item => item.data())
//   if (taxesArray.length === 0) return;
//   if (taxesArray.length > 0) return setTaxes(taxesArray)
// }

export interface IngredientInput {
  id?: string | number;
  name?: string;
  cost?: number | string;
  [key: string]: unknown;
}

export const addIngredientTypePizza = async (
  ingredient: IngredientInput,
): Promise<void> => {
  const IngredientRef = doc(db, 'products', '6dssod');
  // Atomically add a new region to the "regions" array field.
  try {
    await updateDoc(IngredientRef, {
      ingredientList: arrayUnion(ingredient),
    });
  } catch (error) {
    console.error('Error adding ingredient:', error);
  }
};
export const deleteIngredientTypePizza = async (
  ingredient: IngredientInput,
): Promise<void> => {
  const IngredientRef = doc(db, 'products', '6dssod');
  try {
    await updateDoc(IngredientRef, {
      ingredientList: arrayRemove(ingredient),
    });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
  }
};
