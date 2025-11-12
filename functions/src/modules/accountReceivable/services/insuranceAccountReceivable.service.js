import { getTime } from 'date-fns';
import { https, logger } from 'firebase-functions';

import { addAccountReceivable } from './addAccountReceivable.js';
import { addInstallmentReceivable } from './addInstallmentsAccountReceivable.js';
import { addInsuranceAuth } from './insuranceAuth.js';

export async function manageInsuranceReceivableAccounts(
  tx,
  {
    user,
    client,
    invoice,
    insuranceAR = {},
    insurance = {},
    insuranceAuth,
    insuranceEnabled = false,
  },
) {
  if (!insuranceEnabled) {
    logger.info('Insurance AR not enabled, skipping.', { uid: user.uid });
    return;
  }
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }
  if (!invoice?.id) {
    throw new https.HttpsError(
      'invalid-argument',
      'Invoice inválido o faltante',
    );
  }
  if (!client?.id) {
    throw new https.HttpsError('invalid-argument', 'ID de cliente faltante');
  }
  if (!insuranceAuth?.insuranceId) {
    throw new https.HttpsError('invalid-argument', 'ID de seguro faltante');
  }
  if (!insuranceAR?.totalInstallments) {
    throw new https.HttpsError(
      'invalid-argument',
      'Datos de cuotas de seguro faltantes',
    );
  }

  // const { insuranceName } = await getInsurance(tx, { user, insuranceId: insuranceAuth.insuranceId });
  const { insuranceName } = insurance;
  const authDataId = await addInsuranceAuth(tx, {
    user,
    authData: insuranceAuth,
    clientId: client?.id,
  });

  const {
    paymentFrequency = 'monthly',
    totalInstallments = 1,
    installmentAmount = 0,
    totalReceivable = 0,
    currentBalance = totalReceivable,
    createdAt = getTime(new Date()),
    updatedAt = createdAt,
    paymentDate = null,
    isActive = true,
    isClosed = false,
    comments = '',
    ...extraFields
  } = insuranceAR;

  const normalizedAR = {
    ...extraFields,
    invoiceId: invoice.id,
    clientId: client?.id,
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    totalReceivable,
    currentBalance,
    createdAt,
    updatedAt,
    paymentDate,
    isActive,
    isClosed,
    type: 'insurance',
    insurance: {
      authId: authDataId,
      name: insuranceName,
      insuranceId: insuranceAuth.insuranceId,
      authNumber: insuranceAuth.authNumber,
    },
    comments,
  };

  const ar = await addAccountReceivable(tx, { user, ar: normalizedAR });
  logger.info(`Insurance AR created (tx): ${ar.id}`, { uid: user.uid });

  await addInstallmentReceivable(tx, { user, ar });
  logger.info(`Insurance AR installments created (tx) for AR: ${ar.id}`, {
    uid: user.uid,
  });

  return ar;
}
