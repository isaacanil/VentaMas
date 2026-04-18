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
  loadDgii607Datasets,
  resolveMonthlyPeriodRange,
} from '../services/dgii607MonthlyReport.service.js';
import {
  assertValidDgii607Header,
  buildDgii607TxtContent,
  buildDgii607TxtFileName,
  buildDgii607TxtRow,
  shouldExcludeDgii607TxtRecord,
} from '../services/dgii607TxtExport.service.js';
import { loadDgii608Datasets } from '../services/dgii608MonthlyReport.service.js';
import {
  assertValidDgii608Header,
  buildDgii608TxtContent,
  buildDgii608TxtFileName,
  buildDgii608TxtRow,
} from '../services/dgii608TxtExport.service.js';

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
    if (!['DGII_607', 'DGII_608'].includes(reportCode)) {
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
      periodKey: normalizedPeriodKey,
    } = resolveMonthlyPeriodRange(periodKey);

    if (reportCode === 'DGII_607') {
      const { datasets, rawSnapshots } = await loadDgii607Datasets({
        businessId,
        periodKey,
        firestore: db,
      });

      const rowEntries = [
        ...datasets.invoices.map((record) => ({
          isCredit: false,
          firestoreDoc: record,
          record,
          sortKey: record?.retentionDate ?? record?.issuedAt ?? record?.createdAt ?? '',
          originalNcf: null,
        })),
        ...datasets.creditNotes.map((record) => ({
          isCredit: true,
          firestoreDoc: record,
          record,
          sortKey: record?.issuedAt ?? record?.createdAt ?? '',
          originalNcf: record?.metadata?.invoiceNcf ?? '',
        })),
        ...datasets.thirdPartyWithholdings.map((record) => ({
          isCredit: false,
          firestoreDoc: record,
          record,
          sortKey: record?.retentionDate ?? record?.issuedAt ?? '',
          originalNcf: null,
        })),
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
        invoicesLoaded: rawSnapshots.invoices.size,
        creditNotesLoaded: rawSnapshots.creditNotes.size,
        thirdPartyWithholdingsLoaded: rawSnapshots.thirdPartyWithholdings.size,
        rowCount: rows.length,
      });

      return { ok: true, content, fileName, rowCount: rows.length };
    }

    const { datasets } = await loadDgii608Datasets({
      businessId,
      periodKey,
      firestore: db,
    });
    const orderedRecords = [...datasets.invoices, ...datasets.creditNotes].sort((a, b) =>
      (a?.voidedAt ?? a?.createdAt ?? '').localeCompare(
        b?.voidedAt ?? b?.createdAt ?? '',
      ),
    );

    let rows;
    try {
      rows = orderedRecords.map((record) => buildDgii608TxtRow(record));
      assertValidDgii608Header({
        businessRnc,
        periodKey: normalizedPeriodKey,
        rowCount: rows.length,
      });
    } catch (error) {
      throw new HttpsError(
        'failed-precondition',
        error instanceof Error
          ? error.message
          : 'No se pudo construir el TXT 608 con los datos actuales.',
      );
    }

    const content = buildDgii608TxtContent({
      businessRnc,
      periodKey: normalizedPeriodKey,
      rows,
    });
    const fileName = buildDgii608TxtFileName({
      businessRnc,
      periodKey: normalizedPeriodKey,
    });

    logger.info('[exportDgiiTxtReport] generated', {
      businessId,
      periodKey: normalizedPeriodKey,
      reportCode,
      invoicesLoaded: datasets.invoices.length,
      creditNotesLoaded: datasets.creditNotes.length,
      rowCount: rows.length,
    });

    return { ok: true, content, fileName, rowCount: rows.length };
  },
);
