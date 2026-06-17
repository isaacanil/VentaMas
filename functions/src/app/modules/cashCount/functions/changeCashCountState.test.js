import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  docRefs,
  fieldArrayUnionMock,
  getDocRef,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedDocRefs = new Map();
  const hoistedFieldArrayUnionMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocRefs.has(path)) {
      hoistedDocRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
        get: vi.fn(),
        update: vi.fn(),
      });
    }
    return hoistedDocRefs.get(path);
  };

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    docRefs: hoistedDocRefs,
    fieldArrayUnionMock: hoistedFieldArrayUnionMock,
    getDocRef: hoistedGetDocRef,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
  },
  FieldValue: {
    arrayUnion: (...args) => fieldArrayUnionMock(...args),
  },
  Timestamp: {
    fromMillis: (millis) => ({ millis }),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import { changeCashCountState } from './changeCashCountState.js';

const buildRequest = (data = {}) => ({
  data: {
    businessId: 'business-1',
    cashCountId: 'cash-1',
    state: 'closing',
    ...data,
  },
});

const buildCashCountSnap = ({
  openingEmployeePath = 'users/auth-user',
} = {}) => ({
  exists: true,
  get: vi.fn((path) => {
    if (path === 'cashCount.opening.employee') {
      return getDocRef(openingEmployeePath);
    }
    return undefined;
  }),
});

describe('changeCashCountState', () => {
  beforeEach(() => {
    docRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('auth-user');
    assertUserAccessMock.mockResolvedValue({
      role: 'cashier',
      source: 'canonical',
    });
    fieldArrayUnionMock.mockImplementation((value) => ({
      __op: 'arrayUnion',
      value,
    }));
  });

  it('rejects closed state so closure must go through closeCashCount', async () => {
    await expect(
      changeCashCountState(buildRequest({ state: 'closed' })),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(
      getDocRef('businesses/business-1/cashCounts/cash-1').update,
    ).not.toHaveBeenCalled();
  });

  it.each(['open', 'closing'])(
    'allows %s state transitions for the opening employee',
    async (state) => {
      const cashCountRef = getDocRef('businesses/business-1/cashCounts/cash-1');
      cashCountRef.get.mockResolvedValue(buildCashCountSnap());
      cashCountRef.update.mockResolvedValue(undefined);

      await expect(
        changeCashCountState(buildRequest({ state })),
      ).resolves.toEqual({
        ok: true,
        businessId: 'business-1',
        cashCountId: 'cash-1',
        state,
      });

      expect(cashCountRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'cashCount.state': state,
          'cashCount.stateHistory': expect.objectContaining({
            __op: 'arrayUnion',
            value: expect.objectContaining({
              state,
              updatedBy: 'auth-user',
            }),
          }),
        }),
      );
    },
  );
});
