import { logger } from 'firebase-functions';

import { getOpenCashCountDocFromTx } from '../../cashCount/utils/cashCountQueries.js';
import { getClientDocFromTx } from '../../client/services/getClient.service.js';
import { getTaxReceiptDocFromTx } from '../../taxReceipt/services/getTaxReceipt.js';

export async function collectInvoicePrereqs(
  tx,
  { user, taxReceiptEnabled = false, ncfType = null, client },
) {
  logger.info('Collecting invoice prerequisites', { user: user.uid });

  const cashCountSnap = await getOpenCashCountDocFromTx(tx, user);

  let taxReceiptSnap = null;
  if (taxReceiptEnabled) {
    taxReceiptSnap = await getTaxReceiptDocFromTx(tx, user, ncfType);
  }

  const clientSnap = await getClientDocFromTx(tx, user, client.id);
  return { cashCountSnap, taxReceiptSnap, clientSnap };
}
