// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from 'firebase/app-check';
//TODO ***AUTH**************************************
import { connectAuthEmulator, getAuth } from 'firebase/auth';
//TODO ***FIRESTORE***********************************
import { getDatabase, type Database } from 'firebase/database';
import {
  collection,
  connectFirestoreEmulator,
  getDocs,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  where,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
//TODO ***STORAGE***********************************
import { getStorage } from 'firebase/storage';
import type { GenerativeModel } from 'firebase/ai';

import {
  getAuthEmulatorPort,
  getFirebaseEmulatorHost,
  getFirebaseEmulatorSummary,
  getFirestoreEmulatorPort,
  getFunctionsEmulatorPort,
  shouldUseFirebaseEmulators,
} from './emulatorConfig';
import {
  DEFAULT_FIREBASE_AI_LOCATION,
  DEFAULT_FIREBASE_AI_MODEL,
  readPositiveInteger,
  resolveFirebaseAiRuntimeConfigValues,
} from './firebaseAiRuntimeConfig';

const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const hasRealtimeDatabase = Boolean(databaseURL);
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || '';
const appCheckDisabled =
  import.meta.env.VITE_FIREBASE_APPCHECK_DISABLED === 'true';
const appCheckDebugToken =
  import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || '';

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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const useFirebaseEmulators = shouldUseFirebaseEmulators();
const useMemoryFirestoreCache = import.meta.env.DEV || useFirebaseEmulators;
const canInitializeAppCheck =
  Boolean(appCheckSiteKey) && !useFirebaseEmulators && !appCheckDisabled;

const configureAppCheckDebugToken = () => {
  if (!import.meta.env.DEV || !appCheckDebugToken) return;

  const globalScope = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  };
  globalScope.FIREBASE_APPCHECK_DEBUG_TOKEN =
    appCheckDebugToken === 'true' ? true : appCheckDebugToken;
};

configureAppCheckDebugToken();

const initializeAppCheckOnce = (): AppCheck | null => {
  if (!canInitializeAppCheck) return null;

  const globalScope = globalThis as typeof globalThis & {
    __VENTAMAS_APP_CHECK__?: AppCheck;
  };
  if (globalScope.__VENTAMAS_APP_CHECK__) {
    return globalScope.__VENTAMAS_APP_CHECK__;
  }

  const appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  globalScope.__VENTAMAS_APP_CHECK__ = appCheckInstance;
  return appCheckInstance;
};

export const appCheck = initializeAppCheckOnce();

export const db = initializeFirestore(app, {
  // Evita cache persistente en desarrollo para no mezclar sesiones,
  // HMR y datos efímeros de emuladores durante pruebas locales.
  localCache: useMemoryFirestoreCache
    ? memoryLocalCache()
    : persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
});
// export const db = getFirestore(app);

export const storage = getStorage(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

if (useFirebaseEmulators) {
  const emulatorHost = getFirebaseEmulatorHost();

  connectAuthEmulator(auth, `http://${emulatorHost}:${getAuthEmulatorPort()}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, emulatorHost, getFirestoreEmulatorPort());
  connectFunctionsEmulator(functions, emulatorHost, getFunctionsEmulatorPort());

  if (import.meta.env.DEV) {
    console.info(
      `[Firebase] emuladores activos: ${getFirebaseEmulatorSummary()}`,
    );
  }
}

export const realtimeDB: Database | null = hasRealtimeDatabase
  ? getDatabase(app, databaseURL)
  : null;

let _generativeModelInstance: GenerativeModel | null = null;
const firebaseAiModel =
  import.meta.env.VITE_FIREBASE_AI_MODEL || DEFAULT_FIREBASE_AI_MODEL;
const firebaseAiLocation =
  import.meta.env.VITE_FIREBASE_AI_LOCATION || DEFAULT_FIREBASE_AI_LOCATION;
const firebaseAiRemoteConfigEnabled =
  import.meta.env.VITE_FIREBASE_AI_REMOTE_CONFIG !== 'false' &&
  !useFirebaseEmulators;
const firebaseAiRemoteModelKey =
  import.meta.env.VITE_FIREBASE_AI_REMOTE_MODEL_KEY || 'firebase_ai_model';
const firebaseAiRemoteLocationKey =
  import.meta.env.VITE_FIREBASE_AI_REMOTE_LOCATION_KEY ||
  'firebase_ai_location';
const firebaseAiRemoteConfigMinFetchMs = readPositiveInteger(
  import.meta.env.VITE_FIREBASE_AI_REMOTE_CONFIG_MIN_FETCH_MS,
  import.meta.env.DEV ? 60_000 : 3_600_000,
);
const firebaseAiRemoteConfigFetchTimeoutMs = readPositiveInteger(
  import.meta.env.VITE_FIREBASE_AI_REMOTE_CONFIG_FETCH_TIMEOUT_MS,
  10_000,
);

const resolveFirebaseAiRuntimeConfig = async (): Promise<
  ReturnType<typeof resolveFirebaseAiRuntimeConfigValues>
> => {
  const fallbackConfig = resolveFirebaseAiRuntimeConfigValues({
    envLocation: firebaseAiLocation,
    envModel: firebaseAiModel,
  });

  if (!firebaseAiRemoteConfigEnabled) return fallbackConfig;

  try {
    const { fetchAndActivate, getRemoteConfig, getString, isSupported } =
      await import('firebase/remote-config');

    if (!(await isSupported())) return fallbackConfig;

    const remoteConfig = getRemoteConfig(app);
    remoteConfig.defaultConfig = {
      [firebaseAiRemoteLocationKey]: fallbackConfig.location,
      [firebaseAiRemoteModelKey]: fallbackConfig.model,
    };
    remoteConfig.settings.minimumFetchIntervalMillis =
      firebaseAiRemoteConfigMinFetchMs;
    remoteConfig.settings.fetchTimeoutMillis =
      firebaseAiRemoteConfigFetchTimeoutMs;

    await fetchAndActivate(remoteConfig);

    return resolveFirebaseAiRuntimeConfigValues({
      envLocation: fallbackConfig.location,
      envModel: fallbackConfig.model,
      remoteLocation: getString(remoteConfig, firebaseAiRemoteLocationKey),
      remoteModel: getString(remoteConfig, firebaseAiRemoteModelKey),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Firebase AI] Remote Config no disponible.', error);
    }
    return fallbackConfig;
  }
};

export const getLazyGenerativeModel = async (): Promise<GenerativeModel> => {
  if (!_generativeModelInstance) {
    const { getAI, getGenerativeModel, VertexAIBackend } =
      await import('firebase/ai');
    const runtimeConfig = await resolveFirebaseAiRuntimeConfig();
    const ai = getAI(app, {
      backend: new VertexAIBackend(runtimeConfig.location),
    });
    _generativeModelInstance = getGenerativeModel(ai, {
      model: runtimeConfig.model,
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
