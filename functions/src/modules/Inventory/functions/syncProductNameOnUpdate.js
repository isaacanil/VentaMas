import { logger } from 'firebase-functions';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';

const resolveProductName = (data) => {
  if (!data || typeof data !== 'object') return '';
  const name =
    typeof data.name === 'string' && data.name.trim().length > 0
      ? data.name.trim()
      : '';
  if (name) return name;
  if (typeof data.productName === 'string' && data.productName.trim().length) {
    return data.productName.trim();
  }
  return '';
};

const COLLECTIONS_TO_SYNC = [
  'productsStock',
  'batches',
  'movements',
  'backOrders',
];

export const syncProductNameOnUpdate = onDocumentUpdated(
  {
    document: 'businesses/{bid}/products/{productId}',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;
    if (!after) return;

    const beforeName = resolveProductName(before);
    const afterName = resolveProductName(after);
    if (!afterName) {
      logger.warn('[syncProductNameOnUpdate] Missing product name, skipping', {
        path: event.data?.after?.ref?.path,
      });
      return;
    }
    if (beforeName === afterName) return;

    const { bid: businessId, productId } = event.params || {};
    if (!businessId || !productId) return;

    const stats = {
      businessId,
      productId,
      beforeName,
      afterName,
      scanned: 0,
      updated: 0,
      updatedByCollection: {},
    };

    const writer = db.bulkWriter();
    writer.onWriteError((error) => {
      logger.error('[syncProductNameOnUpdate] BulkWriter error', {
        code: error.code,
        path: error.documentRef?.path,
        message: error.message,
      });
      return false;
    });

    for (const collectionName of COLLECTIONS_TO_SYNC) {
      const colRef = db
        .collection('businesses')
        .doc(businessId)
        .collection(collectionName);
      const query = colRef.where('productId', '==', productId).select(
        'productName',
      );

      let updatedInCollection = 0;
      const stream = query.stream();
      for await (const docSnap of stream) {
        stats.scanned += 1;
        const currentName = docSnap.get('productName');
        if (currentName === afterName) continue;
        writer.update(docSnap.ref, { productName: afterName });
        updatedInCollection += 1;
        stats.updated += 1;
      }

      if (updatedInCollection > 0) {
        stats.updatedByCollection[collectionName] = updatedInCollection;
      }
    }

    await writer.close();

    logger.info('[syncProductNameOnUpdate] Completed', stats);
  },
);
