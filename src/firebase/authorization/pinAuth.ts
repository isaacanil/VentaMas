import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

type ActorPayload = {
  uid: string;
  businessID: string | null;
  role: string;
  name: string;
  displayName: string;
};

type ModulePinDetail = {
  createdAt?: Date | null;
  updatedAt?: Date | null;
  expiresAt?: Date | null;
  deactivatedAt?: Date | null;
  lastGeneratedAt?: Date | null;
  [key: string]: unknown;
};

type ModulePinDetailsMap = Record<string, ModulePinDetail>;

type GeneratedPins = {
  modules: string[];
  pinsMap: Record<string, { pin?: string; createdAt?: Date | null; expiresAt?: Date | null }>;
  pins: Array<{ module: string; pin: string; createdAt: Date | null; expiresAt: Date | null }>;
  metadata: { generatedAt: Date | null; expiresAt: Date | null; schema: string };
  targetUser: unknown;
};

type PinStatus = {
  hasPin: boolean;
  isActive: boolean;
  isExpired: boolean;
  modules: string[];
  activeModules: string[];
  createdAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date | null;
  moduleDetails: ModulePinDetailsMap;
  schema: string;
  createdBy: unknown;
  targetUser: unknown;
};

type BusinessUserPinSummary = {
  pinCreatedAt?: Date | null;
  pinExpiresAt?: Date | null;
  moduleDetails?: ModulePinDetailsMap;
  [key: string]: unknown;
};

type ValidatePinResponse = {
  valid: boolean;
  reason: string | null;
  user: unknown;
  moduleStatus: ModulePinDetail | null;
};

const generateModulePinsCallable = httpsCallable(
  functions,
  'generateModulePins',
);
const deactivateModulePinsCallable = httpsCallable(
  functions,
  'deactivateModulePins',
);
const getUserModulePinStatusCallable = httpsCallable(
  functions,
  'getUserModulePinStatus',
);
const getBusinessPinsSummaryCallable = httpsCallable(
  functions,
  'getBusinessPinsSummary',
);
const validateModulePinCallable = httpsCallable(functions, 'validateModulePin');
const getUserModulePinsCallable = httpsCallable(functions, 'getUserModulePins');

const buildActorPayload = (
  currentUser: UserIdentity | null | undefined,
): ActorPayload | null => {
  if (!currentUser?.uid) return null;
  return {
    uid: currentUser.uid,
    businessID: currentUser.businessID || null,
    role: currentUser.role || '',
    name: currentUser.displayName || currentUser.name || '',
    displayName: currentUser.displayName || currentUser.name || '',
  };
};

const parseIsoDate = (value: unknown): Date | null => {
  if (!value) return null;
  try {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const normalizeModuleDetail = (
  detail: Record<string, unknown> | null | undefined,
): ModulePinDetail | null => {
  if (!detail || typeof detail !== 'object') return null;
  return {
    ...detail,
    createdAt: parseIsoDate(detail.createdAt),
    updatedAt: parseIsoDate(detail.updatedAt),
    expiresAt: parseIsoDate(detail.expiresAt),
    deactivatedAt: parseIsoDate(detail.deactivatedAt),
    lastGeneratedAt: parseIsoDate(detail.lastGeneratedAt),
  };
};

const normalizeModuleDetailsMap = (
  moduleDetails: Record<string, unknown> | null | undefined,
): ModulePinDetailsMap => {
  if (!moduleDetails || typeof moduleDetails !== 'object') return {};
  return Object.entries(moduleDetails).reduce((acc, [module, payload]) => {
    const normalized = normalizeModuleDetail(payload as Record<string, unknown>);
    if (normalized) {
      acc[module] = normalized;
    }
    return acc;
  }, {} as ModulePinDetailsMap);
};

const normalizeGeneratedPins = (
  data: Record<string, unknown> | null | undefined,
): GeneratedPins => {
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  const pinsMap = data?.pins && typeof data.pins === 'object' ? data.pins : {};

  const pins = modules.map((module) => {
    const entry = (pinsMap as Record<string, Record<string, unknown>>)[module] || {};
    return {
      module,
      pin: (entry.pin as string) || '',
      createdAt: parseIsoDate(entry.createdAt),
      expiresAt: parseIsoDate(entry.expiresAt),
    };
  });

  return {
    modules,
    pinsMap: pinsMap as GeneratedPins['pinsMap'],
    pins,
    metadata: {
      generatedAt: parseIsoDate(data?.metadata?.generatedAt),
      expiresAt: parseIsoDate(data?.metadata?.expiresAt),
      schema: (data?.metadata as { schema?: string } | undefined)?.schema || 'v2',
    },
    targetUser: data?.targetUser || null,
  };
};

const normalizePinStatus = (
  data: Record<string, unknown> | null | undefined,
): PinStatus => {
  if (!data || typeof data !== 'object') {
    return {
      hasPin: false,
      isActive: false,
      isExpired: false,
      modules: [],
      activeModules: [],
      createdAt: null,
      expiresAt: null,
      updatedAt: null,
      moduleDetails: {},
      schema: 'v2',
      createdBy: null,
      targetUser: null,
    };
  }

  return {
    hasPin: Boolean(data.hasPin),
    isActive: Boolean(data.isActive),
    isExpired: Boolean(data.isExpired),
    modules: Array.isArray(data.modules) ? data.modules : [],
    activeModules: Array.isArray(data.activeModules) ? data.activeModules : [],
    createdAt: parseIsoDate(data.createdAt),
    expiresAt: parseIsoDate(data.expiresAt),
    updatedAt: parseIsoDate(data.updatedAt),
    schema: (data.schema as string) || 'v2',
    createdBy: data.createdBy || null,
    moduleDetails: normalizeModuleDetailsMap(data.moduleDetails as Record<string, unknown>),
    targetUser: data.targetUser || null,
  };
};

const normalizeBusinessUsers = (
  users: Array<Record<string, unknown>> | null | undefined,
): BusinessUserPinSummary[] => {
  if (!Array.isArray(users)) return [];
  return users.map((user) => ({
    ...user,
    pinCreatedAt: parseIsoDate(user.pinCreatedAt),
    pinExpiresAt: parseIsoDate(user.pinExpiresAt),
    moduleDetails: normalizeModuleDetailsMap(user.moduleDetails as Record<string, unknown>),
  }));
};

export const fbGenerateUserPin = async (
  currentUser: UserIdentity | null | undefined,
  targetUserId: string,
  modules: string[] = [],
): Promise<GeneratedPins> => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }
  if (!targetUserId) {
    throw new Error('Falta el usuario objetivo para generar el PIN.');
  }
  if (!Array.isArray(modules) || modules.length === 0) {
    throw new Error('Selecciona al menos un módulo para generar el PIN.');
  }

  try {
    const response = await generateModulePinsCallable({
      targetUserId,
      modules,
      actor: buildActorPayload(currentUser),
    });
    return normalizeGeneratedPins(response.data as Record<string, unknown>);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo generar el PIN.';
    throw new Error(message);
  }
};

export const fbDeactivateUserPin = async (
  currentUser: UserIdentity | null | undefined,
  targetUserId: string,
  modules: string[] | null = null,
): Promise<void> => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }
  if (!targetUserId) {
    throw new Error('Falta el usuario objetivo para desactivar el PIN.');
  }

  try {
    await deactivateModulePinsCallable({
      targetUserId,
      modules: Array.isArray(modules) && modules.length ? modules : undefined,
      actor: buildActorPayload(currentUser),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo desactivar el PIN.';
    throw new Error(message);
  }
};

export const fbGetUserPinStatus = async (
  currentUser: UserIdentity | null | undefined,
  targetUserId: string | null = null,
): Promise<PinStatus> => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getUserModulePinStatusCallable({
      targetUserId: targetUserId || currentUser.uid,
      actor: buildActorPayload(currentUser),
    });
    return normalizePinStatus(response.data as Record<string, unknown>);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo obtener el estado del PIN.';
    throw new Error(message);
  }
};

export const fbGetUsersWithPinStatus = async (
  currentUser: UserIdentity | null | undefined,
): Promise<BusinessUserPinSummary[]> => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getBusinessPinsSummaryCallable({
      actor: buildActorPayload(currentUser),
    });
    return normalizeBusinessUsers(
      (response.data as { users?: Array<Record<string, unknown>> })?.users,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo obtener la lista de usuarios.';
    throw new Error(message);
  }
};

export const fbValidateUserPin = async (
  currentUser: UserIdentity | null | undefined,
  {
    username,
    pin,
    module = 'invoices',
  }: { username?: string; pin?: string; module?: string } = {},
): Promise<ValidatePinResponse> => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }
  if (!pin || typeof pin !== 'string' || pin.length !== 6) {
    throw new Error('PIN inválido.');
  }

  try {
    const response = await validateModulePinCallable({
      pin,
      module,
      username,
      actor: buildActorPayload(currentUser),
    });
    const data = (response.data || {}) as Record<string, unknown>;
    return {
      valid: Boolean(data.valid),
      reason: (data.reason as string) || null,
      user: data.user || null,
      moduleStatus: normalizeModuleDetail(data.moduleStatus as Record<string, unknown>),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo validar el PIN.';
    throw new Error(message);
  }
};

export const fbViewUserPins = async (
  currentUser: UserIdentity | null | undefined,
  targetUserId: string | null = null,
  modules: string[] | null = null,
): Promise<{ schema: string; pins: Array<Record<string, unknown>>; targetUser: unknown }> => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getUserModulePinsCallable({
      targetUserId: targetUserId || currentUser.uid,
      modules,
      actor: buildActorPayload(currentUser),
    });
    const payload = (response.data || {}) as Record<string, unknown>;
    const pins = Array.isArray(payload.pins)
      ? (payload.pins as Array<Record<string, unknown>>).map((entry) => ({
          ...entry,
          createdAt: parseIsoDate(entry.createdAt),
          expiresAt: parseIsoDate(entry.expiresAt),
        }))
      : [];
    return {
      schema: (payload.schema as string) || 'v2',
      pins,
      targetUser: payload.targetUser || null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo recuperar el PIN.';
    throw new Error(message);
  }
};
