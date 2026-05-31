import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFunctions, type Functions } from 'firebase/functions';

import { auth, functions } from '@/firebase/firebaseconfig';

import {
  getAiBusinessSeedingEnvironmentById,
  getCurrentAiBusinessSeedingEnvironment,
  type AiBusinessSeedingEnvironmentId,
} from '../utils/environment';

const AI_AGENT_REGION = 'us-central1';

const TARGET_FIREBASE_OPTIONS: Record<
  AiBusinessSeedingEnvironmentId,
  FirebaseOptions
> = {
  staging: {
    apiKey: 'AIzaSyDvHGBdYiF0WuO6xmritZvvF64B9VuAqtg',
    authDomain: 'ventamax-staging.firebaseapp.com',
    projectId: 'ventamax-staging',
    storageBucket: 'ventamax-staging.firebasestorage.app',
    messagingSenderId: '511471150596',
    appId: '1:511471150596:web:26593934159fae5b24b751',
    measurementId: 'G-S2P3NTF7EN',
  },
  production: {
    apiKey: 'AIzaSyCT-2T9BUy2w0XmdffWWLRvorMWsxpUK2w',
    authDomain: 'ventamaxpos.firebaseapp.com',
    projectId: 'ventamaxpos',
    storageBucket: 'ventamaxpos.appspot.com',
    messagingSenderId: '451664861927',
    appId: '1:451664861927:web:fa43a82fe4125a57312042',
    measurementId: 'G-P66Z0ETD2Y',
  },
};

const getTargetAppName = (environmentId: AiBusinessSeedingEnvironmentId) =>
  `ai-business-seeding-${environmentId}`;

export const isAiBusinessSeedingCurrentEnvironment = (
  environmentId: AiBusinessSeedingEnvironmentId,
) => getCurrentAiBusinessSeedingEnvironment().id === environmentId;

const getAiBusinessSeedingTargetApp = (
  environmentId: AiBusinessSeedingEnvironmentId,
): FirebaseApp => {
  const targetEnvironment = getAiBusinessSeedingEnvironmentById(environmentId);
  const currentEnvironment = getCurrentAiBusinessSeedingEnvironment();
  if (targetEnvironment.id === currentEnvironment.id) {
    return getApp();
  }

  const appName = getTargetAppName(targetEnvironment.id);
  const existingApp = getApps().find((app) => app.name === appName);
  if (existingApp) return existingApp;

  return initializeApp(TARGET_FIREBASE_OPTIONS[targetEnvironment.id], appName);
};

export const getAiBusinessSeedingTargetFunctions = (
  environmentId: AiBusinessSeedingEnvironmentId,
): Functions => {
  if (isAiBusinessSeedingCurrentEnvironment(environmentId)) return functions;
  return getFunctions(
    getAiBusinessSeedingTargetApp(environmentId),
    AI_AGENT_REGION,
  );
};

export const getAiBusinessSeedingTargetAuth = (
  environmentId: AiBusinessSeedingEnvironmentId,
): Auth => {
  if (isAiBusinessSeedingCurrentEnvironment(environmentId)) return auth;
  return getAuth(getAiBusinessSeedingTargetApp(environmentId));
};
