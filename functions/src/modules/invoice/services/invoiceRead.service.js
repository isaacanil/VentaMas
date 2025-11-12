import { logger } from 'firebase-functions';

import getCashCount from '../../cashCount/utils/cashCountQueries.js';
import getClient from '../../client/services/getClient.service.js';
import getTaxReceipt from '../../taxReceipt/services/getTaxReceipt.js';

export async function collectInvoicePrereqs(
  tx,
  { user, taxReceiptEnabled = false, ncfType = null, client },
) {
  logger.info('Collecting invoice prerequisites', { user: user.uid });

  const cashCountSnap = await getCashCount.getOpenCashCountDocFromTx(tx, user);

  let taxReceiptSnap = null;
  if (taxReceiptEnabled) {
    taxReceiptSnap = await getTaxReceipt.getTaxReceiptDocFromTx(
      tx,
      user,
      ncfType,
    );
  }

  const clientSnap = await getClient.getClientDocFromTx(tx, user, client.id);
  return { cashCountSnap, taxReceiptSnap, clientSnap };
}
