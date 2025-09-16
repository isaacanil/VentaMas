import { https, logger } from 'firebase-functions';
import { admin } from '../../../../core/config/firebase.js';
import { nanoid } from 'nanoid';
import { validateInvoiceCart } from '../../../modules/invoice/utils/invoiceValidation.js';
import { createPendingInvoice } from '../services/orchestrator.service.js';
import getCashCount from '../../../modules/cashCount/utils/cashCountQueries.js';
import { checkOpenCashCount } from '../../../modules/cashCount/utils/cashCountCheck.js';

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
    const idempotencyKey = req.headers['idempotency-key'] || req.get('Idempotency-Key') || req.body?.idempotencyKey;
    if (!idempotencyKey) {
      return res.status(400).json({ error: 'Idempotency-Key es requerido' });
    }

    // Auth: ID token en Authorization: Bearer <token>
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Autenticación requerida' });
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

    // Validación NCF mínima
    const ncfEnabled = !!(data?.ncf?.enabled || data?.taxReceiptEnabled);
    const ncfType = data?.ncf?.type || data?.ncfType;
    if (ncfEnabled && !ncfType) {
      return res.status(400).json({ error: 'ncfType es requerido cuando NCF está habilitado' });
    }

    // Validar carrito
    const validation = validateInvoiceCart(data?.cart);
    if (!validation?.isValid) {
      return res.status(412).json({ error: `Carrito inválido: ${validation?.message || 'error'}` });
    }

    // Validar datos de cuentas por cobrar cuando el carrito las requiere
    const isAddedToReceivables = !!data?.cart?.isAddedToReceivables;
    if (isAddedToReceivables) {
      const arData = data?.accountsReceivable || null;
      const totalInstallments = Number(arData?.totalInstallments);
      if (!arData || !Number.isFinite(totalInstallments) || totalInstallments <= 0) {
        return res.status(400).json({ error: 'accountsReceivable.totalInstallments es requerido cuando isAddedToReceivables=true' });
      }
    }
    // Validar cuadre abierto (early validation)
    try {
      const user = { businessID: businessId, uid: userId };
      const ccSnap = await getCashCount.getOpenCashCountDoc(user);
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

