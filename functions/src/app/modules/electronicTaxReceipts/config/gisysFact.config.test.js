import { describe, expect, it } from 'vitest';

import {
  getGisysFactConfigIssues,
  resolveGisysFactConfig,
} from './gisysFact.config.js';

describe('gisysFact.config', () => {
  it('uses a production-safe default timeout for GISYS issue calls', () => {
    expect(resolveGisysFactConfig({}).timeoutMs).toBe(90000);
  });

  it('does not require transport fields while preparing shadow payloads', () => {
    expect(
      getGisysFactConfigIssues(
        {
          enabled: true,
          integrationInstanceCode: 'vm-local',
          taxpayerCode: '132619201',
          tokenEnvName: 'GISYS_FACT_CLIENT_TOKEN',
        },
        { requireTransport: false },
      ),
    ).toEqual([]);
  });

  it('requires platform base URL when transport is active', () => {
    expect(
      getGisysFactConfigIssues(
        {
          enabled: true,
          integrationInstanceCode: 'vm-local',
          taxpayerCode: '132619201',
        },
        { requireTransport: true },
      ),
    ).toEqual(['missing-base-url']);
  });

  it('keeps runtime values owned by platform env before legacy business overrides', () => {
    const originalBaseUrl = process.env.GISYS_FACT_BASE_URL;
    const originalTimeout = process.env.GISYS_FACT_TIMEOUT_MS;
    const originalTokenEnvName = process.env.GISYS_FACT_TOKEN_ENV_NAME;

    process.env.GISYS_FACT_BASE_URL = 'https://platform.gisys.example/api/v1';
    process.env.GISYS_FACT_TIMEOUT_MS = '45000';
    process.env.GISYS_FACT_TOKEN_ENV_NAME = 'GISYS_FACT_CLIENT_TOKEN';

    try {
      expect(
        resolveGisysFactConfig({
          features: {
            fiscal: {
              gisysFact: {
                baseUrl: 'https://legacy-business.example/api/v1',
                timeoutMs: 5000,
                tokenEnvName: 'LEGACY_BUSINESS_SECRET',
                integrationInstanceCode: 'vm-local',
                taxpayerCode: '132619201',
              },
            },
          },
        }),
      ).toMatchObject({
        baseUrl: 'https://platform.gisys.example/api/v1',
        timeoutMs: 45000,
        tokenEnvName: 'GISYS_FACT_CLIENT_TOKEN',
        integrationInstanceCode: 'vm-local',
        taxpayerCode: '132619201',
      });
    } finally {
      if (originalBaseUrl == null) {
        delete process.env.GISYS_FACT_BASE_URL;
      } else {
        process.env.GISYS_FACT_BASE_URL = originalBaseUrl;
      }
      if (originalTimeout == null) {
        delete process.env.GISYS_FACT_TIMEOUT_MS;
      } else {
        process.env.GISYS_FACT_TIMEOUT_MS = originalTimeout;
      }
      if (originalTokenEnvName == null) {
        delete process.env.GISYS_FACT_TOKEN_ENV_NAME;
      } else {
        process.env.GISYS_FACT_TOKEN_ENV_NAME = originalTokenEnvName;
      }
    }
  });

  it('uses platform Firestore config before env and keeps taxpayer business-scoped', () => {
    const originalBaseUrl = process.env.GISYS_FACT_BASE_URL;
    const originalInstance = process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE;
    const originalMode = process.env.GISYS_FACT_MODE;

    process.env.GISYS_FACT_BASE_URL = 'https://env.gisys.example/api/v1';
    process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE = 'env-instance';
    process.env.GISYS_FACT_MODE = 'pilot';

    try {
      expect(
        resolveGisysFactConfig(
          {
            features: {
              fiscal: {
                gisysFact: {
                  integrationInstanceCode: 'legacy-business-instance',
                  taxpayerCode: 'business-taxpayer',
                },
              },
            },
          },
          {
            baseUrl: 'https://platform-doc.gisys.example/api/v1',
            integrationInstanceCode: 'platform-doc-instance',
            electronicModelEnabled: true,
            mode: 'required',
          },
        ),
      ).toMatchObject({
        baseUrl: 'https://platform-doc.gisys.example/api/v1',
        integrationInstanceCode: 'platform-doc-instance',
        taxpayerCode: 'business-taxpayer',
        electronicModelEnabled: true,
        electronicTransportEnabled: true,
        mode: 'required',
      });
    } finally {
      if (originalBaseUrl == null) {
        delete process.env.GISYS_FACT_BASE_URL;
      } else {
        process.env.GISYS_FACT_BASE_URL = originalBaseUrl;
      }
      if (originalInstance == null) {
        delete process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE;
      } else {
        process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE = originalInstance;
      }
      if (originalMode == null) {
        delete process.env.GISYS_FACT_MODE;
      } else {
        process.env.GISYS_FACT_MODE = originalMode;
      }
    }
  });
});
