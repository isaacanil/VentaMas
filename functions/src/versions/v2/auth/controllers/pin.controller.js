import { compare as bcryptCompare } from 'bcryptjs';
import { logger } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, Timestamp, FieldValue } from '../../../../core/config/firebase.js';
import { logPinAction } from '../pin/pin.audit.js';
import {
  ADMIN_CAN_GENERATE_ROLES,
  SELF_CAN_GENERATE_ROLES,
  PIN_ROTATION_SCHEDULE,
  PIN_ROTATION_TIMEZONE,
  SYSTEM_ACTOR,
} from '../pin/pin.constants.js';
import { generatePinValue, encryptPin, decryptPin } from '../pin/pin.crypto.js';
import { handleError } from '../pin/pin.errors.js';
import {
  normalizeModules,
  toIsoString,
  calcExpiration,
  summarizeModules,
  buildLegacyStatus,
  formatStatusResponse,
} from '../pin/pin.status.js';
import {
  loadUserDoc,
  resolveActorContext,
  ensureBusinessMatch,
} from '../pin/pin.users.js';
import { extractUserData } from '../pin/pin.utils.js';

export const autoRotateModulePins = onSchedule(
  {
    schedule: PIN_ROTATION_SCHEDULE,
    timeZone: PIN_ROTATION_TIMEZONE,
    retryConfig: {
      retryCount: 3,
    },
  },
  async () => {
    try {
      const snapshot = await db
        .collection('users')
        .where('authorizationPins.version', '==', 2)
        .get();

      if (snapshot.empty) {
        logger.info('[pinAuth] Auto-rotation: no candidates found');
        return;
      }

      logger.info('[pinAuth] Auto-rotation: processing users', {
        candidates: snapshot.size,
      });

      for (const docSnap of snapshot.docs) {
        try {
          const {
            user: targetUser,
            authorizationPins,
            legacyPin,
          } = extractUserData(docSnap);
          const modulesPayload = authorizationPins?.modules;
          const businessID = targetUser?.businessID || null;

          const now = Timestamp.now();
          const nowMillis = now.toMillis();
          const newExpiresAt = calcExpiration(now);
          const modulesRotated = [];

          if (modulesPayload && typeof modulesPayload === 'object') {
            const updatedModules = { ...modulesPayload };

            for (const [moduleKey, payload] of Object.entries(modulesPayload)) {
              if (!payload) continue;

              const expiresAtMillis =
                payload.expiresAt?.toMillis?.() ?? payload.expiresAt ?? 0;
              const isExpired =
                expiresAtMillis > 0 && expiresAtMillis <= nowMillis;
              const isActive =
                payload.status !== 'inactive' && payload.isActive !== false;

              if (!isActive && !isExpired) {
                continue;
              }

              const pinValue = generatePinValue();
              const encrypted = encryptPin(pinValue);

              updatedModules[moduleKey] = {
                ...encrypted,
                module: moduleKey,
                isActive: true,
                status: 'active',
                createdAt: now,
                updatedAt: now,
                lastGeneratedAt: now,
                expiresAt: newExpiresAt,
                createdBy: SYSTEM_ACTOR,
                lastGeneratedBy: SYSTEM_ACTOR,
              };

              modulesRotated.push(moduleKey);
            }

            if (modulesRotated.length) {
              await docSnap.ref.set(
                {
                  authorizationPins: {
                    ...authorizationPins,
                    modules: updatedModules,
                    updatedAt: now,
                    lastGeneratedAt: now,
                    lastGeneratedBy: SYSTEM_ACTOR,
                    expiresAt: newExpiresAt,
                  },
                  authorizationPin: FieldValue.delete(),
                },
                { merge: true },
              );

              await logPinAction({
                businessID,
                actor: SYSTEM_ACTOR,
                targetUserId: docSnap.id,
                targetUser,
                modules: modulesRotated,
                action: 'auto_rotate',
                reason: 'scheduled_rotation',
              });
            }
          }

          if (!modulesRotated.length && legacyPin?.pin) {
            const legacyExpiresAtMillis =
              legacyPin.expiresAt?.toMillis?.() ?? legacyPin.expiresAt ?? 0;
            const legacyExpired =
              legacyExpiresAtMillis > 0 && legacyExpiresAtMillis <= nowMillis;

            if (legacyPin.isActive && legacyExpired) {
              await docSnap.ref.set(
                {
                  authorizationPin: {
                    ...legacyPin,
                    isActive: false,
                    deactivatedAt: now,
                    updatedAt: now,
                  },
                },
                { merge: true },
              );

              await logPinAction({
                businessID,
                actor: SYSTEM_ACTOR,
                targetUserId: docSnap.id,
                targetUser,
                action: 'legacy_auto_deactivate',
                reason: 'scheduled_rotation',
              });
            }
          }
        } catch (userError) {
          logger.error('[pinAuth] Auto-rotation: failed for user', {
            userId: docSnap.id,
            error: userError,
          });
        }
      }

      logger.info('[pinAuth] Auto-rotation: completed successfully');
    } catch (error) {
      logger.error('[pinAuth] Auto-rotation: job failed', { error });
      throw error;
    }
  },
);

export const generateModulePins = onCall(async (req) => {
  try {
    const { targetUserId, modules } = req.data || {};
    const { actorUid, actorUser } = await resolveActorContext(req);

    if (!targetUserId) {
      throw new HttpsError('invalid-argument', 'targetUserId es requerido.');
    }

    const requestedModules = normalizeModules(modules);
    if (!requestedModules.length) {
      throw new HttpsError(
        'invalid-argument',
        'Debes seleccionar al menos un módulo válido.',
      );
    }

    const targetSnap = await loadUserDoc(targetUserId);
    if (!targetSnap) {
      throw new HttpsError('not-found', 'Usuario objetivo no encontrado.');
    }

    const { user: targetUser, authorizationPins } = extractUserData(targetSnap);

    const actorRole = actorUser?.role || '';
    const isSelfRequest = actorUid === targetUserId;

    if (isSelfRequest && !SELF_CAN_GENERATE_ROLES.has(actorRole)) {
      throw new HttpsError(
        'permission-denied',
        'No tienes permisos para generar tu propio PIN.',
      );
    }
    if (!isSelfRequest && !ADMIN_CAN_GENERATE_ROLES.has(actorRole)) {
      throw new HttpsError(
        'permission-denied',
        'No tienes permisos para generar PINs.',
      );
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
    await userRef.set(
      {
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
      },
      { merge: true },
    );

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

    const {
      user: targetUser,
      authorizationPins,
      legacyPin,
    } = extractUserData(targetSnap);
    const actorRole = actorUser?.role || '';

    if (!ADMIN_CAN_GENERATE_ROLES.has(actorRole) && actorUid !== targetUserId) {
      throw new HttpsError(
        'permission-denied',
        'No tienes permisos para desactivar este PIN.',
      );
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
        await db
          .collection('users')
          .doc(targetUserId)
          .set(
            {
              authorizationPins: {
                ...authorizationPins,
                modules: updatedModules,
                updatedAt: now,
              },
            },
            { merge: true },
          );
      }
    } else if (legacyPin?.pin) {
      await db
        .collection('users')
        .doc(targetUserId)
        .set(
          {
            authorizationPin: {
              ...legacyPin,
              isActive: false,
              deactivatedAt: now,
              updatedAt: now,
            },
          },
          { merge: true },
        );
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

    const {
      user: targetUser,
      authorizationPins,
      legacyPin,
    } = extractUserData(targetSnap);

    ensureBusinessMatch(actorUser, targetUser);

    let response;
    if (authorizationPins?.modules) {
      const status = summarizeModules(authorizationPins.modules);
      response = formatStatusResponse(
        status,
        authorizationPins.lastGeneratedBy ||
          authorizationPins.createdBy ||
          null,
      );
    } else if (legacyPin?.pin) {
      const legacy = buildLegacyStatus(legacyPin, Date.now());
      response = formatStatusResponse(
        legacy,
        legacy.summary.createdBy || legacyPin.createdBy || null,
      );
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
      throw new HttpsError(
        'failed-precondition',
        'Tu usuario no tiene un negocio asignado.',
      );
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('user.businessID', '==', businessID)
      .get();

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
      throw new HttpsError(
        'permission-denied',
        'Tu usuario no tiene negocio asignado.',
      );
    }

    const normalizedUsername =
      typeof username === 'string' ? username.trim().toLowerCase() : null;

    const usersRef = db.collection('users');
    let candidatesSnapshot;
    if (normalizedUsername) {
      candidatesSnapshot = await usersRef
        .where('user.name', '==', normalizedUsername)
        .get();
    } else {
      candidatesSnapshot = await usersRef
        .where('user.businessID', '==', businessID)
        .get();
    }

    let matchedUserDoc = null;
    let matchedUserData = null;
    let matchedModuleDetails = null;

    for (const docSnap of candidatesSnapshot.docs) {
      const { user, authorizationPins, legacyPin } = extractUserData(docSnap);
      if (!user || user.businessID !== businessID) continue;

      if (authorizationPins?.modules?.[module]) {
        const record = authorizationPins.modules[module];
        const expiresAtMillis =
          record.expiresAt?.toMillis?.() ?? record.expiresAt ?? 0;
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
        const modulesList =
          Array.isArray(legacyPin.modules) && legacyPin.modules.length
            ? legacyPin.modules
            : ['invoices'];
        if (!modulesList.includes(module)) {
          continue;
        }
        const expiresAtMillis =
          legacyPin.expiresAt?.toMillis?.() ?? legacyPin.expiresAt ?? 0;
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
        displayName:
          matchedUserData?.displayName || matchedUserData?.name || '',
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

    const {
      user: targetUser,
      authorizationPins,
      legacyPin,
    } = extractUserData(targetSnap);
    ensureBusinessMatch(actorUser, targetUser);

    const actorRole = actorUser?.role || '';
    const isSelf = actorUid === effectiveTarget;
    if (!isSelf && !ADMIN_CAN_GENERATE_ROLES.has(actorRole)) {
      throw new HttpsError(
        'permission-denied',
        'No tienes permisos para ver este PIN.',
      );
    }

    if (!authorizationPins?.modules) {
      if (legacyPin?.pin) {
        throw new HttpsError(
          'failed-precondition',
          'Los PIN heredados no se pueden mostrar.',
        );
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
          isActive:
            Boolean(payload.isActive) &&
            !(
              payload.expiresAt &&
              (payload.expiresAt?.toMillis?.() ?? payload.expiresAt ?? 0) < now
            ),
        });
      } catch (error) {
        logger.error('[pinAuth] Failed to decrypt module pin', {
          module: moduleKey,
          error,
        });
      }
    }

    if (!decryptedPins.length) {
      throw new HttpsError(
        'not-found',
        'No se encontraron módulos con PIN disponible.',
      );
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
