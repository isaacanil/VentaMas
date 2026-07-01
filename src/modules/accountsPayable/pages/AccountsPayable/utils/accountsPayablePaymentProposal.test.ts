import { describe, expect, it } from 'vitest';

import type { AccountsPayableRow } from './accountsPayableDashboard';
import {
  buildAccountsPayablePaymentProposal,
  isAccountsPayableRowPaymentEligible,
  resolveAccountsPayableProposalCashSnapshot,
  sortAccountsPayableProposalRows,
} from './accountsPayablePaymentProposal';

const buildRow = ({
  agingBucket = 'current',
  balanceAmount = 100,
  canRegisterPayment,
  controlLabel,
  controlReason,
  daysUntilDue = null,
  dueAt = new Date('2026-04-10T10:00:00.000Z').getTime(),
  fiscalSnapshot = {} as AccountsPayableRow['fiscalSnapshot'],
  paidAmount = 0,
  paymentControlStatus = 'payable',
  providerId = 'provider-1',
  providerName = 'Proveedor Uno',
  reference = 'PO-1',
  totalAmount = balanceAmount,
}: Partial<AccountsPayableRow> & {
  canRegisterPayment?: boolean;
  controlLabel?: string;
  controlReason?: string | null;
  daysUntilDue?: number | null;
  paymentControlStatus?: AccountsPayableRow['paymentControl']['status'];
} = {}): AccountsPayableRow => {
  const resolvedCanRegisterPayment =
    canRegisterPayment ?? paymentControlStatus === 'payable';

  return {
    agingBucket,
    agingGroup: agingBucket,
    agingLabel: agingBucket,
    agingTone: agingBucket === 'current' ? 'success' : 'danger',
    agingDays: null,
    daysUntilDue,
    balanceAmount,
    conditionLabel: '30 días',
    dueAt,
    evidenceCount: 0,
    fiscalSnapshot,
    id: reference,
    lastPaymentAt: null,
    paidAmount,
    paymentControl: {
      canRegisterPayment: resolvedCanRegisterPayment,
      label:
        controlLabel ?? (resolvedCanRegisterPayment ? 'Aprobada' : 'Retenida'),
      reason: resolvedCanRegisterPayment
        ? null
        : (controlReason ?? 'Control activo'),
      status: paymentControlStatus,
      tone: resolvedCanRegisterPayment ? 'success' : 'warning',
    },
    paymentCount: 0,
    providerGroup: providerName,
    providerId,
    providerName,
    purchase: { id: reference },
    reference,
    totalAmount,
    traceabilitySummary: reference,
    vendorBill: { id: `purchase:${reference}` },
  } as AccountsPayableRow;
};

describe('accountsPayablePaymentProposal', () => {
  it('marks only payable open balances as eligible', () => {
    expect(isAccountsPayableRowPaymentEligible(buildRow())).toBe(true);
    expect(
      isAccountsPayableRowPaymentEligible(
        buildRow({ balanceAmount: 0, reference: 'PO-0' }),
      ),
    ).toBe(false);
    expect(
      isAccountsPayableRowPaymentEligible(
        buildRow({ canRegisterPayment: false, reference: 'PO-HOLD' }),
      ),
    ).toBe(false);
    expect(
      isAccountsPayableRowPaymentEligible(
        buildRow({ paymentControlStatus: 'closed', reference: 'PO-CLOSED' }),
      ),
    ).toBe(false);
  });

  it('prioritizes older overdue rows before current and no-date rows', () => {
    const sortedRows = sortAccountsPayableProposalRows([
      buildRow({ agingBucket: 'current', reference: 'PO-CURRENT' }),
      buildRow({ agingBucket: 'due_1_30', reference: 'PO-30' }),
      buildRow({ agingBucket: 'no_due_date', dueAt: null, reference: 'PO-NO' }),
      buildRow({ agingBucket: 'due_61_plus', reference: 'PO-61' }),
      buildRow({ agingBucket: 'due_31_60', reference: 'PO-31' }),
    ]);

    expect(sortedRows.map((row) => row.reference)).toEqual([
      'PO-61',
      'PO-31',
      'PO-30',
      'PO-CURRENT',
      'PO-NO',
    ]);
  });

  it('builds proposal totals, exclusions and supplier summaries', () => {
    const proposal = buildAccountsPayablePaymentProposal([
      buildRow({
        agingBucket: 'current',
        balanceAmount: 300,
        daysUntilDue: 3,
        providerId: 'supplier-b',
        providerName: 'Suplidor B',
        reference: 'PO-SOON',
      }),
      buildRow({
        agingBucket: 'due_61_plus',
        balanceAmount: 600,
        providerId: 'supplier-a',
        providerName: 'Suplidor A',
        reference: 'PO-61',
      }),
      buildRow({
        agingBucket: 'due_1_30',
        balanceAmount: 200,
        providerId: 'supplier-b',
        providerName: 'Suplidor B',
        reference: 'PO-30',
      }),
      buildRow({
        agingBucket: 'no_due_date',
        balanceAmount: 150,
        providerId: 'supplier-a',
        providerName: 'Suplidor A',
        reference: 'PO-NO',
      }),
      buildRow({
        balanceAmount: 90,
        canRegisterPayment: false,
        controlLabel: 'Retenida',
        controlReason: 'Falta NCF',
        paymentControlStatus: 'on_hold',
        providerId: 'supplier-c',
        providerName: 'Suplidor C',
        reference: 'PO-HOLD',
      }),
      buildRow({
        balanceAmount: 120,
        controlLabel: 'No aprobada',
        controlReason: null,
        paymentControlStatus: 'pending_approval',
        providerId: 'supplier-d',
        providerName: 'Suplidor D',
        reference: 'PO-APPROVAL',
      }),
      buildRow({
        balanceAmount: 70,
        controlLabel: 'En disputa',
        controlReason: 'Diferencia en recepción',
        paymentControlStatus: 'disputed',
        providerId: 'supplier-e',
        providerName: 'Suplidor E',
        reference: 'PO-DISPUTE',
      }),
    ]);

    expect(proposal).toMatchObject({
      blockedAmount: 280,
      blockedCashRequirementAmount: 280,
      blockedCount: 3,
      blockedWithholdingAmount: 0,
      dueSoonAmount: 300,
      dueSoonCount: 1,
      eligibleAmount: 1250,
      eligibleCashRequirementAmount: 1250,
      eligibleCount: 4,
      eligibleWithholdingAmount: 0,
      noDueDateAmount: 150,
      noDueDateCount: 1,
      overdueAmount: 800,
      visibleAmount: 1530,
      visibleCashRequirementAmount: 1530,
      visibleCount: 7,
      visibleWithholdingAmount: 0,
    });
    expect(proposal.exclusionSummaries).toEqual([
      {
        amount: 120,
        count: 1,
        label: 'No aprobada',
        reasons: ['Control activo'],
        status: 'pending_approval',
      },
      {
        amount: 90,
        count: 1,
        label: 'Retenida',
        reasons: ['Falta NCF'],
        status: 'on_hold',
      },
      {
        amount: 70,
        count: 1,
        label: 'En disputa',
        reasons: ['Diferencia en recepción'],
        status: 'disputed',
      },
    ]);
    expect(proposal.recommendedRows.map((row) => row.reference)).toEqual([
      'PO-61',
      'PO-30',
      'PO-SOON',
    ]);
    expect(proposal.dueSoonRows.map((row) => row.reference)).toEqual([
      'PO-SOON',
    ]);
    expect(proposal.reviewRows.map((row) => row.reference)).toEqual(['PO-NO']);
    expect(proposal.supplierSummaries).toEqual([
      {
        balanceAmount: 750,
        cashRequirementAmount: 750,
        count: 2,
        overdueAmount: 600,
        providerId: 'supplier-a',
        providerName: 'Suplidor A',
        withholdingAmount: 0,
      },
      {
        balanceAmount: 500,
        cashRequirementAmount: 500,
        count: 2,
        overdueAmount: 200,
        providerId: 'supplier-b',
        providerName: 'Suplidor B',
        withholdingAmount: 0,
      },
    ]);
  });

  it('separates estimated cash requirement from fiscal withholdings', () => {
    const row = buildRow({
      balanceAmount: 1180,
      fiscalSnapshot: {
        netPayableAmount: 1106,
        withholdingITBISAmount: 54,
        withholdingISRAmount: 20,
      } as AccountsPayableRow['fiscalSnapshot'],
      reference: 'PO-WITHHOLDING',
      totalAmount: 1180,
    });

    expect(resolveAccountsPayableProposalCashSnapshot(row)).toEqual({
      cashRequirementAmount: 1106,
      grossBalanceAmount: 1180,
      withholdingAmount: 74,
    });

    const proposal = buildAccountsPayablePaymentProposal([row]);

    expect(proposal).toMatchObject({
      eligibleAmount: 1180,
      eligibleCashRequirementAmount: 1106,
      eligibleWithholdingAmount: 74,
      visibleAmount: 1180,
      visibleCashRequirementAmount: 1106,
      visibleWithholdingAmount: 74,
    });
    expect(proposal.supplierSummaries).toEqual([
      {
        balanceAmount: 1180,
        cashRequirementAmount: 1106,
        count: 1,
        overdueAmount: 0,
        providerId: 'provider-1',
        providerName: 'Proveedor Uno',
        withholdingAmount: 74,
      },
    ]);
  });
});
