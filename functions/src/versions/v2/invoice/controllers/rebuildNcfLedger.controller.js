import { logger } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { admin, db } from '../../../../core/config/firebase.js';
import {
  extractInvoiceDataFromSnapshot,
  rebuildLedgerForInvoice,
  wipeLedgerPrefixes,
  canonicalizeInvoice,
} from '../services/ncfLedger.service.js';

import {
  evaluateLedgerAccess,
  normalizePrefixes,
  resolveUserBusinessId,
} from './ncfLedgerAccess.util.js';

const DEFAULT_PAGE_SIZE = 250;
const MAX_PAGE_SIZE = 1000;
const MIN_PAGE_SIZE = 25;

export const rebuildNcfLedger = onCall(async ({ data }, context) => {
  const traceId =
    context.rawRequest?.headers?.['x-cloud-trace-context']?.split('/')?.[0] ??
    null;

  const businessId =
    data?.businessId ||
    data?.business?.id ||
    data?.business?.businessID ||
    data?.user?.businessID ||
    data?.user?.businessId ||
    null;
  const userId = data?.userId || data?.user?.uid || context.auth?.uid || null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId es requerido');
  }

  const userSnap = await db.doc(`users/${userId}`).get();
  const { hasGlobalAccess } = evaluateLedgerAccess(userSnap, {
    errorMessage: 'No tienes permisos para reconstruir el ledger de NCF.',
  });
  const userBusinessId = resolveUserBusinessId(userSnap);

  if (!hasGlobalAccess && userBusinessId && userBusinessId !== businessId) {
    throw new HttpsError(
      'permission-denied',
      'Usuario no pertenece a este negocio',
    );
  }

  const truncate = data?.truncate === true;
  const dryRun = data?.dryRun === true;
  const requestedPrefixes = normalizePrefixes(data?.prefixes);
  const startAfterId =
    typeof data?.startAfterId === 'string' ? data.startAfterId : null;

  logger.info('rebuildNcfLedger request received', {
    traceId,
    businessId,
    userId,
    truncate,
    dryRun,
    prefixes: requestedPrefixes,
    startAfterId,
  });

  let pageSize = Number(data?.pageSize ?? DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(pageSize)) pageSize = DEFAULT_PAGE_SIZE;
  pageSize = Math.max(
    MIN_PAGE_SIZE,
    Math.min(MAX_PAGE_SIZE, Math.floor(pageSize)),
  );
  logger.info('rebuildNcfLedger page size resolved', {
    traceId,
    businessId,
    pageSize,
  });

  if (truncate && !dryRun) {
    const { deleted } = await wipeLedgerPrefixes({
      businessId,
      prefixes: requestedPrefixes,
    });
    logger.info('rebuildNcfLedger wiped prefixes', {
      traceId,
      businessId,
      prefixes: requestedPrefixes,
      deleted,
    });
  }

  const invoicesRef = db
    .collection('businesses')
    .doc(businessId)
    .collection('invoices');
  const docIdField = admin.firestore.FieldPath.documentId();
  let query = invoicesRef.orderBy(docIdField).limit(pageSize);
  if (startAfterId) {
    query = query.startAfter(startAfterId);
  }

  let lastDocId = startAfterId || null;
  let processed = 0;
  let written = 0;
  let skipped = 0;
  let emptyNcf = 0;

  let hasMore = true;

  try {
    while (hasMore) {
      const snap = await query.get();
      if (snap.empty) {
        hasMore = false;
        break;
      }

      const batchSize = snap.size;
      logger.info('rebuildNcfLedger processing batch', {
        traceId,
        businessId,
        batchSize,
        currentQueryStart: lastDocId,
      });

      for (const docSnap of snap.docs) {
        const invoiceId = docSnap.id;
        lastDocId = invoiceId;
        processed += 1;

        const invoiceData = extractInvoiceDataFromSnapshot(docSnap);
        if (!invoiceData?.ncf) {
          emptyNcf += 1;
          continue;
        }

        const canonical = canonicalizeInvoice(invoiceData);
        if (!canonical) {
          skipped += 1;
          continue;
        }

        if (
          requestedPrefixes &&
          !requestedPrefixes.includes(canonical.prefix)
        ) {
          skipped += 1;
          continue;
        }

        if (dryRun) {
          written += 1;
          continue;
        }

        await rebuildLedgerForInvoice({ businessId, invoiceId, invoiceData });
        written += 1;
      }

      const lastDoc = snap.docs[snap.docs.length - 1];
      if (!lastDoc) {
        hasMore = false;
      } else if (snap.size < pageSize) {
        hasMore = false;
      } else {
        query = invoicesRef
          .orderBy(docIdField)
          .startAfter(lastDoc.id)
          .limit(pageSize);
      }

      logger.info('rebuildNcfLedger batch completed', {
        traceId,
        businessId,
        batchSize,
        lastDocId,
        totals: {
          processed,
          written,
          skipped,
          emptyNcf,
        },
      });

      if (!hasMore) {
        break;
      }
    }
  } catch (error) {
    logger.error('Error reconstruyendo ledger NCF', {
      traceId,
      businessId,
      userId,
      error: error?.message,
    });
    throw new HttpsError(
      'internal',
      'Fallo reconstruyendo el ledger',
      error?.message,
    );
  }

  logger.info('rebuildNcfLedger finished', {
    traceId,
    businessId,
    totals: {
      processed,
      written,
      skipped,
      emptyNcf,
    },
    lastDocId,
    pageSize,
    truncateApplied: truncate && !dryRun,
    prefixes: requestedPrefixes,
    dryRun,
  });

  return {
    status: dryRun ? 'dry-run' : 'rebuilt',
    businessId,
    processed,
    written,
    skipped,
    emptyNcf,
    lastDocId,
    pageSize,
    truncateApplied: truncate && !dryRun,
    prefixes: requestedPrefixes || null,
  };
});
