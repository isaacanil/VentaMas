import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../core/config/firebase.js';

import { extractUserData } from './pin.utils.js';

export const loadUserDoc = async (uid) => {
  if (!uid) return null;
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap;
};

export const resolveActorContext = async (req) => {
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

export const ensureBusinessMatch = (actor, target) => {
  const actorBusiness = actor?.businessID;
  const targetBusiness = target?.businessID;
  if (!actorBusiness || !targetBusiness || actorBusiness !== targetBusiness) {
    throw new HttpsError('permission-denied', 'No tienes permisos para operar sobre este usuario.');
  }
  return actorBusiness;
};
