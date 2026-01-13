import { logger } from 'firebase-functions';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import { extractNormalizedClient } from '../utils/clientNormalizer.js';

const isEqualValue = (a, b) => {
  if (a === b) return true;
  const aType = typeof a;
  const bType = typeof b;
  if (aType !== bType) return false;
  if (a && b && aType === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
};

const buildNestedUpdate = (prefix, client) => {
  const payload = {};
  for (const [key, value] of Object.entries(client || {})) {
    if (value === undefined) continue;
    payload[`${prefix}.${key}`] = value;
  }
  return payload;
};

const shouldUpdateSnapshot = (docSnap, prefix, client) => {
  for (const [key, value] of Object.entries(client || {})) {
    const current = docSnap.get(`${prefix}.${key}`);
    if (!isEqualValue(current, value)) {
      return true;
    }
  }
  return false;
};

export const syncClientOnUpdate = onDocumentUpdated(
  {
    document: 'businesses/{bid}/clients/{clientId}',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;
    if (!after) return;

    const { bid: businessId, clientId } = event.params || {};
    if (!businessId || !clientId) return;

    const beforeClient = extractNormalizedClient(before);
    const nextClient = extractNormalizedClient(after);
    if (!nextClient?.id) {
      nextClient.id = String(clientId);
    }

    const changed = Object.keys(nextClient || {}).some((key) =>
      !isEqualValue(nextClient[key], beforeClient?.[key]),
    );
    if (!changed) return;

    const stats = {
      businessId,
      clientId,
      updated: 0,
      updatedByCollection: {},
    };

    const writer = db.bulkWriter();
    writer.onWriteError((error) => {
      logger.error('[syncClientOnUpdate] BulkWriter error', {
        code: error.code,
        path: error.documentRef?.path,
        message: error.message,
      });
      return false;
    });

    const updateInvoices = async () => {
      const invoicesRef = db
        .collection('businesses')
        .doc(businessId)
        .collection('invoices');
      const query = invoicesRef
        .where('data.client.id', '==', clientId)
        .select('data.client');

      let updatedCount = 0;
      for await (const docSnap of query.stream()) {
        if (!shouldUpdateSnapshot(docSnap, 'data.client', nextClient)) {
          continue;
        }
        writer.update(docSnap.ref, buildNestedUpdate('data.client', nextClient));
        updatedCount += 1;
        stats.updated += 1;
      }
      if (updatedCount > 0) {
        stats.updatedByCollection.invoices = updatedCount;
      }
    };

    const updateInvoicesV2 = async () => {
      const invoicesV2Ref = db
        .collection('businesses')
        .doc(businessId)
        .collection('invoicesV2');
      const query = invoicesV2Ref
        .where('snapshot.client.id', '==', clientId)
        .select('snapshot.client');

      let updatedCount = 0;
      for await (const docSnap of query.stream()) {
        if (!shouldUpdateSnapshot(docSnap, 'snapshot.client', nextClient)) {
          continue;
        }
        writer.update(
          docSnap.ref,
          buildNestedUpdate('snapshot.client', nextClient),
        );
        updatedCount += 1;
        stats.updated += 1;
      }
      if (updatedCount > 0) {
        stats.updatedByCollection.invoicesV2 = updatedCount;
      }
    };

    const updateReceipts = async () => {
      const receiptsRef = db
        .collection('businesses')
        .doc(businessId)
        .collection('accountsReceivablePaymentReceipt');

      let updatedCount = 0;
      const queryByClientId = receiptsRef
        .where('clientId', '==', clientId)
        .select('client');

      for await (const docSnap of queryByClientId.stream()) {
        if (!shouldUpdateSnapshot(docSnap, 'client', nextClient)) continue;
        writer.update(docSnap.ref, buildNestedUpdate('client', nextClient));
        updatedCount += 1;
        stats.updated += 1;
      }

      const queryByClientObject = receiptsRef
        .where('client.id', '==', clientId)
        .select('client');

      for await (const docSnap of queryByClientObject.stream()) {
        if (!shouldUpdateSnapshot(docSnap, 'client', nextClient)) continue;
        writer.update(docSnap.ref, buildNestedUpdate('client', nextClient));
        updatedCount += 1;
        stats.updated += 1;
      }

      if (updatedCount > 0) {
        stats.updatedByCollection.accountsReceivablePaymentReceipt = updatedCount;
      }
    };

    const updateApprovalLogs = async () => {
      const logsRef = db
        .collection('businesses')
        .doc(businessId)
        .collection('approvalLogs');
      const query = logsRef
        .where('target.details.clientId', '==', clientId)
        .select('target.details');

      const nextName = nextClient?.name || '';
      if (!nextName) return;

      let updatedCount = 0;
      for await (const docSnap of query.stream()) {
        const currentName = docSnap.get('target.details.clientName');
        if (currentName === nextName) continue;
        writer.update(docSnap.ref, {
          'target.details.clientName': nextName,
        });
        updatedCount += 1;
        stats.updated += 1;
      }
      if (updatedCount > 0) {
        stats.updatedByCollection.approvalLogs = updatedCount;
      }
    };

    await Promise.all([
      updateInvoices(),
      updateInvoicesV2(),
      updateReceipts(),
      updateApprovalLogs(),
    ]);

    await writer.close();

    logger.info('[syncClientOnUpdate] Completed', stats);
  },
);
