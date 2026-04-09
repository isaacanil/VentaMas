import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { fbAddAccountReceivablePaymentReceipt } from '@/firebase/accountsReceivable/fbAddAccountReceivablePaymentReceipt';
import { db } from '@/firebase/firebaseconfig';
import { fbGetInvoice } from '@/firebase/invoices/fbGetInvoice';
import type { InvoicePaymentMethod } from '@/types/invoice';
import { assertAccountingPeriodOpenForBusiness } from '@/utils/accounting/periodClosures';
import {
  updateInvoiceTotals,
  type AccountsReceivableAccount,
  type AccountsReceivableInstallment,
  type InvoiceLike,
  type PaymentDetails,
  type UserWithBusinessAndUid,
} from '@/firebase/proccessAccountsReceivablePayments/arPaymentUtils';
import { defaultInstallmentPaymentsAR } from '@/schema/accountsReceivable/installmentPaymentsAR';
import { defaultPaymentsAR } from '@/schema/accountsReceivable/paymentAR';

const THRESHOLD = 1e-10;
// Función mejorada para redondear a dos decimales y evitar problemas de precisión
const roundToTwoDecimals = (
  num: number | string | null | undefined,
): number => {
  // Asegurarse de que el número no sea NaN o indefinido
  if (num === undefined || num === null || Number.isNaN(Number(num))) return 0;
  // Redondear a 2 decimales y convertir a número
  return parseFloat(Number(num).toFixed(2));
};

type InsuranceAccountData = AccountsReceivableAccount & {
  client?: { id?: string | null } & Record<string, unknown>;
  insurance?: { name?: string; insuranceId?: string } & Record<string, unknown>;
};

type InsurancePaymentAccount = {
  id: string;
  accountData?: InsuranceAccountData;
};

type InstallmentData = AccountsReceivableInstallment & {
  installmentBalance?: number | string;
  installmentDate?: { toMillis?: () => number } | number | null;
  installmentNumber?: number | string;
};

type MultiplePaymentsData = {
  accounts: InsurancePaymentAccount[];
  paymentDetails: PaymentDetails & { paymentMethods: InvoicePaymentMethod[] };
  insuranceId?: string | null;
  clientId?: string | null;
};

type AccountsDataEntry = {
  accountData: InsuranceAccountData;
  accountRef: ReturnType<typeof doc>;
  installments: InstallmentData[];
  invoiceData: InvoiceLike | null;
  invoiceRef: ReturnType<typeof doc> | null;
};

type InsurancePaymentReceiptAccount = {
  arNumber?: string | number;
  arId?: string;
  invoiceNumber: string;
  invoiceId?: string | null;
  paidInstallments: Array<{
    number?: number | string;
    id: string;
    amount: number;
    status: string;
    remainingBalance: number;
  }>;
  remainingInstallments: number;
  totalInstallments: number;
  totalPaid: number;
  arBalance: number;
  insuranceName?: string;
  insuranceId?: string;
};

type InsurancePaymentReceipt = {
  receiptId: string;
  paymentId: string;
  clientId?: string | null;
  insuranceId?: string | null;
  businessId: string;
  createdAt: ReturnType<typeof Timestamp.now>;
  createdBy: string;
  accounts: InsurancePaymentReceiptAccount[];
  totalAmount: number;
  paymentMethod: InvoicePaymentMethod[];
  change: number;
};

/**
 * Procesa pagos múltiples para cuentas por cobrar de aseguradoras.
 * @param {Object} user - Usuario que realiza el pago
 * @param {Object} data - Datos del pago múltiple
 * @param {Function} callback - Función de callback para manejar el recibo generado
 * @returns {Promise<Object>} - Promesa que resuelve con el recibo de pago
 */
export const fbProcessMultiplePaymentsAR = async (
  user: UserWithBusinessAndUid,
  data: MultiplePaymentsData,
  callback?: (
    receipt: Awaited<ReturnType<typeof fbAddAccountReceivablePaymentReceipt>>,
  ) => void,
): Promise<
  Awaited<ReturnType<typeof fbAddAccountReceivablePaymentReceipt>>
> => {
  try {
    const { accounts, paymentDetails, insuranceId, clientId } = data;
    const { totalPaid, paymentMethods, comments } = paymentDetails;
    const totalPaidNumber = Number(totalPaid);

    if (!user?.businessID) {
      throw new Error('ID de negocio del usuario no disponible');
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuentas seleccionadas para el pago');
    }

    if (
      !totalPaidNumber ||
      Number.isNaN(totalPaidNumber) ||
      totalPaidNumber <= 0
    ) {
      throw new Error('El monto total pagado debe ser mayor a cero');
    }

    await assertAccountingPeriodOpenForBusiness({
      businessId: user.businessID,
      effectiveDate: data?.date ?? Date.now(),
      operationLabel: 'registrar este cobro',
    });

    // Crear un ID único para el pago
    const paymentId = nanoid();

    // Usaremos un batch en lugar de una transacción para evitar el error
    const batch = writeBatch(db);

    // 1. Crear el registro de pago principal
    const paymentsRef = doc(
      db,
      'businesses',
      user.businessID,
      'accountsReceivablePayments',
      paymentId,
    );
    const activePaymentMethods = paymentMethods.filter((pm) => pm.status);
    const paymentData = {
      ...defaultPaymentsAR,
      id: paymentId,
      paymentMethods: activePaymentMethods,
      totalPaid: totalPaidNumber,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      comments,
      createdUserId: user?.uid,
      updatedUserId: user?.uid,
      isActive: true,
      isInsurancePayment: true,
      insuranceId,
      clientId,
    };
    batch.set(paymentsRef, paymentData);

    // Inicializar el clientId con el valor por defecto
    let extractedClientId = clientId;

    // Solo buscar en la ubicación específica: account.accountData.client.id
    if (accounts && accounts.length > 0) {
      for (const account of accounts) {
        // Buscar directamente en la ubicación específica
        if (
          account.accountData &&
          account.accountData.client &&
          account.accountData.client.id
        ) {
          const accountClientId = account.accountData.client.id;

          // Usar el cliente de cada cuenta individual
          extractedClientId = accountClientId;
          // No hacemos break porque queremos usar el clientId de la última cuenta procesada
        }
      }
    }

    // 2. Preparar información para el recibo con el ID de cliente correcto
    const paymentReceipt: InsurancePaymentReceipt = {
      receiptId: nanoid(),
      paymentId,
      clientId: extractedClientId, // Usar el ID extraído en lugar del original
      insuranceId,
      businessId: user.businessID,
      createdAt: Timestamp.now(),
      createdBy: user.uid,
      accounts: [],
      totalAmount: totalPaidNumber,
      paymentMethod: activePaymentMethods,
      change: 0, // Inicialmente no hay cambio
    };

    // 3. Primero, recopilar todos los datos necesarios (accounts, installments, invoices)
    const accountsData: AccountsDataEntry[] = [];
    let remainingAmount = totalPaidNumber;

    // Recopilación de datos - SOLO LECTURAS
    for (const account of accounts) {
      if (remainingAmount <= THRESHOLD) break;

      // Obtener los datos completos de la cuenta
      const accountRef = doc(
        db,
        'businesses',
        user.businessID,
        'accountsReceivable',
        account.id,
      );
      const accountSnapshot = await getDoc(accountRef);

      if (!accountSnapshot.exists()) {
        console.warn(`La cuenta ${account.id} no existe, omitiendo...`);
        continue;
      }

      const accountData = accountSnapshot.data() as InsuranceAccountData;

      // Obtener las cuotas activas para esta cuenta
      const installmentsRef = collection(
        db,
        'businesses',
        user.businessID,
        'accountsReceivableInstallments',
      );
      const installmentsQuery = query(
        installmentsRef,
        where('arId', '==', account.id),
        where('isActive', '==', true),
      );
      const installmentsSnapshot = await getDocs(installmentsQuery);

      if (installmentsSnapshot.empty) {
        console.warn(
          `La cuenta ${account.id} no tiene cuotas activas, omitiendo...`,
        );
        continue;
      }

      const installments = installmentsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...(doc.data() as InstallmentData),
          }) as InstallmentData,
      );

      // Ordenar las cuotas por fecha
      const toInstallmentMillis = (
        value: InstallmentData['installmentDate'],
      ): number => {
        if (!value) return Number.POSITIVE_INFINITY;
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && typeof value.toMillis === 'function') {
          return value.toMillis();
        }
        return Number(value);
      };

      installments.sort(
        (a, b) =>
          toInstallmentMillis(a.installmentDate) -
          toInstallmentMillis(b.installmentDate),
      );

      // Obtener la factura si existe
      let invoiceData: InvoiceLike | null = null;
      const invoiceId = accountData.invoiceId ?? '';
      if (invoiceId) {
        const invoice = await fbGetInvoice(user.businessID, invoiceId);
        if (invoice) {
          invoiceData = invoice; // Los datos de la factura se devuelven directamente
        }
      }

      // Guardar todos los datos recopilados
      accountsData.push({
        accountData,
        accountRef,
        installments,
        invoiceData,
        invoiceRef: invoiceData
          ? doc(db, 'businesses', user.businessID, 'invoices', invoiceId)
          : null,
      });
    }

    // 4. Procesar pagos y preparar actualizaciones - AHORA REALIZAMOS LAS ESCRITURAS
    remainingAmount = totalPaidNumber; // Reiniciar el monto restante

    for (const {
      accountData,
      accountRef,
      installments,
      invoiceData,
      invoiceRef,
    } of accountsData) {
      if (remainingAmount <= THRESHOLD) break;

      const accountId = accountData.id ?? accountRef.id;

      // Procesar cada cuota
      let accountTotalPaid = 0;
      const paidInstallments: Array<{
        number?: number | string;
        id: string;
        amount: number;
        status: string;
        remainingBalance: number;
      }> = [];

      for (const installment of installments) {
        if (remainingAmount <= THRESHOLD) break;

        // Aplicar el pago a esta cuota
        const amountToApply = Math.min(
          remainingAmount,
          Number(installment.installmentBalance || 0),
        );
        const newInstallmentBalance = roundToTwoDecimals(
          Number(installment.installmentBalance || 0) - amountToApply,
        );

        // Preparar actualización de cuota
        const installmentRef = doc(
          db,
          'businesses',
          user.businessID,
          'accountsReceivableInstallments',
          installment.id,
        );
        batch.update(installmentRef, {
          installmentBalance: newInstallmentBalance,
          isActive: newInstallmentBalance > THRESHOLD,
        });

        // Preparar registro de pago de cuota
        const installmentPaymentRef = doc(
          collection(
            db,
            'businesses',
            user.businessID,
            'accountsReceivableInstallmentPayments',
          ),
        );
        batch.set(installmentPaymentRef, {
          ...defaultInstallmentPaymentsAR,
          id: nanoid(),
          installmentId: installment.id,
          paymentId: paymentId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          paymentAmount: roundToTwoDecimals(amountToApply),
          createdBy: user.uid,
          updatedBy: user.uid,
          isActive: true,
          clientId,
          arId: accountId,
          insuranceId,
        });

        // Registrar para el recibo
        paidInstallments.push({
          number: installment.installmentNumber,
          id: installment.id,
          amount: roundToTwoDecimals(amountToApply),
          status: newInstallmentBalance <= THRESHOLD ? 'paid' : 'partial',
          remainingBalance: newInstallmentBalance,
        });

        remainingAmount = roundToTwoDecimals(remainingAmount - amountToApply);
        accountTotalPaid = roundToTwoDecimals(accountTotalPaid + amountToApply);
      }

      // Si se aplicó algún pago, actualizar la cuenta
      if (accountTotalPaid > 0) {
        // Actualizar el balance de la cuenta
        const newArBalance = roundToTwoDecimals(
          Number(accountData.arBalance || 0) - accountTotalPaid,
        );
        const updatedPaidInstallments = [
          ...(accountData.paidInstallments || []),
          ...paidInstallments
            .filter((p) => p.status === 'paid')
            .map((p) => p.id),
        ];

        batch.update(accountRef, {
          arBalance: newArBalance,
          lastPaymentDate: Timestamp.now(),
          lastPayment: accountTotalPaid,
          isActive: newArBalance > THRESHOLD,
          isClosed: newArBalance <= THRESHOLD,
          paidInstallments: updatedPaidInstallments,
        });

        // Actualizar la factura si existe
        if (invoiceRef && invoiceData) {
          updateInvoiceTotals(batch, {
            businessId: user.businessID,
            invoiceId: accountData.invoiceId,
            amountPaid: accountTotalPaid,
            invoice: invoiceData,
            paymentMethods,
          });
        }

        const invoiceNumber =
          invoiceData?.data?.numberID ||
          invoiceData?.numberID ||
          accountData?.invoiceNumber ||
          null;
        const totalInstallments = Number(accountData.totalInstallments ?? 0);

        // Agregar al recibo
        paymentReceipt.accounts.push({
          arNumber: accountData.numberId,
          arId: accountId,
          invoiceNumber: invoiceNumber ? String(invoiceNumber) : 'N/A',
          invoiceId: accountData.invoiceId,
          paidInstallments,
          remainingInstallments:
            totalInstallments - updatedPaidInstallments.length,
          totalInstallments,
          totalPaid: accountTotalPaid,
          arBalance: newArBalance,
          insuranceName: accountData?.insurance?.name,
          insuranceId: accountData?.insurance?.insuranceId,
        });
      }
    }

    // Registrar cualquier cambio/devolución
    paymentReceipt.change = remainingAmount > 0 ? remainingAmount : 0;
    // Guardar el recibo en la colección paymentReceipts (para compatibilidad)
    const receiptRef = doc(
      db,
      'businesses',
      user.businessID,
      'paymentReceipts',
      paymentReceipt.receiptId,
    );
    batch.set(receiptRef, paymentReceipt);

    // Ejecutar el batch con todas las operaciones
    await batch.commit();
    // Verificar que el clientId extraído sea válido antes de usarlo
    // Si no es válido, simplemente no pasamos el clientId para evitar errores
    const receiptParams: {
      user: UserWithBusinessAndUid;
      paymentReceipt: InsurancePaymentReceipt;
      clientId?: string;
    } = {
      user,
      paymentReceipt,
    };

    // Solo incluir el clientId si es una cadena válida
    if (
      extractedClientId &&
      typeof extractedClientId === 'string' &&
      extractedClientId.trim() !== ''
    ) {
      // Cliente válido encontrado para el recibo
      receiptParams.clientId = extractedClientId;
    } else {
      // No se pudo obtener un clientId válido para el recibo
    }

    // Crear el recibo en la colección correcta: accountsReceivablePaymentReceipt
    const fullReceipt =
      await fbAddAccountReceivablePaymentReceipt(receiptParams);

    // Ejecutar callback con el recibo de pago completo
    if (callback) {
      callback(fullReceipt);
    }

    return fullReceipt;
  } catch (error) {
    console.error('Error procesando pagos múltiples:', error);
    throw error;
  }
};
