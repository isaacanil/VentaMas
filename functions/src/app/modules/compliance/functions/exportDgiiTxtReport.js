import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { resolveBusinessFiscalRollout } from '../../taxReceipt/utils/fiscalRollout.util.js';
import {
  assertValidDgii606Header,
  buildDgii606TxtContent,
  buildDgii606TxtFileName,
  buildDgii606TxtRow,
} from '../services/dgii606TxtExport.service.js';
import {
  resolveMonthlyPeriodRange,
} from '../services/dgiiMonthlyReportShared.util.js';
import {
  assertValidDgii607Header,
  buildDgii607TxtContent,
  buildDgii607TxtFileName,
  buildDgii607TxtRow,
  shouldExcludeDgii607TxtRecord,
} from '../services/dgii607TxtExport.service.js';
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

const assertTxtRowsAvailable = ({ reportCode, rows }) => {
  if (rows.length > 0) return;

  throw new HttpsError(
    'failed-precondition',
    `No hay registros para exportar TXT ${reportCode}. Presente el formato informativo/en cero desde la Oficina Virtual DGII.`,
  );
};

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toSourceRecordArray = (value) => (Array.isArray(value) ? value : []);

const assertAuditableSourceRecords = ({ reportCode, reportRunData }) => {
  const sourceRecords = reportRunData?.sourceSnapshot?.sourceRecords;
  if (isRecord(sourceRecords)) return sourceRecords;

  throw new HttpsError(
    'failed-precondition',
    `La corrida fiscal ${reportCode} seleccionada no tiene snapshot auditable. Genere una corrida nueva antes de exportar el TXT.`,
  );
};

const buildDgii606RecordFromSnapshot = (row) => ({
  counterparty: {
    identification: {
      number: row?.counterpartyIdentificationNumber ?? null,
    },
  },
  classification: {
    dgii606ExpenseType: row?.expenseType ?? null,
  },
  taxReceipt: {
    ncf: row?.documentFiscalNumber ?? null,
    modifiedNcf: row?.modifiedDocumentFiscalNumber ?? null,
  },
  issuedAt: row?.issuedAt ?? null,
  paymentAt: row?.paymentAt ?? null,
  paymentInfo: {
    formCode: row?.paymentFormCode ?? null,
  },
  fiscalAmounts: {
    serviceAmount: row?.serviceAmount ?? 0,
    goodsAmount: row?.goodsAmount ?? 0,
    totalAmount:
      row?.fiscalTotalAmount ??
      Number(row?.serviceAmount ?? 0) + Number(row?.goodsAmount ?? 0),
    itbisToAdvance: row?.itbisToAdvance,
  },
  taxBreakdown: {
    itbisTotal: row?.itbisTotal ?? 0,
    itbisWithheld: row?.itbisWithheld ?? 0,
    itbisProportionality: row?.itbisProportionality ?? 0,
    itbisCost: row?.itbisCost ?? 0,
    itbisReceived: row?.itbisReceived ?? 0,
    isrRetentionType: row?.isrRetentionType ?? null,
    incomeTaxWithheld: row?.incomeTaxWithheld ?? 0,
    incomeTaxReceived: row?.incomeTaxReceived ?? 0,
    selectiveTax: row?.selectiveTax ?? 0,
    otherTaxes: row?.otherTaxes ?? 0,
    legalTip: row?.legalTip ?? 0,
  },
  status: row?.status ?? null,
  metadata: {
    recordId: row?.recordId ?? null,
    sourcePath: row?.sourcePath ?? null,
  },
});

const buildDgii607RecordFromSnapshot = (row) => ({
  data: {
    NCF: row?.documentFiscalNumber ?? null,
  },
  ncf: row?.documentFiscalNumber ?? null,
  counterparty: {
    identification: {
      number: row?.counterpartyIdentificationNumber ?? null,
    },
  },
  invoiceId: row?.invoiceId ?? null,
  issuedAt: row?.issuedAt ?? null,
  createdAt: row?.issuedAt ?? null,
  retentionDate: row?.retentionDate ?? null,
  totals: {
    total: row?.total ?? 0,
    tax: row?.itbisTotal ?? 0,
  },
  itbisWithheld: row?.itbisWithheld ?? 0,
  incomeTaxWithheld: row?.incomeTaxWithheld ?? 0,
  paymentBreakdown: {
    cash: row?.cash ?? 0,
    bank: row?.checkTransfer ?? 0,
    card: row?.card ?? 0,
    creditSale: row?.creditSale ?? 0,
    giftCertificates: row?.giftCertificates ?? 0,
    barter: row?.barter ?? 0,
    otherSales: row?.otherSales ?? 0,
  },
  status: row?.status ?? null,
  metadata: {
    recordId: row?.recordId ?? null,
    sourcePath: row?.sourcePath ?? null,
    invoiceId: row?.invoiceId ?? null,
    invoiceNcf: row?.invoiceNcf ?? null,
  },
});

const buildDgii608RecordFromSnapshot = (row) => ({
  data: {
    NCF: row?.documentFiscalNumber ?? null,
  },
  ncf: row?.documentFiscalNumber ?? null,
  voidedAt: row?.voidedAt ?? null,
  createdAt: row?.createdAt ?? null,
  issuedAt: row?.issuedAt ?? null,
  voidReasonCode: row?.reasonCode ?? null,
  status: row?.status ?? null,
  metadata: {
    recordId: row?.recordId ?? null,
    sourcePath: row?.sourcePath ?? null,
  },
});

const assertMatchingReportRun = async ({
  businessId,
  periodKey,
  reportCode,
  reportRunId,
}) => {
  if (!reportRunId) {
    throw new HttpsError(
      'invalid-argument',
      'reportRunId es requerido para exportar un TXT DGII auditable.',
    );
  }

  const reportRunSnap = await db
    .doc(`businesses/${businessId}/taxReportRuns/${reportRunId}`)
    .get();
  if (!reportRunSnap.exists) {
    throw new HttpsError('not-found', 'Corrida fiscal no encontrada.');
  }

  const reportRunData = reportRunSnap.data() || {};
  if (
    reportRunData.businessId !== businessId ||
    reportRunData.periodKey !== periodKey ||
    reportRunData.reportCode !== reportCode
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La corrida fiscal seleccionada no corresponde al negocio, periodo y reporte solicitados.',
    );
  }

  return reportRunData;
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
    const reportRunId = toCleanString(request?.data?.reportRunId) || null;

    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido');
    }
    if (!periodKey) {
      throw new HttpsError('invalid-argument', 'periodKey es requerido');
    }
    if (!['DGII_606', 'DGII_607', 'DGII_608'].includes(reportCode)) {
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

    const businessRnc =
      toCleanString(businessData.rnc) ||
      toCleanString(businessData.business?.rnc) ||
      null;

    const { periodKey: normalizedPeriodKey } =
      resolveMonthlyPeriodRange(periodKey);

    const reportRunData = await assertMatchingReportRun({
      businessId,
      periodKey: normalizedPeriodKey,
      reportCode,
      reportRunId,
    });
    const sourceRecords = assertAuditableSourceRecords({
      reportCode,
      reportRunData,
    });

    if (reportCode === 'DGII_606') {
      const paymentsByPurchaseId = toSourceRecordArray(
        sourceRecords.accountsPayablePayments,
      ).reduce((accumulator, payment) => {
        const purchaseId = toCleanString(payment?.purchaseId);
        if (!purchaseId) return accumulator;

        const currentPayments = accumulator.get(purchaseId) ?? [];
        currentPayments.push(payment);
        accumulator.set(purchaseId, currentPayments);
        return accumulator;
      }, new Map());
      const purchaseRows = toSourceRecordArray(sourceRecords.purchases);
      const purchaseIds = new Set(
        purchaseRows.map((record) => toCleanString(record?.recordId)).filter(Boolean),
      );
      const linkedPurchaseRows = toSourceRecordArray(
        sourceRecords.linkedPurchases,
      ).filter((record) => {
        const recordId = toCleanString(record?.recordId);
        return recordId && !purchaseIds.has(recordId);
      });
      const rowEntries = [
        ...purchaseRows.map((record) => ({
          record: buildDgii606RecordFromSnapshot(record),
          sortKey: record?.issuedAt ?? '',
          payments:
            paymentsByPurchaseId.get(toCleanString(record?.recordId) ?? '') ??
            [],
        })),
        ...linkedPurchaseRows.map((record) => ({
          record: buildDgii606RecordFromSnapshot(record),
          sortKey: record?.issuedAt ?? '',
          payments:
            paymentsByPurchaseId.get(toCleanString(record?.recordId) ?? '') ??
            [],
        })),
        ...toSourceRecordArray(sourceRecords.expenses).map((record) => ({
          record: buildDgii606RecordFromSnapshot(record),
          sortKey: record?.issuedAt ?? '',
          payments: [],
        })),
      ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      let rows;
      try {
        rows = rowEntries.map(({ record, payments }) =>
          buildDgii606TxtRow({ record, payments }),
        );
        assertValidDgii606Header({
          businessRnc,
          periodKey: normalizedPeriodKey,
          rowCount: rows.length,
        });
      } catch (error) {
        throw new HttpsError(
          'failed-precondition',
          error instanceof Error
            ? error.message
            : 'No se pudo construir el TXT 606 con los datos actuales.',
        );
      }
      assertTxtRowsAvailable({ reportCode, rows });

      const content = buildDgii606TxtContent({
        businessRnc,
        periodKey: normalizedPeriodKey,
        rows,
      });
      const fileName = buildDgii606TxtFileName({
        businessRnc,
        periodKey: normalizedPeriodKey,
      });

      logger.info('[exportDgiiTxtReport] generated', {
        businessId,
        periodKey: normalizedPeriodKey,
        reportCode,
        reportRunId,
        source: 'taxReportRun.sourceSnapshot',
        purchasesLoaded: toSourceRecordArray(sourceRecords.purchases).length,
        linkedPurchasesLoaded: linkedPurchaseRows.length,
        expensesLoaded: toSourceRecordArray(sourceRecords.expenses).length,
        accountsPayablePaymentsLoaded: toSourceRecordArray(
          sourceRecords.accountsPayablePayments,
        ).length,
        rowCount: rows.length,
      });

      return { ok: true, content, fileName, rowCount: rows.length };
    }

    if (reportCode === 'DGII_607') {
      const sourceRowEntries = [
        ...toSourceRecordArray(sourceRecords.invoices).map((snapshotRow) => ({
          isCredit: false,
          record: buildDgii607RecordFromSnapshot(snapshotRow),
          sortKey:
            snapshotRow?.retentionDate ??
            snapshotRow?.issuedAt ??
            '',
          originalNcf: null,
        })),
        ...toSourceRecordArray(sourceRecords.creditNotes).map((snapshotRow) => ({
          isCredit: true,
          isDebit: false,
          record: buildDgii607RecordFromSnapshot(snapshotRow),
          sortKey: snapshotRow?.issuedAt ?? '',
          originalNcf: snapshotRow?.invoiceNcf ?? '',
        })),
        ...toSourceRecordArray(sourceRecords.debitNotes).map((snapshotRow) => ({
          isCredit: false,
          isDebit: true,
          record: buildDgii607RecordFromSnapshot(snapshotRow),
          sortKey: snapshotRow?.issuedAt ?? '',
          originalNcf: snapshotRow?.invoiceNcf ?? '',
        })),
        ...toSourceRecordArray(sourceRecords.thirdPartyWithholdings).map(
          (snapshotRow) => ({
            isCredit: false,
            isDebit: false,
            record: buildDgii607RecordFromSnapshot(snapshotRow),
            sortKey: snapshotRow?.retentionDate ?? snapshotRow?.issuedAt ?? '',
            originalNcf: null,
          }),
        ),
      ];
      const rowEntries = sourceRowEntries
        .filter(
          ({ record, isCredit, isDebit }) =>
            !shouldExcludeDgii607TxtRecord({ record, isCredit, isDebit }),
        )
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      let rows;
      try {
        rows = rowEntries.map(({ record, isCredit, isDebit, originalNcf }) =>
          buildDgii607TxtRow({
            record,
            firestoreDoc: record,
            isCredit,
            isDebit,
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
      if (rows.length === 0 && sourceRowEntries.length > 0) {
        throw new HttpsError(
          'failed-precondition',
          'No hay filas detalladas para exportar TXT 607. Las facturas de consumidor final por debajo de RD$250,000 deben presentarse en el resumen general de facturas de consumo de la Oficina Virtual DGII.',
        );
      }
      assertTxtRowsAvailable({ reportCode, rows });

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
        reportRunId,
        source: 'taxReportRun.sourceSnapshot',
        invoicesLoaded: toSourceRecordArray(sourceRecords.invoices).length,
        creditNotesLoaded: toSourceRecordArray(sourceRecords.creditNotes).length,
        debitNotesLoaded: toSourceRecordArray(sourceRecords.debitNotes).length,
        thirdPartyWithholdingsLoaded: toSourceRecordArray(
          sourceRecords.thirdPartyWithholdings,
        ).length,
        rowCount: rows.length,
      });

      return { ok: true, content, fileName, rowCount: rows.length };
    }

    const orderedRecords = [
      ...toSourceRecordArray(sourceRecords.invoices),
      ...toSourceRecordArray(sourceRecords.creditNotes),
      ...toSourceRecordArray(sourceRecords.debitNotes),
    ]
      .map((record) => buildDgii608RecordFromSnapshot(record))
      .sort((a, b) =>
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
    assertTxtRowsAvailable({ reportCode, rows });

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
      reportRunId,
      source: 'taxReportRun.sourceSnapshot',
      invoicesLoaded: toSourceRecordArray(sourceRecords.invoices).length,
      creditNotesLoaded: toSourceRecordArray(sourceRecords.creditNotes).length,
      debitNotesLoaded: toSourceRecordArray(sourceRecords.debitNotes).length,
      rowCount: rows.length,
    });

    return { ok: true, content, fileName, rowCount: rows.length };
  },
);
