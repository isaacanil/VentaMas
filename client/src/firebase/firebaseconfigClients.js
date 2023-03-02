import { initializeApp } from "firebase/app";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_CLIENT_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_CLIENT_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_CLIENT_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_CLIENT_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_CLIENT_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_CLIENT_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_CLIENT_MEASUREMENT_ID
  }
  const app = initializeApp(firebaseConfig, 'client');
  export const db = getFirestore(app);

// Path: client\src\firebase\firebaseconfigAdmin.js

export const getData = async (setPrueba) => {
    const dataRef = collection(db, "prueba")
    onSnapshot(dataRef, (snapshot) => {
        let pruebaArray = snapshot.docs.map((doc)=>doc.data())
        setPrueba(pruebaArray)
    })
}