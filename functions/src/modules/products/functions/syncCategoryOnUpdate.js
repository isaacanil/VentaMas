import { logger } from 'firebase-functions';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';

const resolveCategoryName = (data) => {
  if (!data || typeof data !== 'object') return '';
  const category = data.category;
  if (category && typeof category === 'object') {
    const rawName = category.name;
    if (typeof rawName === 'string' && rawName.trim()) {
      return rawName.trim();
    }
  }
  if (typeof data.name === 'string' && data.name.trim()) {
    return data.name.trim();
  }
  if (typeof data.categoryName === 'string' && data.categoryName.trim()) {
    return data.categoryName.trim();
  }
  return '';
};

export const syncCategoryOnUpdate = onDocumentUpdated(
  {
    document: 'businesses/{bid}/categories/{categoryId}',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;
    if (!after) return;

    const beforeName = resolveCategoryName(before);
    const afterName = resolveCategoryName(after);
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
      logger.error('[syncCategoryOnUpdate] BulkWriter error', {
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
      .where('category', '==', beforeName)
      .select('category');

    for await (const docSnap of query.stream()) {
      const current = docSnap.get('category');
      if (current === afterName) continue;
      writer.update(docSnap.ref, { category: afterName });
      stats.updated += 1;
    }

    await writer.close();
    logger.info('[syncCategoryOnUpdate] Completed', stats);
  },
);
