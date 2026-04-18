const COMMON_DGII_METADATA_FIELDS = Object.freeze([
  'businessId',
  'issuedAt',
  'documentNumber',
  'counterparty.id',
  'counterparty.identification.number',
]);

export const DGII_MONTHLY_REPORTS = Object.freeze({
  DGII_606: Object.freeze({
    reportCode: 'DGII_606',
    frequency: 'monthly',
    jurisdictionId: 'DO-DGII',
    description: 'Compras, costos, gastos, adelantos de ITBIS y retenciones.',
    sourceOfTruth: Object.freeze([
      Object.freeze({
        sourceId: 'purchases',
        collectionPath: 'businesses/{businessId}/purchases',
        ownerModule: 'purchase',
        requiredFields: Object.freeze([
          ...COMMON_DGII_METADATA_FIELDS,
          'supplierId',
          'documentType',
          'taxReceipt.ncf',
          'totals.total',
          'taxBreakdown.itbisTotal',
          'classification.dgii606ExpenseType',
        ]),
      }),
      Object.freeze({
        sourceId: 'expenses',
        collectionPath: 'businesses/{businessId}/expenses',
        ownerModule: 'expenses',
        requiredFields: Object.freeze([
          ...COMMON_DGII_METADATA_FIELDS,
          'expenseType',
          'taxReceipt.ncf',
          'totals.total',
          'taxBreakdown.itbisTotal',
          'classification.dgii606ExpenseType',
        ]),
      }),
      Object.freeze({
        sourceId: 'accountsPayablePayments',
        collectionPath: 'businesses/{businessId}/accountsPayablePayments',
        ownerModule: 'purchase',
        requiredFields: Object.freeze([
          'purchaseId',
          'occurredAt',
          'paymentMethods',
          'paymentStateSnapshot',
          'metadata.appliedCreditNotes',
        ]),
      }),
    ]),
    pendingGaps: Object.freeze([]),
  }),
  DGII_607: Object.freeze({
    reportCode: 'DGII_607',
    frequency: 'monthly',
    jurisdictionId: 'DO-DGII',
    description: 'Ventas y retenciones sufridas por terceros.',
    sourceOfTruth: Object.freeze([
      Object.freeze({
        sourceId: 'invoices',
        collectionPath: 'businesses/{businessId}/invoices',
        ownerModule: 'invoice',
        requiredFields: Object.freeze([
          ...COMMON_DGII_METADATA_FIELDS,
          'clientId',
          'data.NCF',
          'totals.total',
          'totals.tax',
          'status',
        ]),
      }),
      Object.freeze({
        sourceId: 'creditNotes',
        collectionPath: 'businesses/{businessId}/creditNotes',
        ownerModule: 'creditNote',
        requiredFields: Object.freeze([
          'invoiceId',
          'ncf',
          'createdAt',
          'status',
          'totals.total',
        ]),
      }),
      Object.freeze({
        sourceId: 'thirdPartyWithholdings',
        collectionPath: 'businesses/{businessId}/salesThirdPartyWithholdings',
        ownerModule: 'accountsReceivablePayment',
        requiredFields: Object.freeze([
          'invoiceId',
          'retentionDate',
          'data.NCF',
          'counterparty.identification.number',
          'totals.total',
          'totals.tax',
          'itbisWithheld',
          'incomeTaxWithheld',
        ]),
      }),
    ]),
    pendingGaps: Object.freeze([]),
  }),
  DGII_608: Object.freeze({
    reportCode: 'DGII_608',
    frequency: 'monthly',
    jurisdictionId: 'DO-DGII',
    description: 'Comprobantes anulados y sus motivos.',
    sourceOfTruth: Object.freeze([
      Object.freeze({
        sourceId: 'invoices',
        collectionPath: 'businesses/{businessId}/invoices',
        ownerModule: 'invoice',
        requiredFields: Object.freeze([
          'data.NCF',
          'voidedAt',
          'voidReasonCode',
          'status',
        ]),
      }),
      Object.freeze({
        sourceId: 'creditNotes',
        collectionPath: 'businesses/{businessId}/creditNotes',
        ownerModule: 'creditNote',
        requiredFields: Object.freeze([
          'invoiceId',
          'ncf',
          'createdAt',
          'status',
          'voidReasonCode',
        ]),
      }),
    ]),
    pendingGaps: Object.freeze([]),
  }),
});

export const getDgiiMonthlyReportDefinition = (reportCode) =>
  DGII_MONTHLY_REPORTS[reportCode] ?? null;

export const listDgiiMonthlyReportDefinitions = () =>
  Object.values(DGII_MONTHLY_REPORTS);
