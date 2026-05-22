import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  checkGisysFactHealthMock,
  documentSnapshots,
  getDocRef,
  getUserAccessProfileMock,
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

  return {
    checkGisysFactHealthMock: vi.fn(),
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: (path) => ({
      path,
      get: vi.fn(async () => ({
        exists: hoistedDocumentSnapshots.has(path),
        data: () => hoistedDocumentSnapshots.get(path),
      })),
    }),
    getUserAccessProfileMock: vi.fn(),
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

vi.mock('../../../core/config/secrets.js', () => ({
  GISYS_FACT_SECRETS: ['GISYS_FACT_CLIENT_TOKEN'],
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  getUserAccessProfile: (...args) => getUserAccessProfileMock(...args),
}));

vi.mock('../services/gisysFactClient.service.js', () => ({
  checkGisysFactHealth: (...args) => checkGisysFactHealthMock(...args),
}));

import { validateElectronicTaxReceiptPlatformConfig } from './validateElectronicTaxReceiptPlatformConfig.js';

const originalToken = process.env.GISYS_FACT_CLIENT_TOKEN;
const originalBaseUrl = process.env.GISYS_FACT_BASE_URL;
const originalIntegrationInstanceCode =
  process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE;
const originalMode = process.env.GISYS_FACT_MODE;
const originalTimeout = process.env.GISYS_FACT_TIMEOUT_MS;
const originalTokenEnvName = process.env.GISYS_FACT_TOKEN_ENV_NAME;

describe('validateElectronicTaxReceiptPlatformConfig', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    vi.clearAllMocks();
    delete process.env.GISYS_FACT_CLIENT_TOKEN;
    delete process.env.GISYS_FACT_BASE_URL;
    delete process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE;
    delete process.env.GISYS_FACT_MODE;
    delete process.env.GISYS_FACT_TIMEOUT_MS;
    delete process.env.GISYS_FACT_TOKEN_ENV_NAME;
    resolveCallableAuthUidMock.mockResolvedValue('dev-1');
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
    if (originalIntegrationInstanceCode) {
      process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE =
        originalIntegrationInstanceCode;
    } else {
      delete process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE;
    }
    if (originalMode) {
      process.env.GISYS_FACT_MODE = originalMode;
    } else {
      delete process.env.GISYS_FACT_MODE;
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

  it('blocks non-developer users', async () => {
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'admin',
    });

    await expect(
      validateElectronicTaxReceiptPlatformConfig({ data: {} }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('reports missing global runtime without leaking a secret value', async () => {
    const result = await validateElectronicTaxReceiptPlatformConfig({
      data: { checkRemote: true },
    });

    expect(result.status).toBe('blocked');
    expect(result.runtime.baseUrlConfigured).toBe(false);
    expect(result.runtime.integrationInstanceConfigured).toBe(false);
    expect(result.runtime.electronicPreparationEnabled).toBe(false);
    expect(result.runtime.tokenConfiguredAsSecret).toBe(false);
    expect(result.runtime.tokenEnvName).toBe('GISYS_FACT_CLIENT_TOKEN');
    expect(checkGisysFactHealthMock).not.toHaveBeenCalled();
  });

  it('marks the platform runtime ready when env, secret, and health pass', async () => {
    process.env.GISYS_FACT_CLIENT_TOKEN = 'secret-token';
    documentSnapshots.set('platformConfig/gisysFact', {
      baseUrl: 'https://gisys.example/api/v1',
      integrationInstanceCode: 'ventamax-global-test',
      electronicModelEnabled: true,
      mode: 'required',
      timeoutMs: 45000,
    });

    const result = await validateElectronicTaxReceiptPlatformConfig({
      data: { checkRemote: true },
    });

    expect(result.status).toBe('ready');
    expect(result.runtime.baseUrl).toBe('https://gisys.example/api/v1');
    expect(result.runtime.integrationInstanceCode).toBe('ventamax-global-test');
    expect(result.runtime.integrationInstanceConfigured).toBe(true);
    expect(result.runtime.electronicPreparationEnabled).toBe(true);
    expect(result.runtime.mode).toBe('required');
    expect(result.runtime.configSource).toBe('firestore');
    expect(result.runtime.timeoutMs).toBe(45000);
    expect(result.runtime.tokenConfiguredAsSecret).toBe(true);
    expect(checkGisysFactHealthMock).toHaveBeenCalledWith({
      config: expect.objectContaining({
        baseUrl: 'https://gisys.example/api/v1',
        integrationInstanceCode: 'ventamax-global-test',
        mode: 'required',
        timeoutMs: 45000,
      }),
    });
  });

  it('returns the saved preparation switch and delivery stage separately from instance readiness', async () => {
    process.env.GISYS_FACT_CLIENT_TOKEN = 'secret-token';
    documentSnapshots.set('platformConfig/gisysFact', {
      baseUrl: 'https://gisys.example/api/v1',
      integrationInstanceCode: 'ventamax-global-test',
      electronicModelEnabled: false,
      mode: 'shadow',
      timeoutMs: 20000,
    });

    const result = await validateElectronicTaxReceiptPlatformConfig({
      data: { checkRemote: false },
    });

    expect(result.status).toBe('ready');
    expect(result.runtime.integrationInstanceCode).toBe('ventamax-global-test');
    expect(result.runtime.integrationInstanceConfigured).toBe(true);
    expect(result.runtime.electronicPreparationEnabled).toBe(false);
    expect(result.runtime.mode).toBe('shadow');
    expect(checkGisysFactHealthMock).not.toHaveBeenCalled();
  });
});
