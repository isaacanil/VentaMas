import { https, logger } from "firebase-functions";
import { db, Timestamp } from "../../../core/config/firebase.js";
import { generateInstallments } from "../utils/generateInstallments.js";

export async function addInstallmentReceivable(tx, { user, ar }) {
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError('invalid-argument', 'Usuario no válido o sin businessID');
  }
  if (!ar) {
    throw new https.HttpsError('invalid-argument', 'Datos de cuentas por cobrar requeridos');
  }

  const installments = generateInstallments({ ar, user });
  if (!Array.isArray(installments) || installments.length === 0) {
    logger.info('No hay cuotas para generar', { arId: ar?.id });
    return;
  }

  const basePath = `businesses/${user.businessID}/accountsReceivableInstallments`;

  for (const inst of installments) {
    const instRef = db.doc(`${basePath}/${inst.id}`);
    const instData = {
      ...inst,
      createdAt: Timestamp.fromMillis(inst.createdAt),
      updatedAt: Timestamp.fromMillis(inst.updatedAt),
      installmentDate: Timestamp.fromMillis(inst.installmentDate),
    };
    tx.set(instRef, instData);
    logger.info(`Cuota creada (tx): ${inst.id}`, { arId: ar?.id });
  }
}
