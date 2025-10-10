import { AggregateField } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../../../core/config/firebase.js';

/**
 * Mantiene clients/{clientId}.pendingBalance
 * al crearse, actualizarse o eliminarse un A/R.
 */
export const updatePendingBalance = onDocumentWritten(
  {
    document: 'businesses/{bid}/accountsReceivable/{arId}',
    region:   'us-central1',      // cámbialo si usas otra región
    memory:   '256MiB',
    runtimeOpts: { nodeVersion: '20' },
  },
  async (event) => {
    const before = event.data?.before?.data() ?? null;  // doc antes
    const after  = event.data?.after?.data()  ?? null;  // doc después

    if (!(after?.isActive || before?.isActive)) return;

    const clientId = (after ?? before).clientId;

    // 1) Query filtrada por cliente + solo docs activos
    const q = db.collection(
      `businesses/${event.params.bid}/accountsReceivable`
    )
    .where('clientId', '==', clientId)
    .where('isActive', '==', true);

    const snap = await q.aggregate({
        pending: AggregateField.sum('arBalance')
      }).get();    

      const total = snap.data().pending ?? 0;

      const clientRef = db.doc(
        `businesses/${event.params.bid}/clients/${clientId}`
      );// ← 1 sola lectura de agregación
  
      await clientRef.set({ pendingBalance: total }, { merge: true });

  }
);
