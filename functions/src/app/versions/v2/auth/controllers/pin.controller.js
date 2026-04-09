import { compare as bcryptCompare } from 'bcryptjs';
import { logger } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, Timestamp, FieldValue } from '../../../../core/config/firebase.js';
import { MAIL_SECRETS } from '../../../../core/config/secrets.js';
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
  loadActiveBusinessUserDocs,
  hasActiveBusinessMembership,
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
          const businessID =
            targetUser?.activeBusinessId || targetUser?.businessID || null;

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

    const businessID = await ensureBusinessMatch({
      actorUid,
      actor: actorUser,
      targetUid: targetSnap.id,
      target: targetUser,
    });

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

    const businessID = await ensureBusinessMatch({
      actorUid,
      actor: actorUser,
      targetUid: targetSnap.id,
      target: targetUser,
    });

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

    await ensureBusinessMatch({
      actorUid,
      actor: actorUser,
      targetUid: targetSnap.id,
      target: targetUser,
    });

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

export const getBusinessPinsSummary = onCall({ timeoutSeconds: 30 }, async (req) => {
  try {
    const { actorUser } = await resolveActorContext(req);
    const businessID = actorUser?.activeBusinessId || actorUser?.businessID;
    if (!businessID) {
      throw new HttpsError(
        'failed-precondition',
        'Tu usuario no tiene un negocio asignado.',
      );
    }

    const userDocs = await loadActiveBusinessUserDocs(businessID);

    const users = [];
    userDocs.forEach((docSnap) => {
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
        email: user?.email || null,
        emailVerified: user?.emailVerified === true,
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
    const businessID = actorUser?.activeBusinessId || actorUser?.businessID;
    if (!businessID) {
      throw new HttpsError(
        'permission-denied',
        'Tu usuario no tiene negocio asignado.',
      );
    }

    const normalizedUsername =
      typeof username === 'string' ? username.trim().toLowerCase() : null;

    const usersRef = db.collection('users');
    let candidateDocs = [];
    if (normalizedUsername) {
      const rootCandidatesSnapshot = await usersRef
        .where('name', '==', normalizedUsername)
        .get();
      candidateDocs = rootCandidatesSnapshot.docs;
    } else {
      candidateDocs = await loadActiveBusinessUserDocs(businessID);
    }

    let matchedUserDoc = null;
    let matchedUserData = null;
    let matchedModuleDetails = null;

    for (const docSnap of candidateDocs) {
      const hasMembership = await hasActiveBusinessMembership({
        userId: docSnap.id,
        businessId: businessID,
        userData: docSnap.data() || {},
      });
      if (!hasMembership) continue;

      const { user, authorizationPins, legacyPin } = extractUserData(docSnap);
      if (!user) continue;

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
    await ensureBusinessMatch({
      actorUid,
      actor: actorUser,
      targetUid: targetSnap.id,
      target: targetUser,
    });

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

const MODULE_LABELS = {
  invoices: 'Facturación',
  accountsReceivable: 'Cuentas por Cobrar',
};

/**
 * Envía los PINs generados al correo electrónico del usuario objetivo.
 * Requiere que el actor tenga permisos de admin y que el usuario objetivo tenga email verificado.
 */
export const sendPinByEmail = onCall(
  { secrets: MAIL_SECRETS, timeoutSeconds: 30 },
  async (req) => {
    try {
      const { targetUserId, pins, metadata } = req.data || {};
      const { actorUid, actorUser } = await resolveActorContext(req);

      if (!targetUserId) {
        throw new HttpsError(
          'invalid-argument',
          'targetUserId es requerido.',
        );
      }

      if (!pins || typeof pins !== 'object' || !Object.keys(pins).length) {
        throw new HttpsError(
          'invalid-argument',
          'No hay PINs para enviar.',
        );
      }

      const actorRole = actorUser?.role || '';
      const isSelfRequest = actorUid === targetUserId;

      if (isSelfRequest && !SELF_CAN_GENERATE_ROLES.has(actorRole)) {
        throw new HttpsError(
          'permission-denied',
          'No tienes permisos para enviar PINs por correo.',
        );
      }

      if (!isSelfRequest && !ADMIN_CAN_GENERATE_ROLES.has(actorRole)) {
        throw new HttpsError(
          'permission-denied',
          'No tienes permisos para enviar PINs por correo.',
        );
      }

      const targetSnap = await loadUserDoc(targetUserId);
      if (!targetSnap) {
        throw new HttpsError('not-found', 'Usuario objetivo no encontrado.');
      }

      const { user: targetUser } = extractUserData(targetSnap);
      await ensureBusinessMatch({
        actorUid,
        actor: actorUser,
        targetUid: targetSnap.id,
        target: targetUser,
      });

      const targetEmail = targetUser?.email;
      const emailVerified = targetUser?.emailVerified === true;

      if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
        throw new HttpsError(
          'failed-precondition',
          'El usuario no tiene un correo electrónico vinculado.',
        );
      }
      if (!emailVerified) {
        throw new HttpsError(
          'failed-precondition',
          'El correo del usuario no está verificado.',
        );
      }

      // Build email HTML
      const displayName = targetUser?.displayName || targetUser?.name || 'Usuario';
      const expiresAt = metadata?.expiresAt || '';
      const generatedAt = metadata?.generatedAt || new Date().toISOString();

      const pinRows = Object.entries(pins)
        .map(([moduleKey, pinInfo]) => {
          const label = MODULE_LABELS[moduleKey] || moduleKey;
          const pin = pinInfo?.pin || '------';
          let expiry = 'Sin expiración definida';
          if (pinInfo?.expiresAt) {
            expiry = new Date(pinInfo.expiresAt).toLocaleString('es-DO', {
              timeZone: 'America/Santo_Domingo',
            });
          } else if (expiresAt) {
            expiry = new Date(expiresAt).toLocaleString('es-DO', {
              timeZone: 'America/Santo_Domingo',
            });
          }
          return `
            <tr>
              <td style="padding: 14px 16px; border-bottom: 1px solid #f2f4f7;">
                <div style="font-size: 15px; font-weight: 600; color: #101828;">${label}</div>
                <div style="font-size: 12px; color: #667085; margin-top: 4px;">Expira: ${expiry}</div>
              </td>
              <td style="padding: 14px 16px; border-bottom: 1px solid #f2f4f7; font-family: 'Courier New', monospace; font-size: 22px; letter-spacing: 0.35em; text-align: right; color: #1d2939; white-space: nowrap;">
                ${pin}
              </td>
            </tr>`;
        })
        .join('');

      const pinCount = Object.keys(pins).length;
      const pinCountLabel =
        pinCount === 1 ? '1 PIN activo' : `${pinCount} PINs activos`;

      const html = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e4e7ec; border-radius: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e4e7ec; padding-bottom: 20px; margin-bottom: 24px;">
            <span style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #475467;">VentaMax</span>
            <span style="font-size: 11px; color: #98a2b3;">Generado ${new Date(generatedAt).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 600; color: #101828; margin: 0 0 8px;">PIN de Autorización</h1>
          <p style="font-size: 14px; color: #475467; margin: 0 0 24px;">Hola <strong>${displayName}</strong>, aquí están tus PINs de autorización.</p>
          <div style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475467; margin-bottom: 8px;">
              <span>${displayName}</span>
              <span>${pinCountLabel}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #475467; border-bottom: 1px solid #e4e7ec; padding: 10px 16px;">Módulo</th>
                  <th style="text-align: right; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #475467; border-bottom: 1px solid #e4e7ec; padding: 10px 16px;">PIN</th>
                </tr>
              </thead>
              <tbody>
                ${pinRows}
              </tbody>
            </table>
          </div>
          <div style="background: #fef3f2; border: 1px solid #fecdca; border-radius: 12px; padding: 16px; text-align: center; font-size: 13px; color: #b42318; line-height: 1.5;">
            <strong>IMPORTANTE:</strong> Este PIN es confidencial. No lo compartas con nadie. Se invalida automáticamente a las 24 horas o cuando sea revocado.
          </div>
          <p style="margin-top: 20px; font-size: 11px; color: #98a2b3; text-align: center;">
            Si no solicitaste estos PINs, contacta a tu administrador inmediatamente.
          </p>
        </div>
      `;

      const plainPinList = Object.entries(pins)
        .map(([moduleKey, pinInfo]) => {
          const label = MODULE_LABELS[moduleKey] || moduleKey;
          return `${label}: ${pinInfo?.pin || '------'}`;
        })
        .join('\n');

      const text = `PIN de Autorización - VentaMax\n\nHola ${displayName},\n\nTus PINs de autorización:\n${plainPinList}\n\nIMPORTANTE: Este PIN es confidencial. Se invalida automáticamente a las 24 horas.`;

      let mailer;
      try {
        mailer = await import('../../../../core/config/mailer.js');
      } catch {
        throw new HttpsError(
          'internal',
          'No se pudo cargar el módulo de correo.',
        );
      }

      if (typeof mailer.getTransport === 'function') {
        const transport = await mailer.getTransport();
        if (!transport) {
          throw new HttpsError(
            'failed-precondition',
            'Servicio de correo no configurado.',
          );
        }
      }

      try {
        await mailer.sendMail({
          to: targetEmail,
          subject: 'Tu PIN de Autorización - VentaMax',
          html,
          text,
        });
      } catch (err) {
        logger.error('[pinAuth] Error enviando PIN por correo', {
          targetUserId,
          email: targetEmail,
          error: String(err?.message || err),
        });
        throw new HttpsError(
          'internal',
          'No se pudo enviar el correo. Intenta de nuevo más tarde.',
        );
      }

      logger.info('[pinAuth] PIN enviado por correo', {
        targetUserId,
        email: targetEmail,
        modules: Object.keys(pins),
        actor: actorUid,
      });

      return {
        ok: true,
        message: 'PINs enviados al correo exitosamente.',
        email: targetEmail,
      };
    } catch (error) {
      handleError(error, 'No se pudo enviar el PIN por correo.');
    }
  },
);
