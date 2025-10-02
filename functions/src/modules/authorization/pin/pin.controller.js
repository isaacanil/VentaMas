import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import crypto from 'node:crypto';
import { db, Timestamp, FieldValue } from '../../../core/config/firebase.js';
import { compare as bcryptCompare } from 'bcryptjs';

const EXPIRATION_HOURS = 24;
const ADMIN_CAN_GENERATE_ROLES = new Set(['admin', 'owner', 'dev']);
const SELF_CAN_GENERATE_ROLES = new Set(['admin', 'owner', 'dev']);
const ALLOWED_MODULES = new Set(['invoices', 'accountsReceivable']);

let cachedEncryptionKey = null;

const ensureEncryptionKey = () => {
  if (cachedEncryptionKey) return cachedEncryptionKey;
  const rawKey = process.env.PIN_ENCRYPTION_KEY || '';
  if (!rawKey) {
    throw new HttpsError(
      'failed-precondition',
      'PIN_ENCRYPTION_KEY is not configured. Set it as a base64-encoded 32-byte value.'
    );
  }
  try {
    const key = Buffer.from(rawKey, 'base64');
    if (key.length !== 32) {
      throw new HttpsError(
        'failed-precondition',
        'PIN_ENCRYPTION_KEY must decode to 32 bytes (AES-256 key).'
      );
    }
    cachedEncryptionKey = key;
    return cachedEncryptionKey;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('failed-precondition', 'Invalid PIN_ENCRYPTION_KEY configuration.');
  }
};

const generatePinValue = () => {
  const value = crypto.randomInt(0, 1_000_000);
  return value.toString().padStart(6, '0');
};

const encryptPin = (pin) => {
  const key = ensureEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: 'aes-256-gcm',
    version: 2,
  };
};

const decryptPin = (encryptedRecord) => {
  const key = ensureEncryptionKey();
  try {
    const decipher = crypto.createDecipheriv(
      encryptedRecord.algorithm || 'aes-256-gcm',
      key,
      Buffer.from(encryptedRecord.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(encryptedRecord.authTag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRecord.cipherText, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('[pinAuth] Failed to decrypt PIN', { error });
    throw new HttpsError('internal', 'No se pudo validar el PIN cifrado.');
  }
};

const normalizeModules = (modules) => {
  if (!Array.isArray(modules)) return [];
  const unique = new Set(
    modules
      .map((m) => (typeof m === 'string' ? m.trim() : ''))
      .filter((m) => m && ALLOWED_MODULES.has(m))
  );
  return Array.from(unique);
};

const toIsoString = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Timestamp) {
      return value.toDate().toISOString();
    }
    if (value?.toDate) {
      return value.toDate().toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value).toISOString();
  } catch (error) {
    return null;
  }
};

const calcExpiration = (originTimestamp = Timestamp.now()) => {
  const base = originTimestamp instanceof Timestamp ? originTimestamp : Timestamp.now();
  const expiresMs = base.toMillis() + EXPIRATION_HOURS * 60 * 60 * 1000;
  return Timestamp.fromMillis(expiresMs);
};

const loadUserDoc = async (uid) => {
  if (!uid) return null;
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap;
};

const extractUserData = (snap) => {
  const raw = snap?.data?.() || {};
  return {
    user: raw.user || {},
    authorizationPins: raw.authorizationPins || null,
    legacyPin: raw.authorizationPin || null,
  };
};

const resolveActorContext = async (req) => {
  const actorPayload = req.data?.actor || req.data?.currentUser || req.data?.user || null;
  const candidateIds = [
    req.auth?.uid,
    actorPayload?.uid,
    actorPayload?.id,
    req.data?.actorUid,
    req.data?.uid,
  ].filter((value) => typeof value === 'string' && value.trim().length > 0);

  const actorUid = candidateIds[0];

  if (!actorUid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para realizar esta operación.');
  }

  const actorSnap = await loadUserDoc(actorUid);
  if (!actorSnap) {
    throw new HttpsError('permission-denied', 'No se encontró tu usuario.');
  }

  const { user: actorUser } = extractUserData(actorSnap) || {};
  if (!actorUser) {
    throw new HttpsError('permission-denied', 'Perfil de usuario inválido.');
  }

  const expectedBusinessId =
    actorPayload?.businessID ||
    req.data?.businessId ||
    req.data?.businessID ||
    null;

  if (expectedBusinessId && actorUser.businessID && actorUser.businessID !== expectedBusinessId) {
    throw new HttpsError('permission-denied', 'El negocio indicado no coincide con tu sesión.');
  }

  if (!actorUser.businessID) {
    throw new HttpsError('permission-denied', 'Tu usuario no tiene un negocio asignado.');
  }

  if (actorUser.active === false) {
    throw new HttpsError('permission-denied', 'Tu usuario está inactivo.');
  }

  return {
    actorUid,
    actorUser,
    actorSnap,
    actorPayload,
  };
};

const ensureBusinessMatch = (actor, target) => {
  const actorBusiness = actor?.businessID;
  const targetBusiness = target?.businessID;
  if (!actorBusiness || !targetBusiness || actorBusiness !== targetBusiness) {
    throw new HttpsError('permission-denied', 'No tienes permisos para operar sobre este usuario.');
  }
  return actorBusiness;
};

const buildModuleStatus = (moduleKey, payload, nowMillis) => {
  if (!payload) return null;
  const expiresAtMillis = payload.expiresAt?.toMillis?.() ?? payload.expiresAt ?? 0;
  const isExpired = expiresAtMillis > 0 && expiresAtMillis < nowMillis;
  const isActive = Boolean(payload.isActive) && !isExpired;
  const status = isActive ? 'active' : isExpired ? 'expired' : 'inactive';

  return {
    module: moduleKey,
    status,
    isActive,
    isExpired,
    createdAt: toIsoString(payload.createdAt),
    updatedAt: toIsoString(payload.updatedAt),
    expiresAt: toIsoString(payload.expiresAt),
    deactivatedAt: toIsoString(payload.deactivatedAt),
    lastGeneratedAt: toIsoString(payload.lastGeneratedAt || payload.createdAt),
    createdBy: payload.createdBy || null,
    lastGeneratedBy: payload.lastGeneratedBy || null,
    schema: 'v2',
  };
};

const buildLegacyStatus = (legacyPin, nowMillis) => {
  if (!legacyPin?.pin) return null;
  const modules = Array.isArray(legacyPin.modules) && legacyPin.modules.length
    ? legacyPin.modules
    : ['invoices'];
  const expiresAtMillis = legacyPin.expiresAt?.toMillis?.() ?? legacyPin.expiresAt ?? 0;
  const isExpired = expiresAtMillis > 0 && expiresAtMillis < nowMillis;
  const isActive = Boolean(legacyPin.isActive) && !isExpired;
  const status = isActive ? 'active' : isExpired ? 'expired' : 'inactive';

  const moduleStatuses = modules.reduce((acc, module) => {
    acc[module] = {
      module,
      status,
      isActive,
      isExpired,
      createdAt: toIsoString(legacyPin.createdAt),
      updatedAt: toIsoString(legacyPin.updatedAt || legacyPin.createdAt),
      expiresAt: toIsoString(legacyPin.expiresAt),
      deactivatedAt: toIsoString(legacyPin.deactivatedAt),
      schema: 'legacy',
      createdBy: legacyPin.createdBy || null,
      lastGeneratedBy: legacyPin.createdBy || null,
    };
    return acc;
  }, {});

  return {
    moduleDetails: moduleStatuses,
    summary: {
      schema: 'legacy',
      hasPin: true,
      isActive,
      isExpired,
      modules,
      activeModules: isActive ? modules : [],
      createdAt: toIsoString(legacyPin.createdAt),
      expiresAt: toIsoString(legacyPin.expiresAt),
      createdBy: legacyPin.createdBy || null,
      updatedAt: toIsoString(legacyPin.updatedAt || legacyPin.createdAt),
    },
  };
};

const summarizeModules = (modulesMap) => {
  const nowMillis = Date.now();
  const entries = Object.entries(modulesMap || {});
  if (!entries.length) {
    return {
      moduleDetails: {},
      summary: {
        schema: 'v2',
        hasPin: false,
        isActive: false,
        isExpired: false,
        modules: [],
        activeModules: [],
        createdAt: null,
        expiresAt: null,
        updatedAt: null,
      },
    };
  }

  const moduleDetails = {};
  let anyActive = false;
  let allExpired = true;
  let earliestExpiration = null;
  let latestCreation = null;

  for (const [moduleKey, payload] of entries) {
    const status = buildModuleStatus(moduleKey, payload, nowMillis);
    if (!status) continue;
    moduleDetails[moduleKey] = status;
    if (status.isActive) anyActive = true;
    if (!status.isExpired) allExpired = false;

    if (status.expiresAt) {
      if (!earliestExpiration || status.expiresAt < earliestExpiration) {
        earliestExpiration = status.expiresAt;
      }
    }
    if (status.createdAt) {
      if (!latestCreation || status.createdAt > latestCreation) {
        latestCreation = status.createdAt;
      }
    }
  }

  const modulesList = Object.keys(moduleDetails);
  const activeModules = modulesList.filter((m) => moduleDetails[m].isActive);

  return {
    moduleDetails,
    summary: {
      schema: 'v2',
      hasPin: modulesList.length > 0,
      isActive: anyActive,
      isExpired: modulesList.length > 0 ? allExpired : false,
      modules: modulesList,
      activeModules,
      createdAt: latestCreation,
      expiresAt: earliestExpiration,
      updatedAt: latestCreation,
    },
  };
};

const formatStatusResponse = (moduleStatus, createdBy) => {
  if (!moduleStatus) {
    return {
      hasPin: false,
      isActive: false,
      isExpired: false,
      createdAt: null,
      expiresAt: null,
      modules: [],
      activeModules: [],
      moduleDetails: {},
      schema: 'v2',
      createdBy: createdBy || null,
      updatedAt: null,
    };
  }

  const { moduleDetails, summary } = moduleStatus;
  return {
    hasPin: summary.hasPin,
    isActive: summary.isActive,
    isExpired: summary.isExpired,
    createdAt: summary.createdAt,
    expiresAt: summary.expiresAt,
    modules: summary.modules,
    activeModules: summary.activeModules,
    moduleDetails,
    schema: summary.schema,
    createdBy: summary.createdBy || createdBy || null,
    updatedAt: summary.updatedAt,
  };
};

const logPinAction = async ({ businessID, actor, targetUserId, targetUser, action, reason, module, modules }) => {
  if (!businessID) return;
  try {
    const logsRef = db.collection('businesses').doc(businessID).collection('pinAuthLogs');
    await logsRef.add({
      action,
      reason: reason || null,
      module: module || null,
      modules: modules || null,
      targetUserId: targetUserId || null,
      targetUserName: targetUser?.displayName || targetUser?.name || null,
      performedBy: actor,
      timestamp: Timestamp.now(),
      businessID,
    });
  } catch (error) {
    logger.error('[pinAuth] Failed to write audit log', { error });
  }
};

const handleError = (error, fallbackMessage = 'Error procesando la solicitud de PIN') => {
  if (error instanceof HttpsError) throw error;
  logger.error('[pinAuth] Unhandled error', { error });
  throw new HttpsError('internal', fallbackMessage);
};

export const generateModulePins = onCall(async (req) => {
  try {
    const { targetUserId, modules } = req.data || {};
    const { actorUid, actorUser } = await resolveActorContext(req);

    if (!targetUserId) {
      throw new HttpsError('invalid-argument', 'targetUserId es requerido.');
    }

    const requestedModules = normalizeModules(modules);
    if (!requestedModules.length) {
      throw new HttpsError('invalid-argument', 'Debes seleccionar al menos un módulo válido.');
    }

    const targetSnap = await loadUserDoc(targetUserId);
    if (!targetSnap) {
      throw new HttpsError('not-found', 'Usuario objetivo no encontrado.');
    }

    const { user: targetUser, authorizationPins } = extractUserData(targetSnap);

    const actorRole = actorUser?.role || '';
    const isSelfRequest = actorUid === targetUserId;

    if (isSelfRequest && !SELF_CAN_GENERATE_ROLES.has(actorRole)) {
      throw new HttpsError('permission-denied', 'No tienes permisos para generar tu propio PIN.');
    }
    if (!isSelfRequest && !ADMIN_CAN_GENERATE_ROLES.has(actorRole)) {
      throw new HttpsError('permission-denied', 'No tienes permisos para generar PINs.');
    }

    const businessID = ensureBusinessMatch(actorUser, targetUser);

    const now = Timestamp.now();
    const expiresAt = calcExpiration(now);

    const existingModules = authorizationPins?.modules || {};
    const updatedModules = { ...existingModules };
    const plainPins = {};

    for (const module of requestedModules) {
      const pinValue = generatePinValue();
      const encrypted = encryptPin(pinValue);
      updatedModules[module] = {
        ...encrypted,
        module,
        isActive: true,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastGeneratedAt: now,
        expiresAt,
        createdBy: {
          uid: actorUid,
          name: actorUser.displayName || actorUser.name || '',
          role: actorRole,
        },
        lastGeneratedBy: {
          uid: actorUid,
          name: actorUser.displayName || actorUser.name || '',
          role: actorRole,
        },
      };
      plainPins[module] = {
        module,
        pin: pinValue,
        createdAt: toIsoString(now),
        expiresAt: toIsoString(expiresAt),
      };
    }

    for (const moduleKey of Object.keys(updatedModules)) {
      if (!requestedModules.includes(moduleKey)) {
        updatedModules[moduleKey] = {
          ...updatedModules[moduleKey],
          isActive: false,
          status: 'inactive',
          deactivatedAt: now,
          updatedAt: now,
        };
      }
    }

    const userRef = db.collection('users').doc(targetUserId);
    await userRef.set({
      authorizationPins: {
        version: 2,
        modules: updatedModules,
        updatedAt: now,
        lastGeneratedAt: now,
        lastGeneratedBy: {
          uid: actorUid,
          name: actorUser.displayName || actorUser.name || '',
          role: actorRole,
        },
        expiresAt,
      },
      authorizationPin: FieldValue.delete(),
    }, { merge: true });

    await logPinAction({
      businessID,
      actor: {
        uid: actorUid,
        name: actorUser.displayName || actorUser.name || '',
        role: actorRole,
      },
      targetUserId,
      targetUser,
      modules: requestedModules,
      action: 'generate',
    });

    return {
      modules: requestedModules,
      pins: plainPins,
      metadata: {
        generatedAt: toIsoString(now),
        expiresAt: toIsoString(expiresAt),
        schema: 'v2',
      },
      targetUser: {
        uid: targetUserId,
        name: targetUser?.name || '',
        displayName: targetUser?.displayName || targetUser?.name || '',
        role: targetUser?.role || '',
      },
    };
  } catch (error) {
    handleError(error, 'No se pudo generar el PIN.');
  }
});

export const deactivateModulePins = onCall(async (req) => {
  try {
    const { targetUserId, modules } = req.data || {};
    const { actorUid, actorUser } = await resolveActorContext(req);
    if (!targetUserId) {
      throw new HttpsError('invalid-argument', 'targetUserId es requerido.');
    }

    const targetSnap = await loadUserDoc(targetUserId);
    if (!targetSnap) {
      throw new HttpsError('not-found', 'Usuario objetivo no encontrado.');
    }

    const { user: targetUser, authorizationPins, legacyPin } = extractUserData(targetSnap);
    const actorRole = actorUser?.role || '';

    if (!ADMIN_CAN_GENERATE_ROLES.has(actorRole) && actorUid !== targetUserId) {
      throw new HttpsError('permission-denied', 'No tienes permisos para desactivar este PIN.');
    }

    const businessID = ensureBusinessMatch(actorUser, targetUser);

    const now = Timestamp.now();
    const requestedModules = normalizeModules(modules);

    if (authorizationPins?.modules) {
      const updatedModules = { ...authorizationPins.modules };
      const targetKeys = requestedModules.length
        ? requestedModules
        : Object.keys(updatedModules);

      let anyUpdated = false;
      for (const key of targetKeys) {
        if (!updatedModules[key]) continue;
        updatedModules[key] = {
          ...updatedModules[key],
          isActive: false,
          status: 'inactive',
          deactivatedAt: now,
          updatedAt: now,
        };
        anyUpdated = true;
      }

      if (anyUpdated) {
        await db.collection('users').doc(targetUserId).set({
          authorizationPins: {
            ...authorizationPins,
            modules: updatedModules,
            updatedAt: now,
          },
        }, { merge: true });
      }
    } else if (legacyPin?.pin) {
      await db.collection('users').doc(targetUserId).set({
        authorizationPin: {
          ...legacyPin,
          isActive: false,
          deactivatedAt: now,
          updatedAt: now,
        },
      }, { merge: true });
    }

    await logPinAction({
      businessID,
      actor: {
        uid: actorUid,
        name: actorUser.displayName || actorUser.name || '',
        role: actorRole,
      },
      targetUserId,
      targetUser,
      modules: requestedModules.length ? requestedModules : null,
      action: 'deactivate',
    });

    return { success: true };
  } catch (error) {
    handleError(error, 'No se pudo desactivar el PIN.');
  }
});

export const getUserModulePinStatus = onCall(async (req) => {
  try {
    const { targetUserId } = req.data || {};
    const { actorUid, actorUser } = await resolveActorContext(req);

    const effectiveTarget = targetUserId || actorUid;
    const targetSnap = await loadUserDoc(effectiveTarget);

    if (!targetSnap) {
      throw new HttpsError('not-found', 'Usuario no encontrado.');
    }

    const { user: targetUser, authorizationPins, legacyPin } = extractUserData(targetSnap);

    ensureBusinessMatch(actorUser, targetUser);

    let response;
    if (authorizationPins?.modules) {
      const status = summarizeModules(authorizationPins.modules);
      response = formatStatusResponse(status, authorizationPins.lastGeneratedBy || authorizationPins.createdBy || null);
    } else if (legacyPin?.pin) {
      const legacy = buildLegacyStatus(legacyPin, Date.now());
      response = formatStatusResponse(legacy, legacy.summary.createdBy || legacyPin.createdBy || null);
    } else {
      response = formatStatusResponse(null, null);
    }

    return {
      ...response,
      targetUser: {
        uid: effectiveTarget,
        name: targetUser?.name || '',
        displayName: targetUser?.displayName || targetUser?.name || '',
        role: targetUser?.role || '',
      },
    };
  } catch (error) {
    handleError(error, 'No se pudo obtener el estado del PIN.');
  }
});

export const getBusinessPinsSummary = onCall(async (req) => {
  try {
    const { actorUser } = await resolveActorContext(req);
    const businessID = actorUser?.businessID;
    if (!businessID) {
      throw new HttpsError('failed-precondition', 'Tu usuario no tiene un negocio asignado.');
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('user.businessID', '==', businessID).get();

    const users = [];
    snapshot.forEach((docSnap) => {
      const { user, authorizationPins, legacyPin } = extractUserData(docSnap);
      let status;
      if (authorizationPins?.modules) {
        status = summarizeModules(authorizationPins.modules);
      } else if (legacyPin?.pin) {
        status = buildLegacyStatus(legacyPin, Date.now());
      } else {
        status = {
          moduleDetails: {},
          summary: {
            schema: 'v2',
            hasPin: false,
            isActive: false,
            isExpired: false,
            modules: [],
            activeModules: [],
            createdAt: null,
            expiresAt: null,
            updatedAt: null,
          },
        };
      }

      const summary = status.summary;
      users.push({
        id: docSnap.id,
        name: user?.name || '',
        displayName: user?.displayName || user?.name || '',
        role: user?.role || '',
        active: user?.active ?? true,
        hasPin: summary.hasPin,
        pinIsActive: summary.isActive,
        pinIsExpired: summary.isExpired,
        pinCreatedAt: summary.createdAt,
        pinExpiresAt: summary.expiresAt,
        pinModules: summary.modules,
        moduleDetails: status.moduleDetails,
        schema: summary.schema,
      });
    });

    users.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { users };
  } catch (error) {
    handleError(error, 'No se pudo obtener la lista de usuarios.');
  }
});

export const validateModulePin = onCall(async (req) => {
  try {
    const { pin, module = 'invoices', username } = req.data || {};
    if (!pin || typeof pin !== 'string' || pin.length !== 6) {
      throw new HttpsError('invalid-argument', 'PIN inválido.');
    }

    const { actorUid, actorUser } = await resolveActorContext(req);
    const businessID = actorUser?.businessID;
    if (!businessID) {
      throw new HttpsError('permission-denied', 'Tu usuario no tiene negocio asignado.');
    }

    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : null;

    const usersRef = db.collection('users');
    let candidatesSnapshot;
    if (normalizedUsername) {
      candidatesSnapshot = await usersRef.where('user.name', '==', normalizedUsername).get();
    } else {
      candidatesSnapshot = await usersRef.where('user.businessID', '==', businessID).get();
    }

    let matchedUserDoc = null;
    let matchedUserData = null;
    let matchedModuleDetails = null;

    for (const docSnap of candidatesSnapshot.docs) {
      const { user, authorizationPins, legacyPin } = extractUserData(docSnap);
      if (!user || user.businessID !== businessID) continue;

      if (authorizationPins?.modules?.[module]) {
        const record = authorizationPins.modules[module];
        const expiresAtMillis = record.expiresAt?.toMillis?.() ?? record.expiresAt ?? 0;
        const isExpired = expiresAtMillis > 0 && expiresAtMillis < Date.now();
        if (!record.isActive || isExpired) {
          continue;
        }
        const storedPin = decryptPin(record);
        if (storedPin === pin) {
          matchedUserDoc = docSnap;
          matchedUserData = user;
          const status = summarizeModules({ [module]: record });
          matchedModuleDetails = status.moduleDetails[module];
          break;
        }
      } else if (legacyPin?.pin) {
        const modulesList = Array.isArray(legacyPin.modules) && legacyPin.modules.length
          ? legacyPin.modules
          : ['invoices'];
        if (!modulesList.includes(module)) {
          continue;
        }
        const expiresAtMillis = legacyPin.expiresAt?.toMillis?.() ?? legacyPin.expiresAt ?? 0;
        const isExpired = expiresAtMillis > 0 && expiresAtMillis < Date.now();
        if (!legacyPin.isActive || isExpired) {
          continue;
        }
        const isValid = await bcryptCompare(pin, legacyPin.pin);
        if (isValid) {
          matchedUserDoc = docSnap;
          matchedUserData = user;
          const legacyStatus = buildLegacyStatus(legacyPin, Date.now());
          matchedModuleDetails = legacyStatus.moduleDetails?.[module] || null;
          break;
        }
      }
    }

    if (!matchedUserDoc) {
    await logPinAction({
      businessID,
      actor: {
        uid: actorUid,
        name: actorUser.displayName || actorUser.name || '',
        role: actorUser.role || '',
      },
      targetUserId: null,
      targetUser: null,
        action: 'validate_failed',
        module,
        reason: normalizedUsername ? 'wrong_pin_or_user' : 'pin_not_found',
      });

      return { valid: false, reason: 'PIN incorrecto' };
    }

    await logPinAction({
      businessID,
      actor: {
        uid: actorUid,
        name: actorUser.displayName || actorUser.name || '',
        role: actorUser.role || '',
      },
      targetUserId: matchedUserDoc.id,
      targetUser: matchedUserData,
      action: 'validate_success',
      module,
    });

    return {
      valid: true,
      user: {
        uid: matchedUserDoc.id,
        name: matchedUserData?.name || '',
        displayName: matchedUserData?.displayName || matchedUserData?.name || '',
        role: matchedUserData?.role || '',
        businessID: matchedUserData?.businessID || '',
      },
      moduleStatus: matchedModuleDetails,
    };
  } catch (error) {
    handleError(error, 'No se pudo validar el PIN.');
  }
});

export const getUserModulePins = onCall(async (req) => {
  try {
    const { targetUserId, modules } = req.data || {};
    const { actorUid, actorUser } = await resolveActorContext(req);

    const effectiveTarget = targetUserId || actorUid;
    const targetSnap = await loadUserDoc(effectiveTarget);
    if (!targetSnap) {
      throw new HttpsError('not-found', 'Usuario no encontrado.');
    }

    const { user: targetUser, authorizationPins, legacyPin } = extractUserData(targetSnap);
    ensureBusinessMatch(actorUser, targetUser);

    const actorRole = actorUser?.role || '';
    const isSelf = actorUid === effectiveTarget;
    if (!isSelf && !ADMIN_CAN_GENERATE_ROLES.has(actorRole)) {
      throw new HttpsError('permission-denied', 'No tienes permisos para ver este PIN.');
    }

    if (!authorizationPins?.modules) {
      if (legacyPin?.pin) {
        throw new HttpsError('failed-precondition', 'Los PIN heredados no se pueden mostrar.');
      }
      return { pins: [], schema: 'v2' };
    }

    const requested = normalizeModules(modules);
    const modulesToReturn = requested.length
      ? requested
      : Object.keys(authorizationPins.modules || {});

    const decryptedPins = [];
    const now = Date.now();

    for (const moduleKey of modulesToReturn) {
      const payload = authorizationPins.modules[moduleKey];
      if (!payload) continue;

      try {
        const pinValue = decryptPin(payload);
        decryptedPins.push({
          module: moduleKey,
          pin: pinValue,
          createdAt: toIsoString(payload.createdAt),
          expiresAt: toIsoString(payload.expiresAt),
          isActive: Boolean(payload.isActive) && !(payload.expiresAt && ((payload.expiresAt?.toMillis?.() ?? payload.expiresAt ?? 0) < now)),
        });
      } catch (error) {
        logger.error('[pinAuth] Failed to decrypt module pin', { module: moduleKey, error });
      }
    }

    if (!decryptedPins.length) {
      throw new HttpsError('not-found', 'No se encontraron módulos con PIN disponible.');
    }

    return {
      schema: 'v2',
      pins: decryptedPins,
      targetUser: {
        uid: effectiveTarget,
        name: targetUser?.name || '',
        displayName: targetUser?.displayName || targetUser?.name || '',
        role: targetUser?.role || '',
      },
    };
  } catch (error) {
    handleError(error, 'No se pudo recuperar el PIN.');
  }
});
