/* users.functions.js
   CRUD helpers → update user + cambio de clave */

import { logger } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { db, admin } from '../../../../../core/config/firebase.js';
import {
  validatePermissions,
  validateUserModificationPermissions,
  getUserById,
  ensureUniqueUsername,
  prepareUserUpdateData
} from '../utils/auth.util.js';
import { verifyAndUpgrade } from '../utils/hash.util.js';

/* ─────────────────── util: aplica patch ─────────────────── */
async function patchUser(tx, uid, patch) {
  const { ref } = await getUserById(tx, uid);
  tx.update(ref, patch);
}

/* ─────────────────── 1. UPDATE genérico ─────────────────── */
export const handleUpdateUser = onCall(async req => {
  logger.info('Updating user', { data: req.data });

  const { userId, updates = {}, user: actor = {} } = req.data ?? {};
  
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID obligatorio');
  }
  if (!Object.keys(updates).length) {
    throw new HttpsError('invalid-argument', 'Nada que actualizar');
  }

  await db.runTransaction(async tx => {
    // Preparar datos de actualización
    const patch = await prepareUserUpdateData(updates, actor);

    // Verificar nombre único si se está actualizando
    if ('name' in updates) {
      const normName = await ensureUniqueUsername(tx, updates.name, userId);
      patch.name = normName;
    }

    if (!Object.keys(patch).length) {
      throw new HttpsError('invalid-argument', 'Patch vacío');
    }

    await patchUser(tx, userId, patch);
  });

  /* revocar tokens si cambió contraseña */
  if ('password' in updates) {
    admin.auth().revokeRefreshTokens(userId)
      .catch(e => logger.warn(`No se pudieron revocar tokens para ${userId}`, e));
  }

  return { ok: true, userId };
});

/* ─────────────────── 2. UPDATE con permisos ─────────────────── */
export const handleUpdateUserWithPermissions = onCall(async req => {
  const actor = req.data.user || {};
  
  // Validar permisos de administrador
  validatePermissions(actor, ['admin']);

  // Prevenir que un admin se desactive a sí mismo
  if (req.data.userId === actor.uid && req.data.updates?.active === false) {
    throw new HttpsError('permission-denied', 'No puedes desactivarte');
  }

  return handleUpdateUser(req);
});

/* ─────────────────── 3. CAMBIO de contraseña ─────────────────── */
export const handleChangePassword = onCall(async req => {
  const { userId, newPassword, currentPassword } = req.data ?? {};
  const actor = req.data.user || {};

  if (!userId || !newPassword) {
    throw new HttpsError('invalid-argument', 'ID y nueva contraseña requeridos');
  }

  // Validar permisos
  const { isAdmin, isSelf } = validateUserModificationPermissions(actor, userId);
  if (isSelf && !isAdmin) {
    /* verificar clave actual */
    if (!currentPassword) {
      throw new HttpsError('invalid-argument', 'Contraseña actual requerida');
    }

    await db.runTransaction(async (tx) => {
      const { data: userData } = await getUserById(tx, userId);
      const { ok } = await verifyAndUpgrade(currentPassword, userData.password);
      if (!ok) {
        throw new HttpsError('unauthenticated', 'Contraseña actual incorrecta');
      }
    });
  }

  /* reusa lógica de update */
  return handleUpdateUser({
    auth: req.auth,
    data: {
      userId,
      updates: { password: newPassword },
      user: actor
    }
  });
});
