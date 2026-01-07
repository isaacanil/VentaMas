// @ts-nocheck
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
import { updateInvoiceTotals } from '@/firebase/proccessAccountsReceivablePayments/arPaymentUtils';
import { defaultInstallmentPaymentsAR } from '@/schema/accountsReceivable/installmentPaymentsAR';
import { defaultPaymentsAR } from '@/schema/accountsReceivable/paymentAR';

const THRESHOLD = 1e-10;
// Función mejorada para redondear a dos decimales y evitar problemas de precisión
const roundToTwoDecimals = (num) => {
  // Asegurarse de que el número no sea NaN o indefinido
  if (num === undefined || isNaN(num)) return 0;
  // Redondear a 2 decimales y convertir a número
  return parseFloat(parseFloat(num).toFixed(2));
};

/**
 * Procesa pagos múltiples para cuentas por cobrar de aseguradoras.
 * @param {Object} user - Usuario que realiza el pago
 * @param {Object} data - Datos del pago múltiple
 * @param {Function} callback - Función de callback para manejar el recibo generado
 * @returns {Promise<Object>} - Promesa que resuelve con el recibo de pago
 */
export const fbProcessMultiplePaymentsAR = async (user, data, callback) => {
  try {
    const { accounts, paymentDetails, insuranceId, clientId } = data;
    const { totalPaid, paymentMethods, comments } = paymentDetails;

    if (!user?.businessID) {
      throw new Error('ID de negocio del usuario no disponible');
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuentas seleccionadas para el pago');
    }

    if (
      !totalPaid ||
      isNaN(parseFloat(totalPaid)) ||
      parseFloat(totalPaid) <= 0
    ) {
      throw new Error('El monto total pagado debe ser mayor a cero');
    }

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
    const paymentData = {
      ...defaultPaymentsAR,
      id: paymentId,
      paymentMethods: paymentMethods.filter((pm) => pm.status),
      totalPaid: parseFloat(totalPaid),
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
    let _clientData = null;

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
          const _clientData = account.accountData.client;
          // No hacemos break porque queremos usar el clientId de la última cuenta procesada
        }
      }
    }

    // 2. Preparar información para el recibo con el ID de cliente correcto
    const paymentReceipt = {
      receiptId: nanoid(),
      paymentId,
      clientId: extractedClientId, // Usar el ID extraído en lugar del original
      insuranceId,
      businessId: user.businessID,
      createdAt: Timestamp.now(),
      createdBy: user.uid,
      accounts: [],
      totalAmount: parseFloat(totalPaid),
      paymentMethod: paymentMethods.filter((pm) => pm.status),
      change: 0, // Inicialmente no hay cambio
    };

    // 3. Primero, recopilar todos los datos necesarios (accounts, installments, invoices)
    const accountsData = [];
    let remainingAmount = parseFloat(totalPaid);

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

      const accountData = accountSnapshot.data();

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

      const installments = installmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar las cuotas por fecha
      installments.sort((a, b) => {
        // Manejar valores nulos
        if (!a.installmentDate) return 1;
        if (!b.installmentDate) return -1;
        return a.installmentDate.toMillis
          ? a.installmentDate.toMillis() - b.installmentDate.toMillis()
          : a.installmentDate - b.installmentDate;
      });

      // Obtener la factura si existe
      let invoiceData = null;
      if (accountData.invoiceId) {
        const invoice = await fbGetInvoice(
          user.businessID,
          accountData.invoiceId,
        );
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
          ? doc(
              db,
              'businesses',
              user.businessID,
              'invoices',
              accountData.invoiceId,
            )
          : null,
      });
    }

    // 4. Procesar pagos y preparar actualizaciones - AHORA REALIZAMOS LAS ESCRITURAS
    remainingAmount = parseFloat(totalPaid); // Reiniciar el monto restante

    for (const {
      accountData,
      accountRef,
      installments,
      invoiceData,
      invoiceRef,
    } of accountsData) {
      if (remainingAmount <= THRESHOLD) break;

      // Procesar cada cuota
      let accountTotalPaid = 0;
      const paidInstallments = [];
      const _installmentUpdates = [];
      const _installmentPayments = [];

      for (const installment of installments) {
        if (remainingAmount <= THRESHOLD) break;

        // Aplicar el pago a esta cuota
        const amountToApply = Math.min(
          remainingAmount,
          parseFloat(installment.installmentBalance || 0),
        );
        const newInstallmentBalance = roundToTwoDecimals(
          parseFloat(installment.installmentBalance || 0) - amountToApply,
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
          arId: accountData.id,
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
          parseFloat(accountData.arBalance || 0) - accountTotalPaid,
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

        // Agregar al recibo
        paymentReceipt.accounts.push({
          arNumber: accountData.numberId,
          arId: accountData.id,
          invoiceNumber: invoiceNumber ? String(invoiceNumber) : 'N/A',
          invoiceId: accountData.invoiceId,
          paidInstallments,
          remainingInstallments:
            accountData.totalInstallments - updatedPaidInstallments.length,
          totalInstallments: accountData.totalInstallments,
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
    let receiptParams = {
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
