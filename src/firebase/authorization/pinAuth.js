import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseconfig.jsx';

const generateModulePinsCallable = httpsCallable(functions, 'generateModulePins');
const deactivateModulePinsCallable = httpsCallable(functions, 'deactivateModulePins');
const getUserModulePinStatusCallable = httpsCallable(functions, 'getUserModulePinStatus');
const getBusinessPinsSummaryCallable = httpsCallable(functions, 'getBusinessPinsSummary');
const validateModulePinCallable = httpsCallable(functions, 'validateModulePin');
const getUserModulePinsCallable = httpsCallable(functions, 'getUserModulePins');

const buildActorPayload = (currentUser) => {
  if (!currentUser?.uid) return null;
  return {
    uid: currentUser.uid,
    businessID: currentUser.businessID || null,
    role: currentUser.role || '',
    name: currentUser.displayName || currentUser.name || '',
    displayName: currentUser.displayName || currentUser.name || '',
  };
};

const parseIsoDate = (value) => {
  if (!value) return null;
  try {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

const normalizeModuleDetail = (detail) => {
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

const normalizeModuleDetailsMap = (moduleDetails) => {
  if (!moduleDetails || typeof moduleDetails !== 'object') return {};
  return Object.entries(moduleDetails).reduce((acc, [module, payload]) => {
    const normalized = normalizeModuleDetail(payload);
    if (normalized) {
      acc[module] = normalized;
    }
    return acc;
  }, {});
};

const normalizeGeneratedPins = (data) => {
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  const pinsMap = data?.pins && typeof data.pins === 'object' ? data.pins : {};

  const pins = modules.map((module) => {
    const entry = pinsMap[module] || {};
    return {
      module,
      pin: entry.pin || '',
      createdAt: parseIsoDate(entry.createdAt),
      expiresAt: parseIsoDate(entry.expiresAt),
    };
  });

  return {
    modules,
    pinsMap,
    pins,
    metadata: {
      generatedAt: parseIsoDate(data?.metadata?.generatedAt),
      expiresAt: parseIsoDate(data?.metadata?.expiresAt),
      schema: data?.metadata?.schema || 'v2',
    },
    targetUser: data?.targetUser || null,
  };
};

const normalizePinStatus = (data) => {
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
    schema: data.schema || 'v2',
    createdBy: data.createdBy || null,
    moduleDetails: normalizeModuleDetailsMap(data.moduleDetails),
    targetUser: data.targetUser || null,
  };
};

const normalizeBusinessUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map((user) => ({
    ...user,
    pinCreatedAt: parseIsoDate(user.pinCreatedAt),
    pinExpiresAt: parseIsoDate(user.pinExpiresAt),
    moduleDetails: normalizeModuleDetailsMap(user.moduleDetails),
  }));
};

export const fbGenerateUserPin = async (currentUser, targetUserId, modules = []) => {
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
    return normalizeGeneratedPins(response.data);
  } catch (error) {
    throw new Error(error?.message || 'No se pudo generar el PIN.');
  }
};

export const fbDeactivateUserPin = async (currentUser, targetUserId, modules = null) => {
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
    throw new Error(error?.message || 'No se pudo desactivar el PIN.');
  }
};

export const fbGetUserPinStatus = async (currentUser, targetUserId = null) => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getUserModulePinStatusCallable({
      targetUserId: targetUserId || currentUser.uid,
      actor: buildActorPayload(currentUser),
    });
    return normalizePinStatus(response.data);
  } catch (error) {
    throw new Error(error?.message || 'No se pudo obtener el estado del PIN.');
  }
};

export const fbGetUsersWithPinStatus = async (currentUser) => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getBusinessPinsSummaryCallable({
      actor: buildActorPayload(currentUser),
    });
    return normalizeBusinessUsers(response.data?.users);
  } catch (error) {
    throw new Error(error?.message || 'No se pudo obtener la lista de usuarios.');
  }
};

export const fbValidateUserPin = async (currentUser, { username, pin, module = 'invoices' } = {}) => {
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
    const data = response.data || {};
    return {
      valid: Boolean(data.valid),
      reason: data.reason || null,
      user: data.user || null,
      moduleStatus: normalizeModuleDetail(data.moduleStatus),
    };
  } catch (error) {
    throw new Error(error?.message || 'No se pudo validar el PIN.');
  }
};

export const fbViewUserPins = async (currentUser, targetUserId = null, modules = null) => {
  if (!currentUser?.uid) {
    throw new Error('Sesión inválida. Inicia sesión nuevamente.');
  }

  try {
    const response = await getUserModulePinsCallable({
      targetUserId: targetUserId || currentUser.uid,
      modules,
      actor: buildActorPayload(currentUser),
    });
    const payload = response.data || {};
    const pins = Array.isArray(payload.pins)
      ? payload.pins.map((entry) => ({
          ...entry,
          createdAt: parseIsoDate(entry.createdAt),
          expiresAt: parseIsoDate(entry.expiresAt),
        }))
      : [];
    return {
      schema: payload.schema || 'v2',
      pins,
      targetUser: payload.targetUser || null,
    };
  } catch (error) {
    throw new Error(error?.message || 'No se pudo recuperar el PIN.');
  }
};
