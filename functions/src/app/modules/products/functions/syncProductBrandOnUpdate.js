import { logger } from 'firebase-functions';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';

const resolveBrandName = (data) => {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.name === 'string' && data.name.trim()) {
    return data.name.trim();
  }
  if (typeof data.brandName === 'string' && data.brandName.trim()) {
    return data.brandName.trim();
  }
  return '';
};

export const syncProductBrandOnUpdate = onDocumentUpdated(
  {
    document: 'businesses/{bid}/productBrands/{brandId}',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;
    if (!after) return;

    const beforeName = resolveBrandName(before);
    const afterName = resolveBrandName(after);
    if (!afterName || beforeName === afterName) return;

    const { bid: businessId, brandId } = event.params || {};
    if (!businessId || !brandId) return;

    const stats = {
      businessId,
      brandId,
      beforeName,
      afterName,
      updated: 0,
    };

    const writer = db.bulkWriter();
    writer.onWriteError((error) => {
      logger.error('[syncProductBrandOnUpdate] BulkWriter error', {
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

    const queryById = productsRef
      .where('brandId', '==', brandId)
      .select('brand', 'brandId');

    for await (const docSnap of queryById.stream()) {
      const currentName = docSnap.get('brand');
      const currentId = docSnap.get('brandId');
      if (currentName === afterName && currentId === brandId) continue;
      writer.update(docSnap.ref, {
        brand: afterName,
        brandId,
      });
      stats.updated += 1;
    }

    const queryByName = productsRef
      .where('brand', '==', beforeName)
      .select('brand', 'brandId');

    for await (const docSnap of queryByName.stream()) {
      const currentName = docSnap.get('brand');
      const currentId = docSnap.get('brandId');
      const updates = {};
      if (currentName !== afterName) {
        updates.brand = afterName;
      }
      if (!currentId) {
        updates.brandId = brandId;
      }
      if (Object.keys(updates).length === 0) continue;
      writer.update(docSnap.ref, updates);
      stats.updated += 1;
    }

    await writer.close();
    logger.info('[syncProductBrandOnUpdate] Completed', stats);
  },
);
