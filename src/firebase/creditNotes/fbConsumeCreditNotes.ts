import { doc, Timestamp, runTransaction } from 'firebase/firestore';

import { CREDIT_NOTE_STATUS } from '@/constants/creditNoteStatus';
import { db } from '@/firebase/firebaseconfig';
import type {
  CreditNoteApplicationInput,
  CreditNoteInvoiceInput,
  CreditNotePayment,
  CreditNoteRecord,
} from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

import { fbAddCreditNoteApplication } from './fbAddCreditNoteApplication';

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getAvailableAmount = (creditNote: CreditNoteRecord): number => {
  const available = toNumber(creditNote.availableAmount);
  const total = toNumber(creditNote.totalAmount);
  return available ?? total ?? 0;
};

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
  user: UserIdentity | null | undefined,
  creditNotePayments: CreditNotePayment[],
  invoiceId: string,
  invoiceData: CreditNoteInvoiceInput = {},
): Promise<void> => {
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
          doc<CreditNoteRecord>(
            db,
            'businesses',
            user.businessID,
            'creditNotes',
            payment.id,
          ),
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
          const currentAvailable = getAvailableAmount(creditNoteData);
          const amountToConsume = toNumber(
            creditNotePayments[index].amountUsed,
          );
          const creditNoteLabel =
            creditNoteData.ncf ??
            creditNoteData.number ??
            creditNotePayments[index].id;

          if (amountToConsume === null) {
            throw new Error(
              `Monto inválido en nota de crédito ${creditNoteLabel}`,
            );
          }

          if (currentAvailable < amountToConsume) {
            throw new Error(
              `Saldo insuficiente en nota de crédito ${creditNoteLabel}`,
            );
          }
        });

        // Actualizar cada nota de crédito y crear registros de aplicación
        const applicationPromises: CreditNoteApplicationInput[] = [];

        creditNoteSnapshots.forEach((snapshot, index) => {
          const creditNoteData = snapshot.data();
          const payment = creditNotePayments[index];
          const currentAvailable = getAvailableAmount(creditNoteData);
          const amountToConsume = toNumber(payment.amountUsed);
          const creditNoteLabel =
            creditNoteData.ncf ?? creditNoteData.number ?? payment.id;

          if (amountToConsume === null) {
            throw new Error(
              `Monto inválido en nota de crédito ${creditNoteLabel}`,
            );
          }
          const newAvailable = currentAvailable - amountToConsume;

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
            amountApplied: amountToConsume,
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
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error al consumir notas de crédito: ${message}`);
  }
};
