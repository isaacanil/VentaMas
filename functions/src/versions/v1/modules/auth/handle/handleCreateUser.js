import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db } from '../../../../../core/config/firebase.js';
import { nextSeq } from '../../../../../core/utils/getNextID.js';
import {
  ensureUniqueUsername,
  prepareUserCreationData,
} from '../utils/auth.util.js';

/**
 * Crea un usuario nuevo (transaccional, nombres únicos, hash fuerte)
 */
export const handleCreateUser = onCall(async (req) => {
  logger.info('Creating user', { data: req.data });

  const { userData } = req.data ?? {};
  const actor = req.data.user || {};

  // Validar y preparar datos
  const processedData = await prepareUserCreationData(userData, actor);

  const usersCol = db.collection('users');
  const id = nanoid(10);
  /* ──────────────── transacción ──────────────── */
  await db.runTransaction(async (tx) => {
    // Verificar nombre único
    const normName = await ensureUniqueUsername(tx, userData.name);

    // Obtener correlativo atómico
    const seq = await nextSeq({ tx, user: actor, name: 'users' });

    // Persistir usuario - normalizar el nombre en los datos procesados
    const finalData = {
      user: {
        ...processedData.user,
        name: normName,
        number: seq,
      },
    };

    tx.set(usersCol.doc(id), {
      ...finalData,
    });
  });

  return { ok: true, id, displayName: userData.name.trim() };
});
