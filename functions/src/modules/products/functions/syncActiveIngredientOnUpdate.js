import { logger } from 'firebase-functions';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';

const resolveIngredientName = (data) => {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.name === 'string' && data.name.trim()) {
    return data.name.trim();
  }
  if (typeof data.ingredientName === 'string' && data.ingredientName.trim()) {
    return data.ingredientName.trim();
  }
  return '';
};

export const syncActiveIngredientOnUpdate = onDocumentUpdated(
  {
    document: 'businesses/{bid}/activeIngredients/{ingredientId}',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;
    if (!after) return;

    const beforeName = resolveIngredientName(before);
    const afterName = resolveIngredientName(after);
    if (!afterName || beforeName === afterName) return;

    const { bid: businessId } = event.params || {};
    if (!businessId) return;

    const stats = {
      businessId,
      beforeName,
      afterName,
      updated: 0,
    };

    const writer = db.bulkWriter();
    writer.onWriteError((error) => {
      logger.error('[syncActiveIngredientOnUpdate] BulkWriter error', {
        code: error.code,
        path: error.documentRef?.path,
        message: error.message,
      });
      return false;
    });

    const productsRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('products');
    const query = productsRef
      .where('activeIngredients', '==', beforeName)
      .select('activeIngredients');

    for await (const docSnap of query.stream()) {
      const current = docSnap.get('activeIngredients');
      if (current === afterName) continue;
      writer.update(docSnap.ref, { activeIngredients: afterName });
      stats.updated += 1;
    }

    await writer.close();
    logger.info('[syncActiveIngredientOnUpdate] Completed', stats);
  },
);
