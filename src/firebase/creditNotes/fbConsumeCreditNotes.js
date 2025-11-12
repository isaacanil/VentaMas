import { doc, Timestamp, runTransaction } from 'firebase/firestore';

import { CREDIT_NOTE_STATUS } from '../../constants/creditNoteStatus';
import { db } from '../firebaseconfig';

import { fbAddCreditNoteApplication } from './fbAddCreditNoteApplication';

/**
 * Consume el saldo disponible de notas de crédito cuando se aplican a una factura
 * @param {Object} user - Usuario con businessID
 * @param {Array} creditNotePayments - Array de notas de crédito aplicadas con formato:
 *   [{ id: string, amountUsed: number, ncf: string, originalAmount: number }]
 * @param {string} invoiceId - ID de la factura donde se aplican las notas
 * @param {Object} invoiceData - Datos de la factura (NCF, número, cliente, etc.)
 * @returns {Promise<void>}
 */
export const fbConsumeCreditNotes = async (
  user,
  creditNotePayments,
  invoiceId,
  invoiceData = {},
) => {
  if (!user?.businessID) throw new Error('Usuario sin businessID');
  if (!creditNotePayments?.length) return; // No hay notas de crédito para consumir
  if (!invoiceId) throw new Error('invoiceId requerido');

  try {
    console.log('creditNotePayments', creditNotePayments);
    console.log('invoiceData', invoiceData);
    console.log('invoiceId', invoiceId);
    console.log('user', user);
    // Usar transacción para garantizar consistencia
    const applicationDataList = await runTransaction(
      db,
      async (transaction) => {
        // Leer todas las notas de crédito primero
        const creditNoteRefs = creditNotePayments.map((payment) =>
          doc(db, 'businesses', user.businessID, 'creditNotes', payment.id),
        );

        const creditNoteSnapshots = await Promise.all(
          creditNoteRefs.map((ref) => transaction.get(ref)),
        );

        // Validar que todas las notas existen y tienen saldo suficiente
        creditNoteSnapshots.forEach((snapshot, index) => {
          if (!snapshot.exists()) {
            throw new Error(
              `Nota de crédito ${creditNotePayments[index].id} no encontrada`,
            );
          }

          const creditNoteData = snapshot.data();
          const currentAvailable =
            creditNoteData.availableAmount ?? creditNoteData.totalAmount;
          const amountToConsume = creditNotePayments[index].amountUsed;

          if (currentAvailable < amountToConsume) {
            throw new Error(
              `Saldo insuficiente en nota de crédito ${creditNoteData.ncf || creditNoteData.number}`,
            );
          }
        });

        // Actualizar cada nota de crédito y crear registros de aplicación
        const applicationPromises = [];

        creditNoteSnapshots.forEach((snapshot, index) => {
          const creditNoteData = snapshot.data();
          const payment = creditNotePayments[index];
          const currentAvailable =
            creditNoteData.availableAmount ?? creditNoteData.totalAmount;
          const newAvailable = currentAvailable - payment.amountUsed;

          const updates = {
            availableAmount: newAvailable,
            updatedAt: Timestamp.now(),
            // Actualizar estado según el saldo restante
            status:
              newAvailable === 0
                ? CREDIT_NOTE_STATUS.FULLY_USED
                : CREDIT_NOTE_STATUS.APPLIED,
          };

          transaction.update(creditNoteRefs[index], updates);

          // Preparar datos para el registro de aplicación
          const applicationData = {
            creditNoteId: payment.id,
            creditNoteNcf: payment.ncf || creditNoteData.ncf,
            invoiceId,
            invoiceNcf: invoiceData.NCF,
            invoiceNumber: invoiceData.numberID,
            clientId: invoiceData.client?.id || creditNoteData.client?.id,
            amountApplied: payment.amountUsed,
            previousBalance: currentAvailable,
            newBalance: newAvailable,
          };

          applicationPromises.push(applicationData);
        });

        // Después de la transacción, crear los registros de aplicación
        return applicationPromises;
      },
    );

    // Crear los registros de aplicación después de la transacción exitosa
    const applicationPromises = applicationDataList.map((appData) =>
      fbAddCreditNoteApplication(user, appData),
    );

    await Promise.all(applicationPromises);

    console.log(
      `✅ Consumidas ${creditNotePayments.length} notas de crédito para factura ${invoiceId}`,
    );
    console.log(
      `✅ Creados ${applicationPromises.length} registros de aplicación`,
    );
  } catch (error) {
    console.error('❌ Error consumiendo notas de crédito:', error);
    throw new Error(`Error al consumir notas de crédito: ${error.message}`);
  }
};
