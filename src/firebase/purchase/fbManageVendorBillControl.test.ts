import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const callableRunner = vi.fn();

  return {
    callableRunner,
    createFirebaseCallable: vi.fn(() => callableRunner),
    getStoredSession: vi.fn(),
  };
});

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: mocks.createFirebaseCallable,
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: mocks.getStoredSession,
}));

import { fbManageVendorBillControl } from './fbManageVendorBillControl';

describe('fbManageVendorBillControl', () => {
  beforeEach(() => {
    mocks.callableRunner.mockReset();
    mocks.createFirebaseCallable.mockClear();
    mocks.getStoredSession.mockReset();

    mocks.callableRunner.mockResolvedValue({
      ok: true,
      action: 'place_hold',
      businessId: 'business-1',
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      controlEventId: 'event-1',
      status: 'on_hold',
      approvalStatus: 'approved',
    });
    mocks.getStoredSession.mockReturnValue({ sessionToken: 'session-1' });
  });

  it('requires a meaningful reason before calling the backend', async () => {
    await expect(
      fbManageVendorBillControl(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          action: 'place_hold',
          vendorBillId: 'purchase:purchase-1',
          purchaseId: 'purchase-1',
          reason: ' no ',
        },
      ),
    ).rejects.toThrow('Debe indicar un motivo con al menos 5 caracteres.');

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });

  it('requires evidence before approval-style control decisions', async () => {
    await expect(
      fbManageVendorBillControl(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          action: 'approve',
          vendorBillId: 'purchase:purchase-1',
          purchaseId: 'purchase-1',
          reason: 'Factura validada por contabilidad',
        },
      ),
    ).rejects.toThrow(
      'Debe indicar una evidencia o referencia para este control de CxP.',
    );

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });

  it('requires evidence before voiding a payable', async () => {
    await expect(
      fbManageVendorBillControl(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          action: 'void',
          vendorBillId: 'purchase:purchase-1',
          purchaseId: 'purchase-1',
          reason: 'Factura duplicada por suplidor',
        },
      ),
    ).rejects.toThrow(
      'Debe indicar una evidencia o referencia para este control de CxP.',
    );

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });

  it('forwards void control payload with evidence', async () => {
    mocks.callableRunner.mockResolvedValueOnce({
      ok: true,
      action: 'void',
      businessId: 'business-1',
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      controlEventId: 'event-void-1',
      status: 'voided',
      approvalStatus: 'voided',
    });

    await expect(
      fbManageVendorBillControl(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          action: 'void',
          evidenceNote: '  Ticket AP-VOID-1  ',
          vendorBillId: 'purchase:purchase-1',
          purchaseId: 'purchase-1',
          reason: '  Factura duplicada por suplidor  ',
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      action: 'void',
      status: 'voided',
    });

    expect(mocks.callableRunner).toHaveBeenCalledWith({
      action: 'void',
      businessId: 'business-1',
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      reason: 'Factura duplicada por suplidor',
      evidenceNote: 'Ticket AP-VOID-1',
      evidenceUrls: [],
      sessionToken: 'session-1',
    });
  });

  it('trims and forwards control payload with the active session token', async () => {
    await expect(
      fbManageVendorBillControl(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          action: 'place_hold',
          evidenceNote: '  Factura física pendiente  ',
          evidenceUrls: [' https://files.example/ap-1.pdf ', '  '],
          vendorBillId: 'purchase:purchase-1',
          purchaseId: 'purchase-1',
          reason: '  Falta evidencia fiscal  ',
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      controlEventId: 'event-1',
    });

    expect(mocks.callableRunner).toHaveBeenCalledWith({
      action: 'place_hold',
      businessId: 'business-1',
      vendorBillId: 'purchase:purchase-1',
      purchaseId: 'purchase-1',
      reason: 'Falta evidencia fiscal',
      evidenceNote: 'Factura física pendiente',
      evidenceUrls: ['https://files.example/ap-1.pdf'],
      sessionToken: 'session-1',
    });
  });
});
