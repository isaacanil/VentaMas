import { https, logger } from 'firebase-functions';

import { addAccountReceivable } from './addAccountReceivable.js';
import { addInstallmentReceivable } from './addInstallmentsAccountReceivable.js';

export async function manageReceivableAccounts(
  tx,
  { user, accountsReceivable, invoice, accountReceivableNextIDSnap },
) {
  if (!invoice?.isAddedToReceivables) {
    logger.info('Factura no marcada para cuentas por cobrar, omitiendo.');
    return;
  }
  if (accountsReceivable?.totalInstallments) {
    logger.info('Cuentas por cobrar no definidas, omitiendo.');
    return;
  }
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }

  const ar = await addAccountReceivable(tx, {
    user,
    accountsReceivable,
    accountReceivableNextIDSnap,
  });
  await addInstallmentReceivable(tx, { user, ar });
}
