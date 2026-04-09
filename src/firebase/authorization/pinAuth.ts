import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

type ActorPayload = {
  uid: string;
  id?: string;
  businessID: string | null;
  role: string;
  name: string;
  displayName: string;
};

export type ModulePinDetail = {
  createdAt?: Date | null;
  updatedAt?: Date | null;
  expiresAt?: Date | null;
  deactivatedAt?: Date | null;
  lastGeneratedAt?: Date | null;
  isActive?: boolean;
  isExpired?: boolean;
  [key: string]: unknown;
};

type ModulePinDetailsMap = Record<string, ModulePinDetail>;

export type GeneratedPins = {
  modules: string[];
  pinsMap: Record<
    string,
    { pin?: string; createdAt?: Date | null; expiresAt?: Date | null }
  >;
  pins: Array<{
    module: string;
    pin: string;
    createdAt: Date | null;
    expiresAt: Date | null;
  }>;
  metadata: {
    generatedAt: Date | null;
    expiresAt: Date | null;
    schema: string;
  };
  targetUser: unknown;
};

export type PinStatus = {
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
const sendPinByEmailCallable = httpsCallable(functions, 'sendPinByEmail');

const resolveUserId = (
  currentUser: UserIdentity | null | undefined,
): string | null => {
  if (
    typeof currentUser?.uid === 'string' &&
    currentUser.uid.trim().length > 0
  ) {
    return currentUser.uid.trim();
  }
  if (typeof currentUser?.id === 'string' && currentUser.id.trim().length > 0) {
    return currentUser.id.trim();
  }
  return null;
};

const buildActorPayload = (
  currentUser: UserIdentity | null | undefined,
): ActorPayload | null => {
  const uid = resolveUserId(currentUser);
  if (!uid) return null;

  const id =
    typeof currentUser?.id === 'string' && currentUser.id.trim().length > 0
      ? currentUser.id.trim()
      : uid;
  const resolvedDisplayName =
    typeof (currentUser as { displayName?: unknown }).displayName === 'string'
      ? (currentUser as { displayName: string }).displayName
      : currentUser.name || currentUser.realName || '';
  return {
    uid,
    id,
    businessID: currentUser.businessID || null,
    role: currentUser.role || '',
    name: resolvedDisplayName,
    displayName: resolvedDisplayName,
  };
};

const parseIsoDate = (value: unknown): Date | null => {
  if (!value) return null;
  try {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }
    const date = new Date(value);
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
    const normalized = normalizeModuleDetail(
      payload as Record<string, unknown>,
    );
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
  const metadata =
    data?.metadata && typeof data.metadata === 'object'
      ? (data.metadata as Record<string, unknown>)
      : {};

  const pins = modules.map((module) => {
    const entry =
      (pinsMap as Record<string, Record<string, unknown>>)[module] || {};
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
      generatedAt: parseIsoDate(metadata.generatedAt),
      expiresAt: parseIsoDate(metadata.expiresAt),
      schema:
        (metadata as { schema?: string }).schema || 'v2',
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
    moduleDetails: normalizeModuleDetailsMap(
      data.moduleDetails as Record<string, unknown>,
    ),
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
    moduleDetails: normalizeModuleDetailsMap(
      user.moduleDetails as Record<string, unknown>,
    ),
  }));
};

export const fbGenerateUserPin = async (
  currentUser: UserIdentity | null | undefined,
  targetUserId: string,
  modules: string[] = [],
): Promise<GeneratedPins> => {
  if (!resolveUserId(currentUser)) {
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
  if (!resolveUserId(currentUser)) {
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
  const actorId = resolveUserId(currentUser);
  if (!actorId) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getUserModulePinStatusCallable({
      targetUserId: targetUserId || actorId,
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
  if (!resolveUserId(currentUser)) {
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
  if (!resolveUserId(currentUser)) {
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
      moduleStatus: normalizeModuleDetail(
        data.moduleStatus as Record<string, unknown>,
      ),
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
): Promise<{
  schema: string;
  pins: Array<Record<string, unknown>>;
  targetUser: unknown;
}> => {
  const actorId = resolveUserId(currentUser);
  if (!actorId) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getUserModulePinsCallable({
      targetUserId: targetUserId || actorId,
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
      error instanceof Error ? error.message : 'No se pudo recuperar el PIN.';
    throw new Error(message);
  }
};

export const fbSendPinByEmail = async (
  currentUser: UserIdentity | null | undefined,
  targetUserId: string,
  pins: GeneratedPins['pinsMap'],
  metadata?: { generatedAt?: string | null; expiresAt?: string | null },
): Promise<{ ok: boolean; message: string; email?: string }> => {
  if (!resolveUserId(currentUser)) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }
  if (!targetUserId) {
    throw new Error('Falta el usuario objetivo.');
  }
  if (!pins || !Object.keys(pins).length) {
    throw new Error('No hay PINs para enviar.');
  }

  try {
    const response = await sendPinByEmailCallable({
      targetUserId,
      pins,
      metadata: metadata || {},
      actor: buildActorPayload(currentUser),
    });
    const data = (response.data || {}) as Record<string, unknown>;
    return {
      ok: Boolean(data.ok),
      message: (data.message as string) || 'Correo enviado.',
      email: (data.email as string) || undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No se pudo enviar el PIN por correo.';
    throw new Error(message);
  }
};
