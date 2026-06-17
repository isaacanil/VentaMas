import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  checkGisysFactHealthMock,
  documentSnapshots,
  financeConfigRoles,
  getUserAccessProfileMock,
  getDocRef,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();

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
    checkGisysFactHealthMock: vi.fn(),
    documentSnapshots: hoistedDocumentSnapshots,
    financeConfigRoles: new Set([
      'owner',
      'admin',
      'accountant',
      'controller',
      'dev',
    ]),
    getUserAccessProfileMock: vi.fn(),
    getDocRef: (path) => ({
      path,
      get: vi.fn(async () =>
        hoistedToSnapshot(path, hoistedDocumentSnapshots.get(path)),
      ),
    }),
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    info: vi.fn(),
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
}));

vi.mock('../../../core/config/secrets.js', () => ({
  GISYS_FACT_SECRETS: ['GISYS_FACT_CLIENT_TOKEN'],
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

vi.mock('../services/gisysFactClient.service.js', () => ({
  checkGisysFactHealth: (...args) => checkGisysFactHealthMock(...args),
}));

import { validateElectronicTaxReceiptConfig } from './validateElectronicTaxReceiptConfig.js';

const originalToken = process.env.GISYS_FACT_CLIENT_TOKEN;
const originalBaseUrl = process.env.GISYS_FACT_BASE_URL;
const originalTimeout = process.env.GISYS_FACT_TIMEOUT_MS;
const originalTokenEnvName = process.env.GISYS_FACT_TOKEN_ENV_NAME;

describe('validateElectronicTaxReceiptConfig', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    vi.clearAllMocks();
    delete process.env.GISYS_FACT_CLIENT_TOKEN;
    delete process.env.GISYS_FACT_BASE_URL;
    delete process.env.GISYS_FACT_TIMEOUT_MS;
    delete process.env.GISYS_FACT_TOKEN_ENV_NAME;
    resolveCallableAuthUidMock.mockResolvedValue('accountant-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'dev',
    });
    checkGisysFactHealthMock.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://gisys.example/v1/health',
      body: { ok: true },
    });
  });

  afterAll(() => {
    if (originalToken) {
      process.env.GISYS_FACT_CLIENT_TOKEN = originalToken;
    } else {
      delete process.env.GISYS_FACT_CLIENT_TOKEN;
    }
    if (originalBaseUrl) {
      process.env.GISYS_FACT_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.GISYS_FACT_BASE_URL;
    }
    if (originalTimeout) {
      process.env.GISYS_FACT_TIMEOUT_MS = originalTimeout;
    } else {
      delete process.env.GISYS_FACT_TIMEOUT_MS;
    }
    if (originalTokenEnvName) {
      process.env.GISYS_FACT_TOKEN_ENV_NAME = originalTokenEnvName;
    } else {
      delete process.env.GISYS_FACT_TOKEN_ENV_NAME;
    }
  });

  it('reports inactive when the e-CF model is disabled in the business config', async () => {
    documentSnapshots.set('businesses/business-1', {
      features: {
        fiscal: {
          electronicModelEnabled: false,
        },
      },
    });

    const result = await validateElectronicTaxReceiptConfig({
      data: {
        businessId: 'business-1',
      },
    });

    expect(result.status).toBe('inactive');
    expect(result.issues).toEqual([]);
    expect(
      result.checks.find((check) => check.key === 'provider'),
    ).toMatchObject({
      status: 'inactive',
    });
    expect(checkGisysFactHealthMock).not.toHaveBeenCalled();
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'accountant-1',
      businessId: 'business-1',
      allowedRoles: financeConfigRoles,
    });
  });

  it('blocks active transport when the mounted GISYS secret is missing', async () => {
    process.env.GISYS_FACT_BASE_URL = 'https://gisys.example/api/v1';
    resolveCallableAuthUidMock.mockResolvedValue('dev-1');

    const result = await validateElectronicTaxReceiptConfig({
      data: {
        businessId: 'business-1',
        electronicModelEnabled: true,
        electronicTransportEnabled: true,
        mode: 'required',
        integrationInstanceCode: 'vm-main',
        taxpayerCode: '132619201',
      },
    });

    expect(result.status).toBe('blocked');
    expect(result.issues).toContain('missing-gisys-token-secret');
    expect(checkGisysFactHealthMock).not.toHaveBeenCalled();
  });

  it('blocks draft validation for non-developers', async () => {
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'accountant',
    });

    await expect(
      validateElectronicTaxReceiptConfig({
        data: {
          businessId: 'business-1',
          electronicModelEnabled: true,
          electronicTransportEnabled: false,
          mode: 'shadow',
          integrationInstanceCode: 'vm-main',
          taxpayerCode: '132619201',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
    expect(assertUserAccessMock).not.toHaveBeenCalled();
  });

  it('ignores runtime values supplied by the business draft', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('dev-1');

    const result = await validateElectronicTaxReceiptConfig({
      data: {
        businessId: 'business-1',
        electronicModelEnabled: true,
        electronicTransportEnabled: true,
        mode: 'required',
        baseUrl: 'https://draft-should-not-win.example/api/v1',
        timeoutMs: 60000,
        integrationInstanceCode: 'vm-main',
        taxpayerCode: '132619201',
      },
    });

    expect(result.status).toBe('blocked');
    expect(result.issues).toContain('missing-base-url');
    expect(result.providerConfig.baseUrl).toBeUndefined();
    expect(result.providerConfig.baseUrlConfigured).toBe(false);
    expect(result.providerConfig.timeoutMs).toBeUndefined();
    expect(checkGisysFactHealthMock).not.toHaveBeenCalled();
  });

  it('marks the draft config ready when local config, secret, and GISYS health pass', async () => {
    process.env.GISYS_FACT_CLIENT_TOKEN = 'secret-token';
    process.env.GISYS_FACT_BASE_URL = 'https://gisys.example/api/v1';
    resolveCallableAuthUidMock.mockResolvedValue('dev-1');

    const result = await validateElectronicTaxReceiptConfig({
      data: {
        businessId: 'business-1',
        checkRemote: true,
        electronicModelEnabled: true,
        electronicTransportEnabled: true,
        mode: 'pilot',
        integrationInstanceCode: 'vm-main',
        taxpayerCode: '132619201',
      },
    });

    expect(result.status).toBe('ready');
    expect(result.issues).toEqual([]);
    expect(result.providerConfig.tokenConfiguredAsSecret).toBe(true);
    expect(result.providerConfig.tokenEnvName).toBeUndefined();
    expect(result.remote?.url).toBeUndefined();
    expect(checkGisysFactHealthMock).toHaveBeenCalledWith({
      config: expect.objectContaining({
        baseUrl: 'https://gisys.example/api/v1',
        integrationInstanceCode: 'vm-main',
        taxpayerCode: '132619201',
      }),
    });
  });
});
