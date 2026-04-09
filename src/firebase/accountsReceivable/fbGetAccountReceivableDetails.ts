// getAccountReceivableDetails.js
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type {
  AccountsReceivableDetailsModal,
  AccountsReceivableDoc,
  AccountsReceivableInstallment,
  AccountsReceivableInstallmentPayment,
  AccountsReceivablePayment,
  ReceivableClient,
  ReceivableInvoice,
} from '@/utils/accountsReceivable/types';

/**
 * Obtiene los detalles completos de una cuenta por cobrar para visualizar en un modal.
 * @param {string} arId - ID de la cuenta por cobrar.
 * @param {string} businessId - ID del negocio del usuario.
 * @returns {object} - Objeto con todos los detalles necesarios.
 */
export async function getAccountReceivableDetails(
  arId: string,
  businessID?: string | null,
): Promise<AccountsReceivableDetailsModal> {
  try {
    // Verificar si el businessId coincide
    if (!businessID) {
      throw new Error(
        'No tienes permisos para acceder a esta cuenta por cobrar.',
      );
    }
    // 1. Obtener la cuenta por cobrar principal
    const arRef = doc(
      collection(db, 'businesses', businessID, 'accountsReceivable'),
      arId,
    );
    const arSnap = await getDoc(arRef);

    if (!arSnap.exists()) {
      throw new Error('Cuenta por cobrar no encontrada.');
    }

    const arData = arSnap.data() as AccountsReceivableDoc;

    // 2. Obtener información del cliente
    const clientRef = doc(
      collection(db, 'businesses', businessID, 'clients'),
      arData.clientId || '',
    );
    const clientSnap = await getDoc(clientRef);
    const clientData = clientSnap.exists()
      ? (clientSnap.data() as ReceivableClient)
      : null;

    // 3. Obtener información de la factura
    const invoiceRef = doc(
      collection(db, 'businesses', businessID, 'invoices'),
      arData.invoiceId || '',
    );
    const invoiceSnap = await getDoc(invoiceRef);
    const invoiceData = invoiceSnap.exists()
      ? (invoiceSnap.data() as ReceivableInvoice)
      : null;

    // 4. Obtener todas las cuotas asociadas a la cuenta por cobrar
    const installmentsQuery = query(
      collection(
        db,
        'businesses',
        businessID,
        'accountsReceivableInstallments',
      ),
      where('arId', '==', arId),
    );
    const installmentsSnap = await getDocs(installmentsQuery);

    const installments: AccountsReceivableInstallment[] = [];
    const installmentIds: string[] = [];

    installmentsSnap.forEach((docSnap) => {
      const installment = {
        id: docSnap.id,
        ...(docSnap.data() as AccountsReceivableInstallment),
      };
      installments.push(installment);
      installmentIds.push(docSnap.id);
    });

    // 5. Obtener todos los pagos a plazos relacionados con las cuotas
    let installmentPayments: AccountsReceivableInstallmentPayment[] = [];

    if (installmentIds.length > 0) {
      // Firestore no permite usar 'in' con más de 10 elementos, así que se divide en lotes si es necesario
      const batches: string[][] = [];
      const batchSize = 10;
      for (let i = 0; i < installmentIds.length; i += batchSize) {
        const batch = installmentIds.slice(i, i + batchSize);
        batches.push(batch);
      }

      for (const batch of batches) {
        const installmentPaymentsQuery = query(
          collection(
            db,
            'businesses',
            businessID,
            'accountsReceivableInstallmentPayments',
          ),
          where('installmentId', 'in', batch),
        );
        const paymentsSnap = await getDocs(installmentPaymentsQuery);

        paymentsSnap.forEach((docSnap) => {
          installmentPayments.push({
            id: docSnap.id,
            ...(docSnap.data() as AccountsReceivableInstallmentPayment),
          });
        });
      }
    }

    // Obtener todos los paymentIds para obtener los detalles de los pagos
    const paymentIds = installmentPayments
      .map((payment) => payment.paymentId)
      .filter((paymentId): paymentId is string => Boolean(paymentId));
    const uniquePaymentIds = [...new Set(paymentIds)];

    const payments: AccountsReceivablePayment[] = [];

    if (uniquePaymentIds.length > 0) {
      const paymentBatches: string[][] = [];
      const batchSize = 10;
      for (let i = 0; i < uniquePaymentIds.length; i += batchSize) {
        const batch = uniquePaymentIds.slice(i, i + batchSize);
        paymentBatches.push(batch);
      }

      for (const batch of paymentBatches) {
        const paymentsQuery = query(
          collection(
            db,
            'businesses',
            businessID,
            'accountsReceivablePayments',
          ),
          where('__name__', 'in', batch),
        );
        const paymentsSnap = await getDocs(paymentsQuery);

        paymentsSnap.forEach((docSnap) => {
          payments.push({
            id: docSnap.id,
            ...(docSnap.data() as AccountsReceivablePayment),
          });
        });
      }
    }

    // Mapear payments a installmentPayments
    const paymentsMap: Record<string, AccountsReceivablePayment> = {};
    payments.forEach((payment) => {
      if (payment.id) {
        paymentsMap[payment.id] = payment;
      }
    });

    installmentPayments = installmentPayments.map((payment) => ({
      ...payment,
      paymentDetails: payment.paymentId
        ? paymentsMap[payment.paymentId] || null
        : null,
    }));

    // Asignar los pagos a cada cuota
    const installmentsWithPayments = installments.map((installment) => ({
      ...installment,
      payments: installmentPayments.filter(
        (payment) => payment.installmentId === installment.id,
      ),
    }));

    // Estructurar el resultado final
    const result: AccountsReceivableDetailsModal = {
      accountReceivable: {
        id: arId,
        ...arData,
      },
      client: clientData,
      invoice: invoiceData,
      installments: installmentsWithPayments,
    };
    return result;
  } catch (error) {
    console.error(
      'Error al obtener los detalles de la cuenta por cobrar:',
      error,
    );
    throw error;
  }
}
