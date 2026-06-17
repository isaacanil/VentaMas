import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  documentSnapshots,
  financeConfigRoles,
  getDocRef,
  getUserAccessProfileMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  updates,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedUpdates = new Map();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  const hoistedToSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  return {
    assertUserAccessMock: vi.fn(),
    documentSnapshots: hoistedDocumentSnapshots,
    financeConfigRoles: new Set([
      'owner',
      'admin',
      'accountant',
      'controller',
      'dev',
    ]),
    getDocRef: (path) => ({
      path,
      get: vi.fn(async () =>
        hoistedToSnapshot(path, hoistedDocumentSnapshots.get(path)),
      ),
      update: vi.fn(async (payload) => {
        hoistedUpdates.set(path, payload);
      }),
    }),
    getUserAccessProfileMock: vi.fn(),
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    updates: hoistedUpdates,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
  },
  FieldValue: {
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  assertUserAccess: (...args) => assertUserAccessMock(...args),
  getUserAccessProfile: (...args) => getUserAccessProfileMock(...args),
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCE_CONFIG: financeConfigRoles,
  },
}));

import { updateElectronicTaxReceiptConfig } from './updateElectronicTaxReceiptConfig.js';

describe('updateElectronicTaxReceiptConfig', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    updates.clear();
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('accountant-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'dev',
    });
  });

  it('lets business finance users update only the GISYS taxpayer code', async () => {
    documentSnapshots.set('businesses/business-1', {
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: false,
          gisysFact: {
            provider: 'gisys',
            enabled: true,
            mode: 'shadow',
            integrationInstanceCode: 'ventamax-0001-test',
            taxpayerCode: 'old-taxpayer',
          },
        },
      },
    });

    const result = await updateElectronicTaxReceiptConfig({
      data: {
        scope: 'business-taxpayer',
        businessId: 'business-1',
        taxpayerCode: 'rncTest00201441797',
      },
    });

    const updatePayload = updates.get('businesses/business-1');
    expect(result.providerConfig.taxpayerCode).toBe('rncTest00201441797');
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'accountant-1',
      businessId: 'business-1',
      allowedRoles: financeConfigRoles,
    });
    expect(getUserAccessProfileMock).not.toHaveBeenCalled();
    expect(updatePayload).toMatchObject({
      'features.fiscal.gisysFact.provider': 'gisys',
      'features.fiscal.gisysFact.enabled': true,
      'features.fiscal.gisysFact.taxpayerCode': 'rncTest00201441797',
      'features.fiscal.gisysFact.updatedAt': 'SERVER_TIMESTAMP',
      'features.fiscal.gisysFact.updatedBy': 'accountant-1',
      updatedAt: 'SERVER_TIMESTAMP',
    });
    expect(
      Object.prototype.hasOwnProperty.call(
        updatePayload,
        'features.fiscal.gisysFact.integrationInstanceCode',
      ),
    ).toBe(false);
    expect(
      Object.prototype.hasOwnProperty.call(
        updatePayload,
        'features.fiscal.electronicModelEnabled',
      ),
    ).toBe(false);
  });

  it('lets business finance users explicitly activate e-CF for their business', async () => {
    documentSnapshots.set('businesses/business-1', {
      features: {
        fiscal: {
          gisysFact: {
            provider: 'gisys',
            enabled: true,
            taxpayerCode: 'old-taxpayer',
          },
        },
      },
    });
    documentSnapshots.set('platformConfig/gisysFact', {
      enabled: true,
      baseUrl: 'https://platform.gisys.example/api/v1',
      integrationInstanceCode: 'ventamax-0001-test',
      electronicModelEnabled: true,
      mode: 'required',
    });

    const result = await updateElectronicTaxReceiptConfig({
      data: {
        scope: 'business-taxpayer',
        businessId: 'business-1',
        electronicModelEnabled: true,
        taxpayerCode: 'rncTest00201441797',
      },
    });

    const updatePayload = updates.get('businesses/business-1');
    expect(result).toMatchObject({
      electronicModelEnabled: true,
      electronicTransportEnabled: true,
      providerConfig: {
        mode: 'required',
        taxpayerCode: 'rncTest00201441797',
      },
    });
    expect(updatePayload).toMatchObject({
      'features.fiscal.electronicModelEnabled': true,
      'features.fiscal.electronicTransportEnabled': true,
      'features.fiscal.gisysFact.mode': 'required',
      'features.fiscal.gisysFact.provider': 'gisys',
      'features.fiscal.gisysFact.enabled': true,
      'features.fiscal.gisysFact.taxpayerCode': 'rncTest00201441797',
    });
  });

  it('blocks full provisioning changes for non-developers', async () => {
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'admin',
    });

    await expect(
      updateElectronicTaxReceiptConfig({
        data: {
          scope: 'developer-provisioning',
          businessId: 'business-1',
          electronicModelEnabled: true,
          electronicTransportEnabled: false,
          mode: 'shadow',
          integrationInstanceCode: 'ventamax-0001-test',
          taxpayerCode: 'rncTest00201441797',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });
});
