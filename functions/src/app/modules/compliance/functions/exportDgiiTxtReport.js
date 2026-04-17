import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { resolveBusinessFiscalRollout } from '../../taxReceipt/utils/fiscalRollout.util.js';
import {
  mapCreditNoteDocToDgii607Record,
  mapInvoiceDocToDgii607Record,
  resolveMonthlyPeriodRange,
} from '../services/dgii607MonthlyReport.service.js';
import {
  assertValidDgii607Header,
  buildDgii607TxtContent,
  buildDgii607TxtFileName,
  buildDgii607TxtRow,
  shouldExcludeDgii607TxtRecord,
} from '../services/dgii607TxtExport.service.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const exportDgiiTxtReport = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const businessId = toCleanString(request?.data?.businessId) || null;
    const periodKey = toCleanString(request?.data?.periodKey) || null;
    const reportCode = toCleanString(request?.data?.reportCode) || 'DGII_607';

    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!periodKey) {
      throw new HttpsError('invalid-argument', 'periodKey es requerido');
    }
    if (reportCode !== 'DGII_607') {
      throw new HttpsError(
        'unimplemented',
        `Export TXT para ${reportCode} todavía no está disponible.`,
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
    });

    const businessSnap = await db.doc(`businesses/${businessId}`).get();
    if (!businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }

    const businessData = businessSnap.data() || {};
    const fiscalRollout = resolveBusinessFiscalRollout(businessData);
    if (
      !fiscalRollout.reportingEnabled ||
      !fiscalRollout.monthlyComplianceEnabled
    ) {
      throw new HttpsError(
        'failed-precondition',
        'El piloto de compliance mensual no está habilitado para este negocio.',
      );
    }

    const businessRnc = toCleanString(businessData.rnc) || null;

    const {
      start,
      endExclusive,
      periodKey: normalizedPeriodKey,
    } = resolveMonthlyPeriodRange(periodKey);

    const invoicesRef = db.collection(`businesses/${businessId}/invoices`);
    const creditNotesRef = db.collection(`businesses/${businessId}/creditNotes`);

    const [invoicesSnap, creditNotesSnap] = await Promise.all([
      invoicesRef
        .where('data.date', '>=', start)
        .where('data.date', '<', endExclusive)
        .orderBy('data.date', 'asc')
        .get(),
      creditNotesRef
        .where('createdAt', '>=', start)
        .where('createdAt', '<', endExclusive)
        .orderBy('createdAt', 'asc')
        .get(),
    ]);

    const rowEntries = [
      ...invoicesSnap.docs.map((doc) => {
        const firestoreDoc = doc.data() || {};
        const record = mapInvoiceDocToDgii607Record({
          businessId,
          invoiceId: doc.id,
          invoiceDoc: firestoreDoc,
        });

        return {
          isCredit: false,
          firestoreDoc,
          record,
          sortKey: record?.issuedAt ?? record?.createdAt ?? '',
          originalNcf: null,
        };
      }),
      ...creditNotesSnap.docs.map((doc) => {
        const firestoreDoc = doc.data() || {};
        const record = mapCreditNoteDocToDgii607Record({
          businessId,
          creditNoteId: doc.id,
          creditNoteDoc: firestoreDoc,
        });

        return {
          isCredit: true,
          firestoreDoc,
          record,
          sortKey: record?.issuedAt ?? record?.createdAt ?? '',
          originalNcf: record?.metadata?.invoiceNcf ?? '',
        };
      }),
    ]
      .filter(
        ({ record, isCredit }) =>
          !shouldExcludeDgii607TxtRecord({ record, isCredit }),
      )
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    let rows;
    try {
      rows = rowEntries.map(({ record, firestoreDoc, isCredit, originalNcf }) =>
        buildDgii607TxtRow({
          record,
          firestoreDoc,
          isCredit,
          originalNcf,
        }),
      );
      assertValidDgii607Header({
        businessRnc,
        periodKey: normalizedPeriodKey,
        rowCount: rows.length,
      });
    } catch (error) {
      throw new HttpsError(
        'failed-precondition',
        error instanceof Error
          ? error.message
          : 'No se pudo construir el TXT 607 con los datos actuales.',
      );
    }

    const content = buildDgii607TxtContent({
      businessRnc,
      periodKey: normalizedPeriodKey,
      rows,
    });
    const fileName = buildDgii607TxtFileName({
      businessRnc,
      periodKey: normalizedPeriodKey,
    });

    logger.info('[exportDgiiTxtReport] generated', {
      businessId,
      periodKey: normalizedPeriodKey,
      reportCode,
      invoicesLoaded: invoicesSnap.size,
      creditNotesLoaded: creditNotesSnap.size,
      rowCount: rows.length,
    });

    return { ok: true, content, fileName, rowCount: rows.length };
  },
);
