import { beforeEach, describe, expect, it, vi } from 'vitest';

const getNextIDTransactionalSnapMock = vi.fn();
const getInsuranceMock = vi.fn();

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class MockHttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(),
  },
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  getNextIDTransactionalSnap: getNextIDTransactionalSnapMock,
}));

vi.mock('../../insurance/services/insurance.service.js', () => ({
  getInsurance: getInsuranceMock,
}));

describe('collectReceivablePrereqs', () => {
  beforeEach(() => {
    vi.resetModules();
    getNextIDTransactionalSnapMock.mockReset();
    getInsuranceMock.mockReset();
  });

  it(
    'omite la lectura de seguro cuando insuranceId no viene informado',
    async () => {
    getNextIDTransactionalSnapMock.mockResolvedValue({ id: 'next-ar-id' });

    const { collectReceivablePrereqs } = await import(
      './getAccountReceivable.service.js'
    );

    const result = await collectReceivablePrereqs(
      { id: 'tx-1' },
      {
        user: { businessID: 'business-1', uid: 'user-1' },
      },
    );

    expect(getNextIDTransactionalSnapMock).toHaveBeenCalledWith(
      { id: 'tx-1' },
      { businessID: 'business-1', uid: 'user-1' },
      'lastAccountReceivableId',
    );
    expect(getInsuranceMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      accountReceivableNextIDSnap: { id: 'next-ar-id' },
      insurance: null,
    });
    },
    10000,
  );

  it(
    'carga el seguro cuando insuranceId viene informado',
    async () => {
    getNextIDTransactionalSnapMock.mockResolvedValue({ id: 'next-ar-id' });
    getInsuranceMock.mockResolvedValue({ id: 'insurance-1' });

    const { collectReceivablePrereqs } = await import(
      './getAccountReceivable.service.js'
    );

    const result = await collectReceivablePrereqs(
      { id: 'tx-2' },
      {
        user: { businessID: 'business-1', uid: 'user-1' },
        insuranceId: 'insurance-1',
      },
    );

    expect(getInsuranceMock).toHaveBeenCalledWith(
      { id: 'tx-2' },
      {
        user: { businessID: 'business-1', uid: 'user-1' },
        insuranceId: 'insurance-1',
      },
    );
    expect(result).toEqual({
      accountReceivableNextIDSnap: { id: 'next-ar-id' },
      insurance: { id: 'insurance-1' },
    });
    },
    10000,
  );
});
