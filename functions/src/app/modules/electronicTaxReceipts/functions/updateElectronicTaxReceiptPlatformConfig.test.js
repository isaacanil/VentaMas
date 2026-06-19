import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  checkGisysFactHealthMock,
  getDocRef,
  getUserAccessProfileMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  writes,
} = vi.hoisted(() => {
  const hoistedWrites = new Map();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    checkGisysFactHealthMock: vi.fn(),
    getDocRef: (path) => ({
      path,
      set: vi.fn(async (payload, options) => {
        hoistedWrites.set(path, { payload, options });
      }),
    }),
    getUserAccessProfileMock: vi.fn(),
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    writes: hoistedWrites,
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
  getUserAccessProfile: (...args) => getUserAccessProfileMock(...args),
}));

vi.mock('../services/gisysFactClient.service.js', () => ({
  checkGisysFactHealth: (...args) => checkGisysFactHealthMock(...args),
}));

import { updateElectronicTaxReceiptPlatformConfig } from './updateElectronicTaxReceiptPlatformConfig.js';

describe('updateElectronicTaxReceiptPlatformConfig', () => {
  beforeEach(() => {
    writes.clear();
    vi.clearAllMocks();
    delete process.env.GISYS_FACT_CLIENT_TOKEN;
    resolveCallableAuthUidMock.mockResolvedValue('dev-1');
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'dev',
    });
    checkGisysFactHealthMock.mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://gisys.example/v1/health',
    });
  });

  it('saves platform GISYS config without business or taxpayer fields', async () => {
    process.env.GISYS_FACT_CLIENT_TOKEN = 'secret-token';

    const result = await updateElectronicTaxReceiptPlatformConfig({
      data: {
        baseUrl: 'https://gisys.example/api/v1',
        integrationInstanceCode: 'ventamax-global-test',
        electronicModelEnabled: true,
        mode: 'required',
        timeoutMs: 45000,
        checkRemote: true,
      },
    });

    const write = writes.get('platformConfig/gisysFact');
    expect(result.runtime.configSource).toBe('firestore');
    expect(result.runtime.integrationInstanceCode).toBe('ventamax-global-test');
    expect(write.options).toEqual({ merge: true });
    expect(write.payload).toMatchObject({
      provider: 'gisys',
      providerId: 'gisys_fact',
      baseUrl: 'https://gisys.example/api/v1',
      integrationInstanceCode: 'ventamax-global-test',
      electronicModelEnabled: true,
      electronicTransportEnabled: true,
      mode: 'required',
      timeoutMs: 45000,
      updatedAt: 'SERVER_TIMESTAMP',
      updatedBy: 'dev-1',
    });
    expect(write.payload.taxpayerCode).toBeUndefined();
    expect(write.payload.businessId).toBeUndefined();
    expect(checkGisysFactHealthMock).toHaveBeenCalledWith({
      config: expect.objectContaining({
        baseUrl: 'https://gisys.example/api/v1',
        integrationInstanceCode: 'ventamax-global-test',
        mode: 'required',
      }),
    });
  });

  it('keeps platform normalization for mode, timeout, and boolean fields', async () => {
    const enabledResult = await updateElectronicTaxReceiptPlatformConfig({
      data: {
        baseUrl: '  https://gisys.example/api/v1  ',
        integrationInstanceCode: '  ventamax-global-test  ',
        electronicModelEnabled: true,
        mode: 'unsupported',
        timeoutMs: '45000.4',
      },
    });

    const enabledWrite = writes.get('platformConfig/gisysFact');
    expect(enabledResult.runtime.mode).toBe('shadow');
    expect(enabledWrite.payload).toMatchObject({
      baseUrl: 'https://gisys.example/api/v1',
      integrationInstanceCode: 'ventamax-global-test',
      electronicModelEnabled: true,
      electronicTransportEnabled: false,
      mode: 'shadow',
      timeoutMs: 45000,
    });

    const disabledResult = await updateElectronicTaxReceiptPlatformConfig({
      data: {
        integrationInstanceCode: 'ventamax-global-test',
        electronicModelEnabled: 'true',
        mode: 'required',
        timeoutMs: 3000,
      },
    });

    const disabledWrite = writes.get('platformConfig/gisysFact');
    expect(disabledResult.runtime.electronicPreparationEnabled).toBe(false);
    expect(disabledWrite.payload).toMatchObject({
      electronicModelEnabled: false,
      electronicTransportEnabled: false,
      mode: 'shadow',
      timeoutMs: 90000,
    });
  });

  it('blocks non-developer users', async () => {
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      rootRole: 'admin',
    });

    await expect(
      updateElectronicTaxReceiptPlatformConfig({
        data: {
          integrationInstanceCode: 'ventamax-global-test',
          electronicModelEnabled: true,
          mode: 'shadow',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
});
