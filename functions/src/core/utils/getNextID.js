import { https, logger } from 'firebase-functions';

import { db, FieldValue } from '../config/firebase.js';

/**
 * Obtiene y actualiza atómicamente el siguiente ID de un contador usando Admin SDK.
 *
 * @param {Object} user              - Debe contener user.businessID
 * @param {string} name              - Nombre del contador (e.g. 'lastAccountReceivableId')
 * @param {number} [quantity=1]      - Incremento deseado
 * @returns {Promise<number>}        - Nuevo valor del contador
 */
export async function getNextID(user, name, quantity = 1) {
  // Validaciones
  if (!name) throw new Error('No se proporcionó el nombre');
  if (!user?.businessID)
    throw new Error('No se proporcionó el usuario o businessID');
  if (quantity < 1) throw new Error('La cantidad debe ser al menos 1');

  // Referencia al contador
  const counterRef = db.doc(`businesses/${user.businessID}/counters/${name}`);
  try {
    const value = FieldValue.increment(quantity);

    await counterRef.set({ value }, { merge: true });

    const snap = await counterRef.get();
    const data = snap.data();

    return data?.value ?? quantity;
  } catch (error) {
    console.error(
      `Error en getNextID para ${user?.businessID}/${name}:`,
      error,
    );
    throw new Error(`Fallo al obtener el siguiente ID para ${name}.`);
  }
}

/**
 * Incrementa y obtiene de forma transaccional el siguiente valor de un contador.
 * @param {import('firebase-admin').firestore.Transaction} tx
 * @param {{ businessID: string, uid: string }} user
 * @param {string} name - Nombre del contador
 * @param {number} [quantity=1] - Cantidad a incrementar
 * @returns {Promise<number>} Nuevo valor del contador
 * @throws {https.HttpsError}
 */

export async function getNextIDTransactional(tx, user, name, quantity = 1) {
  if (!tx) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere una transacción activa',
    );
  }
  if (!user?.businessID) {
    throw new https.HttpsError(
      'invalid-argument',
      'No se proporcionó el usuario o businessID',
    );
  }
  if (!name) {
    throw new https.HttpsError(
      'invalid-argument',
      'No se proporcionó el nombre del contador',
    );
  }
  if (typeof quantity !== 'number' || quantity < 1) {
    throw new https.HttpsError(
      'invalid-argument',
      'La cantidad debe ser un número mayor o igual a 1',
    );
  }

  const nextIdSnap = await getNextIDTransactionalSnap(tx, user, name);
  return applyNextIDTransactional(tx, nextIdSnap, quantity);
}

/**
 * Lee de forma transaccional el snapshot del contador.
 *
 * @param {import('firebase-admin').firestore.Transaction} tx
 * @param {{ businessID: string, uid?: string }} user
 * @param {string} name                - Nombre del contador
 * @returns {Promise<import('firebase-admin').firestore.DocumentSnapshot>}
 * @throws {https.HttpsError}
 */
export async function getNextIDTransactionalSnap(tx, user, name) {
  if (!name) {
    throw new https.HttpsError(
      'invalid-argument',
      'No se proporcionó el nombre del contador',
    );
  }
  if (!user?.businessID) {
    throw new https.HttpsError(
      'invalid-argument',
      'No se proporcionó el usuario o businessID',
    );
  }

  const counterRef = db.doc(`businesses/${user.businessID}/counters/${name}`);
  return tx.get(counterRef);
}

/**
 * Aplica el incremento y retorna el nuevo valor basándose en el snapshot previo.
 *
 * @param {import('firebase-admin').firestore.Transaction} tx
 * @param {import('firebase-admin').firestore.DocumentSnapshot} nextIdSnap
 * @param {number} [quantity=1]         - Cantidad a incrementar
 * @returns {number}                    - Nuevo valor del contador
 * @throws {https.HttpsError}
 */
export function applyNextIDTransactional(tx, nextIdSnap, quantity = 1) {
  if (typeof quantity !== 'number' || quantity < 1) {
    throw new https.HttpsError(
      'invalid-argument',
      'La cantidad debe ser un número mayor o igual a 1',
    );
  }

  const counterRef = nextIdSnap.ref;
  tx.set(
    counterRef,
    { value: FieldValue.increment(quantity) },
    { merge: true },
  );

  const prevValue = nextIdSnap.data()?.value;
  if (typeof prevValue !== 'number') {
    logger.warn(
      `Contador ${counterRef.path} sin valor previo; devolviendo ${quantity}`,
    );
    return quantity;
  }

  return prevValue + quantity;
}

/**
 * Devuelve el siguiente número de secuencia para un negocio dado.
 * Si `tx` se pasa, opera dentro de la transacción; de lo contrario crea una nueva.
 *
 * @param {Object}   opts
 * @param {import('firebase-admin').firestore.Transaction=} opts.tx
 * @param {{ businessID: string }}                           opts.user  – Debe incluir businessID
 * @param {string}   opts.name      – Nombre del contador
 * @param {number}   [opts.qty=1]   – Cuánto incrementar
 * @returns {Promise<number>}       – Valor resultante
 */
export async function nextSeq({ tx = null, user, name, qty = 1 }) {
  if (!user?.businessID || !name) {
    throw new https.HttpsError(
      'invalid-argument',
      'businessID y name requeridos',
    );
  }
  if (!Number.isInteger(qty) || qty < 1) {
    throw new https.HttpsError('invalid-argument', 'qty debe ser entero ≥ 1');
  }

  const ref = db.doc(`businesses/${user.businessID}/counters/${name}`);

  const run = async (t) => {
    const snap = await t.get(ref);
    const prev = snap.exists ? snap.data().value || 0 : 0;
    const next = prev + qty;
    t.set(ref, { value: next }, { merge: true });
    return next;
  };

  return tx ? run(tx) : db.runTransaction(run);
}
