import { https, logger } from 'firebase-functions';
import { admin } from '../../../../core/config/firebase.js';
import { nanoid } from 'nanoid';
import { resolveIdempotencyKey } from '../utils/idempotency.util.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../../../../modules/invoice/utils/invoiceValidation.js'),
      import('../services/orchestrator.service.js'),
      import('../../../../modules/cashCount/utils/cashCountQueries.js'),
      import('../../../../modules/cashCount/utils/cashCountCheck.js'),
    ]).then(([validation, orchestrator, cashCountQueries, cashCountCheck]) => {
      const cashCountHelpers = cashCountQueries?.default ?? cashCountQueries;
      return {
        validateInvoiceCart: validation.validateInvoiceCart,
        createPendingInvoice: orchestrator.createPendingInvoice,
        getOpenCashCountDoc: cashCountHelpers?.getOpenCashCountDoc,
        checkOpenCashCount: cashCountCheck.checkOpenCashCount,
      };
    });
  }
  return depsPromise;
}

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
}

export const createInvoiceV2Http = https.onRequest(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const traceId = req.headers['x-cloud-trace-context']?.toString()?.split('/')?.[0] ?? nanoid();
  try {
    const { validateInvoiceCart, createPendingInvoice, getOpenCashCountDoc, checkOpenCashCount } = await loadDeps();
    const idempotencyKey = resolveIdempotencyKey({ rawRequest: req, data: req.body });
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key es requerido' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Autenticacion requerida' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    const authUid = decoded?.uid;

    const data = req.body || {};
    const businessId = data?.businessId || data?.user?.businessID;
    const userId = data?.userId || data?.user?.uid || authUid;
    if (!businessId || !userId) {
      return res.status(400).json({ error: 'businessId y userId son requeridos' });
    }
    if (userId !== authUid) {
      return res.status(403).json({ error: 'userId no coincide con el usuario autenticado' });
    }

    const ncfEnabled = !!(data?.ncf?.enabled || data?.taxReceiptEnabled);
    const ncfType = data?.ncf?.type || data?.ncfType;
    if (ncfEnabled && !ncfType) {
      return res.status(400).json({ error: 'ncfType es requerido cuando NCF esta habilitado' });
    }

    const validation = validateInvoiceCart(data?.cart);
    if (!validation?.isValid) {
      return res.status(412).json({ error: 'Carrito invalido: ' + (validation?.message || 'error') });
    }

    const isAddedToReceivables = !!data?.cart?.isAddedToReceivables;
    if (isAddedToReceivables) {
      const arData = data?.accountsReceivable || null;
      const totalInstallments = Number(arData?.totalInstallments);
      if (!arData || !Number.isFinite(totalInstallments) || totalInstallments <= 0) {
        return res.status(400).json({ error: 'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true' });
      }
    }
    try {
      const user = { businessID: businessId, uid: userId };
      const ccSnap = await getOpenCashCountDoc?.(user);
      await checkOpenCashCount({ cashCountSnap: ccSnap, user });
    } catch (e) {
      return res.status(412).json({ error: 'No hay cuadre de caja abierto' });
    }

    const result = await createPendingInvoice({
      businessId,
      userId,
      payload: data,
      idempotencyKey,
    });

    logger.info('createInvoiceV2Http completed', { traceId, invoiceId: result.invoiceId, reused: result.alreadyExists });
    return res.status(200).json({
      status: 'pending',
      invoiceId: result.invoiceId,
      reused: result.alreadyExists,
    });
  } catch (err) {
    logger.error('Unhandled error in createInvoiceV2Http', { traceId, err });
    return res.status(500).json({ error: 'Error interno al iniciar la factura', traceId, message: err?.message || String(err) });
  }
});
