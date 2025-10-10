import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import {
  extractInvoiceDataFromChange,
  syncLedgerForChange,
} from '../services/ncfLedger.service.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

export const syncNcfLedger = onDocumentWritten(
  {
    document: 'businesses/{businessId}/invoices/{invoiceId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const businessId = event.params.businessId;
    const invoiceId = event.params.invoiceId;

    const beforeData = extractInvoiceDataFromChange(event.data?.before);
    const afterData = extractInvoiceDataFromChange(event.data?.after);

    try {
      await syncLedgerForChange({ businessId, invoiceId, beforeData, afterData });
    } catch (error) {
      logger.error('Failed to sync NCF ledger', { businessId, invoiceId, error: error?.message });
      throw error;
    }
  }
);
