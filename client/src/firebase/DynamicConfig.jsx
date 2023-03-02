import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAppMode } from "../features/appModes/appModeSlice";

const hiPizzaConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const adminConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_CLIENT_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_CLIENT_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_CLIENT_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_CLIENT_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_CLIENT_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_CLIENT_MEASUREMENT_ID
};

export const DynamicConfig = () => {
  const selectedAppMode = useSelector(selectAppMode);
  const [actualFirebaseConfig, setActualFirebaseConfig] = useState(null);

  useEffect(() => {
    if (selectedAppMode === true) {
      setActualFirebaseConfig(hiPizzaConfig);
    } else {
      setActualFirebaseConfig(adminConfig);
    }
  }, [selectedAppMode]);

  return actualFirebaseConfig;
};



