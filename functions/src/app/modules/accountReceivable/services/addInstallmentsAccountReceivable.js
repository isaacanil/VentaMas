import { https, logger } from 'firebase-functions';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { generateInstallments } from '../utils/generateInstallments.js';

export async function addInstallmentReceivable(tx, { user, ar }) {
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }
  if (!ar) {
    throw new https.HttpsError(
      'invalid-argument',
      'Datos de cuentas por cobrar requeridos',
    );
  }

  const installments = generateInstallments({ ar, user });
  if (!Array.isArray(installments) || installments.length === 0) {
    logger.info('No hay cuotas para generar', { arId: ar?.id });
    return;
  }

  const basePath = `businesses/${user.businessID}/accountsReceivableInstallments`;
  const normalizeMillis = (value, fallback = Date.now()) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (value instanceof Date) {
      const ms = value.getTime();
      return Number.isFinite(ms) ? ms : fallback;
    }
    if (value?.toMillis instanceof Function) {
      const ms = value.toMillis();
      return Number.isFinite(ms) ? ms : fallback;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  for (const inst of installments) {
    const instRef = db.doc(`${basePath}/${inst.id}`);
    const createdAtMs = normalizeMillis(inst.createdAt);
    const updatedAtMs = normalizeMillis(inst.updatedAt, createdAtMs);
    const installmentDateMs = normalizeMillis(
      inst.installmentDate,
      createdAtMs,
    );
    const instData = {
      ...inst,
      createdAt: Timestamp.fromMillis(createdAtMs),
      updatedAt: Timestamp.fromMillis(updatedAtMs),
      installmentDate: Timestamp.fromMillis(installmentDateMs),
    };
    tx.set(instRef, instData);
    logger.info(`Cuota creada (tx): ${inst.id}`, { arId: ar?.id });
  }
}
