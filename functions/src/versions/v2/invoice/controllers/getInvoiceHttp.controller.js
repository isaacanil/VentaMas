import { https, logger } from 'firebase-functions';

import { admin, db } from '../../../../core/config/firebase.js';

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export const getInvoiceV2Http = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token)
      return res.status(401).json({ error: 'Autenticación requerida' });
    const decoded = await admin.auth().verifyIdToken(token);
    const authUid = decoded?.uid;

    const businessId = req.query.businessId?.toString();
    const invoiceId = req.query.invoiceId?.toString();
    if (!businessId || !invoiceId)
      return res
        .status(400)
        .json({ error: 'businessId e invoiceId son requeridos' });

    // Verificar que el usuario pertenece al negocio (si está en el doc de usuario)
    const userSnap = await db.doc(`users/${authUid}`).get();
    const userBiz = userSnap.exists ? userSnap.get('businessID') : null;
    if (userBiz && userBiz !== businessId) {
      return res.status(403).json({ error: 'No autorizado para este negocio' });
    }

    const invoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );
    const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);

    const [invSnap, canonSnap] = await Promise.all([
      invoiceRef.get(),
      canonRef.get(),
    ]);
    if (!invSnap.exists)
      return res.status(404).json({ error: 'Factura V2 no encontrada' });

    const inv = invSnap.data();

    // Contar tareas por estado
    const outboxCol = invoiceRef.collection('outbox');
    const [pendingSnap, failedSnap, doneSnap] = await Promise.all([
      outboxCol.where('status', '==', 'pending').get(),
      outboxCol.where('status', '==', 'failed').get(),
      outboxCol.where('status', '==', 'done').get(),
    ]);

    const summary = {
      pending: pendingSnap.size,
      failed: failedSnap.size,
      done: doneSnap.size,
    };

    const canonical = canonSnap.exists ? canonSnap.data() : null;

    return res.status(200).json({
      invoiceId,
      status: inv.status,
      statusTimeline: inv.statusTimeline || [],
      committedAt: inv.committedAt || null,
      snapshot: inv.snapshot || null,
      summary,
      canonical,
    });
  } catch (err) {
    logger.error('getInvoiceV2Http error', { err });
    return res
      .status(500)
      .json({ error: 'Error interno', message: err?.message || String(err) });
  }
});
