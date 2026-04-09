import { AggregateField } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db, FieldValue } from '../../../../../core/config/firebase.js';

/**
 * Mantiene clients/{clientId}.pendingBalance
 * al crearse, actualizarse o eliminarse un A/R.
 */
export const updatePendingBalance = onDocumentWritten(
  {
    document: 'businesses/{bid}/accountsReceivable/{arId}',
    region: 'us-central1', // cámbialo si usas otra región
    memory: '256MiB',
    runtimeOpts: { nodeVersion: '20' },
  },
  async (event) => {
    const before = event.data?.before?.data() ?? null; // doc antes
    const after = event.data?.after?.data() ?? null; // doc después

    const active = after?.isActive || before?.isActive;
    if (!active) {
      logger.debug('[updatePendingBalance] skip inactive change', {
        arId: event.params.arId,
      });
      return;
    }

    const clientId = (after ?? before)?.clientId;
    if (!clientId) {
      logger.warn('[updatePendingBalance] missing clientId', {
        arId: event.params.arId,
        businessId: event.params.bid,
      });
      return;
    }

    try {
      const q = db
        .collection(`businesses/${event.params.bid}/accountsReceivable`)
        .where('clientId', '==', clientId)
        .where('isActive', '==', true);

      const snap = await q
        .aggregate({
          pending: AggregateField.sum('arBalance'),
        })
        .get();

      const total = snap.data().pending ?? 0;

      const clientRef = db.doc(
        `businesses/${event.params.bid}/clients/${clientId}`,
      ); // ← 1 sola lectura de agregación

      await clientRef.set(
        {
          client: { pendingBalance: total },
          pendingBalance: FieldValue.delete(),
        },
        { merge: true },
      );

      logger.info('[updatePendingBalance] client updated', {
        businessId: event.params.bid,
        clientId,
        total,
        arId: event.params.arId,
      });
    } catch (err) {
      logger.error('[updatePendingBalance] failed to aggregate', {
        businessId: event.params.bid,
        clientId,
        arId: event.params.arId,
        err,
      });
      throw err;
    }
  },
);
