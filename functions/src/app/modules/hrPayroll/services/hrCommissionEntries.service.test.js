import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
  db: {
    doc: (path) => ({ path }),
  },
}));

import {
  buildHrCommissionEntryFromServiceCommission,
  buildHrEmployeeLookupIndex,
  isHrCommissionEntryLockedForResync,
  resolveEmployeeForServiceCommission,
  resolveHrCommissionEntryId,
  syncHrCommissionEntriesFromServiceCommissionRecordsTx,
  syncRecalculableHrCommissionEntriesFromServiceCommissionRecordsTx,
  voidHrCommissionEntriesForServiceCommissionDocsTx,
} from './hrCommissionEntries.service.js';

describe('hrCommissionEntries.service', () => {
  it('derives a stable HR entry id from a service commission', () => {
    expect(resolveHrCommissionEntryId({ id: 'invoice-1_line-1' })).toBe(
      'service_invoice-1_line-1',
    );
  });

  it('resolves an employee by code, user, party or employee id', () => {
    const index = buildHrEmployeeLookupIndex([
      {
        id: 'emp-1',
        employeeId: 'emp-1',
        code: 'EMP-001',
        linkedUserId: 'user-1',
        partyId: 'party-1',
      },
    ]);

    expect(
      resolveEmployeeForServiceCommission(
        { collaboratorCode: 'EMP-001' },
        index,
      )?.employeeId,
    ).toBe('emp-1');
    expect(
      resolveEmployeeForServiceCommission(
        { collaborator: { linkedUserId: 'user-1' } },
        index,
      )?.employeeId,
    ).toBe('emp-1');
    expect(
      resolveEmployeeForServiceCommission(
        { collaborator: { partyId: 'party-1' } },
        index,
      )?.employeeId,
    ).toBe('emp-1');
  });

  it('builds a calculated entry when the employee can be resolved', () => {
    const index = buildHrEmployeeLookupIndex([
      {
        id: 'emp-1',
        employeeId: 'emp-1',
        code: 'EMP-001',
        fullName: 'Ana Perez',
        partyId: 'party-1',
      },
    ]);
    const entry = buildHrCommissionEntryFromServiceCommission({
      businessId: 'business-1',
      employeeIndex: index,
      serviceCommission: {
        id: 'commission-1',
        invoiceId: 'invoice-1',
        invoiceNumber: 'F-001',
        lineId: 'line-1',
        serviceName: 'Consulta',
        collaboratorCode: 'EMP-001',
        billedAmount: 1000,
        commissionAmount: 100,
        status: 'active',
        commission: {
          type: 'percentage',
          rateValue: 10,
          calculationBase: 'netSubtotalWithoutTax',
        },
      },
      timestamp: 'now',
      userId: 'admin-1',
    });

    expect(entry).toMatchObject({
      id: 'service_commission-1',
      businessId: 'business-1',
      employeeId: 'emp-1',
      employeeCode: 'EMP-001',
      employeeNameSnapshot: 'Ana Perez',
      partyId: 'party-1',
      invoiceId: 'invoice-1',
      commissionAmount: 100,
      status: 'calculated',
      dedupeKey: 'business-1|serviceCommission|commission-1|emp-1',
    });
  });

  it('keeps unresolved commissions visible for adjustment', () => {
    const entry = buildHrCommissionEntryFromServiceCommission({
      businessId: 'business-1',
      serviceCommission: {
        id: 'commission-1',
        invoiceId: 'invoice-1',
        lineId: 'line-1',
        collaboratorCode: 'TEMP-1',
        billedAmount: 1000,
        commissionAmount: 100,
        commission: { type: 'percentage', rateValue: 10 },
      },
      timestamp: 'now',
    });

    expect(entry).toMatchObject({
      employeeId: null,
      employeeCode: 'TEMP-1',
      status: 'requires_adjustment',
    });
  });

  it('writes entries in the same transaction used by service commissions', () => {
    const transaction = { set: vi.fn() };
    const entries = syncHrCommissionEntriesFromServiceCommissionRecordsTx(
      transaction,
      {
        businessId: 'business-1',
        records: [
          {
            id: 'commission-1',
            invoiceId: 'invoice-1',
            lineId: 'line-1',
            billedAmount: 100,
            commissionAmount: 5,
            commission: { type: 'percentage', rateValue: 5 },
          },
        ],
        timestamp: 'now',
      },
    );

    expect(entries).toHaveLength(1);
    expect(transaction.set).toHaveBeenCalledWith(
      {
        path: 'businesses/business-1/hrCommissionEntries/service_commission-1',
      },
      expect.objectContaining({ id: 'service_commission-1' }),
      { merge: true },
    );
  });

  it('detects entries linked to payroll lifecycle as locked for recalculation', () => {
    expect(
      isHrCommissionEntryLockedForResync({
        status: 'calculated',
        payrollEmployeeLineId: 'line-1',
      }),
    ).toBe(true);
    expect(
      isHrCommissionEntryLockedForResync({
        status: 'approved',
      }),
    ).toBe(true);
    expect(
      isHrCommissionEntryLockedForResync({
        status: 'calculated',
      }),
    ).toBe(false);
  });

  it('does not overwrite existing entries already linked to a payroll line when recalculating', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          status: 'approved',
          payrollEmployeeLineId: 'line-1',
        }),
      }),
      set: vi.fn(),
    };

    const entries =
      await syncRecalculableHrCommissionEntriesFromServiceCommissionRecordsTx(
        transaction,
        {
          businessId: 'business-1',
          records: [
            {
              id: 'commission-1',
              invoiceId: 'invoice-1',
              lineId: 'line-1',
              billedAmount: 100,
              commissionAmount: 5,
              commission: { type: 'percentage', rateValue: 5 },
            },
          ],
          timestamp: 'now',
        },
      );

    expect(entries).toHaveLength(0);
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it('marks the matching HR entry cancelled when a service commission is voided', () => {
    const transaction = { set: vi.fn() };
    voidHrCommissionEntriesForServiceCommissionDocsTx(transaction, {
      authUid: 'admin-1',
      businessId: 'business-1',
      commissionDocs: [
        {
          id: 'commission-1',
          data: () => ({ invoiceId: 'invoice-1', lineId: 'line-1' }),
        },
      ],
      reasonLabel: 'Anulación',
      voidedAt: 'now',
    });

    expect(transaction.set).toHaveBeenCalledWith(
      {
        path: 'businesses/business-1/hrCommissionEntries/service_commission-1',
      },
      expect.objectContaining({
        status: 'cancelled',
        sourceStatus: 'voided',
        voidedBy: 'admin-1',
      }),
      { merge: true },
    );
  });
});
