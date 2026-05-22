import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: class Timestamp {},
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: {},
}));

import { resolveBusinessPayload } from './fbGetBusinessInfo';

describe('resolveBusinessPayload', () => {
  it('keeps root fiscal feature flags when nested business features exist', () => {
    const result = resolveBusinessPayload({
      name: 'Root name',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: false,
          gisysFact: {
            mode: 'shadow',
            integrationInstanceCode: 'ventamax-0001-test',
            taxpayerCode: 'rncTest00201441797',
          },
        },
      },
      business: {
        name: 'Nested name',
        features: {
          fiscal: {
            legacyFiscalFlag: true,
          },
          sales: {
            enabled: true,
          },
        },
      },
    });

    expect(result).toMatchObject({
      name: 'Nested name',
      features: {
        fiscal: {
          legacyFiscalFlag: true,
          electronicModelEnabled: true,
          electronicTransportEnabled: false,
          gisysFact: {
            mode: 'shadow',
            integrationInstanceCode: 'ventamax-0001-test',
            taxpayerCode: 'rncTest00201441797',
          },
        },
        sales: {
          enabled: true,
        },
      },
    });
  });
});
