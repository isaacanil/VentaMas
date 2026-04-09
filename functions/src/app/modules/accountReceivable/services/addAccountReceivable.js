import { https } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { applyNextIDTransactional } from '../../../core/utils/getNextID.js';
import { buildClientPendingBalanceUpdate } from '../utils/clientPendingBalance.util.js';
import { buildReceivableMonetarySnapshotFromSource } from '../utils/receivableMonetary.util.js';
import { buildAccountsReceivablePaymentState } from '../utils/receivablePaymentPlan.util.js';

/**
 * Adds an Accounts Receivable record under a business.
 * @param {Object} user - Contains uid and businessID
 * @param {Object} ar - Data for AR: totalReceivable, createdAt, updatedAt, paymentDate in ms
 * @returns {Promise<Object>} The created AR record.
 */
export async function addAccountReceivable(
  tx,
  { user, ar, accountReceivableNextIDSnap },
) {
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }
  if (!ar) {
    throw new https.HttpsError(
      'invalid-argument',
      'Datos de cuentas por cobrar requeridos',
    );
  }
  const normalizeMillis = (value, { fallback = null } = {}) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (value instanceof Date) {
      const ms = value.getTime();
      return Number.isFinite(ms) ? ms : fallback;
    }
    if (value && typeof value.toMillis === 'function') {
      const ms = value.toMillis();
      return Number.isFinite(ms) ? ms : fallback;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const createdAtMs = normalizeMillis(ar.createdAt, { fallback: Date.now() });
  const updatedAtMs = normalizeMillis(ar.updatedAt, {
    fallback: createdAtMs,
  });
  const paymentDateMs = normalizeMillis(ar.paymentDate);
  const lastPaymentDateMs = normalizeMillis(ar.lastPaymentDate);

  // Generate unique ID and serial number
  const id = nanoid();
  const arRef = db.doc(
    `businesses/${user.businessID}/accountsReceivable/${id}`,
  );
  const clientId =
    typeof ar.clientId === 'string' && ar.clientId.trim()
      ? ar.clientId.trim()
      : null;
  const clientRef = clientId
    ? db.doc(`businesses/${user.businessID}/clients/${clientId}`)
    : null;
  const clientSnap = clientRef ? await tx.get(clientRef) : null;
  const invoiceId =
    typeof ar.invoiceId === 'string' && ar.invoiceId.trim()
      ? ar.invoiceId.trim()
      : null;
  const legacyInvoiceRef = invoiceId
    ? db.doc(`businesses/${user.businessID}/invoices/${invoiceId}`)
    : null;
  const invoiceV2Ref = invoiceId
    ? db.doc(`businesses/${user.businessID}/invoicesV2/${invoiceId}`)
    : null;
  const legacyInvoiceSnap = legacyInvoiceRef ? await tx.get(legacyInvoiceRef) : null;
  const invoiceV2Snap = invoiceV2Ref ? await tx.get(invoiceV2Ref) : null;
  const invoiceRef = legacyInvoiceSnap?.exists
    ? legacyInvoiceRef
    : invoiceV2Snap?.exists
      ? invoiceV2Ref
      : legacyInvoiceRef;
  const invoiceSnap = legacyInvoiceSnap?.exists
    ? legacyInvoiceSnap
    : invoiceV2Snap?.exists
      ? invoiceV2Snap
      : null;
  // Apply the counter increment only after all transaction reads are complete.
  const numberId = applyNextIDTransactional(tx, accountReceivableNextIDSnap);
  const invoiceMonetary =
    invoiceSnap?.exists
      ? invoiceSnap.get('data.monetary') ||
        invoiceSnap.get('monetary') ||
        invoiceSnap.get('snapshot.monetary') ||
        null
      : null;
  const receivableMonetary = buildReceivableMonetarySnapshotFromSource({
    sourceMonetary: ar.monetary ?? invoiceMonetary,
    documentTotal: ar.totalReceivable,
  });

  // Construct the AR payload
  const arRecord = {
    ...ar,
    arBalance: ar.totalReceivable,
    numberId,
    id,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: createdAtMs,
    updatedAt: updatedAtMs,
    paymentDate: paymentDateMs,
    lastPaymentDate: lastPaymentDateMs,
    paymentState: buildAccountsReceivablePaymentState({
      account: {
        ...ar,
        totalReceivable: ar.totalReceivable,
        totalInstallments: ar.totalInstallments,
      },
      balance: ar.totalReceivable,
      paymentCount: 0,
      nextPaymentAt: paymentDateMs,
      remainingInstallments: ar.totalInstallments,
    }),
    monetary: receivableMonetary,
  };

  // Convert ms timestamps to Firestore Timestamps
  const paymentState = { ...arRecord.paymentState };
  if (paymentState.lastPaymentAt != null) {
    paymentState.lastPaymentAt = Timestamp.fromMillis(paymentState.lastPaymentAt);
  }
  if (paymentState.nextPaymentAt != null) {
    paymentState.nextPaymentAt = Timestamp.fromMillis(paymentState.nextPaymentAt);
  }
  const arData = {
    ...arRecord,
    createdAt: Timestamp.fromMillis(createdAtMs),
    updatedAt: Timestamp.fromMillis(updatedAtMs),
    paymentDate:
      paymentDateMs != null ? Timestamp.fromMillis(paymentDateMs) : null,
    lastPaymentDate:
      lastPaymentDateMs != null
        ? Timestamp.fromMillis(lastPaymentDateMs)
        : null,
    paymentState,
  };

  // Persist via full path
  await tx.set(arRef, arData);
  if (clientRef) {
    tx.set(
      clientRef,
      buildClientPendingBalanceUpdate({
        currentClientDoc: clientSnap?.exists ? clientSnap.data() : null,
        delta: arRecord.paymentState?.balance ?? arRecord.arBalance,
      }),
      { merge: true },
    );
  }
  if (
    invoiceRef &&
    invoiceSnap?.exists &&
    String(arRecord.type || '').trim().toLowerCase() !== 'insurance'
  ) {
    const receivableState = {
      arId: arRecord.id,
      balanceDue: arRecord.paymentState?.balance ?? arRecord.arBalance ?? 0,
      accumulatedPaid: 0,
      paymentStatus: arRecord.paymentState?.status ?? 'unpaid',
      lastPaymentAt: null,
      lastPaymentId: null,
    };
    tx.set(
      invoiceRef,
      {
        receivableState,
        'data.receivableState': receivableState,
      },
      { merge: true },
    );
  }

  return arRecord;
}
