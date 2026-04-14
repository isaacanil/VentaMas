import { describe, expect, it } from 'vitest';

import {
  resolveBusinessFiscalRollout,
  resolveBusinessFiscalTaxationPolicy,
  shouldUseBackendFiscalSequence,
} from './fiscalRollout';

describe('fiscalRollout', () => {
  it('usa defaults seguros cuando el negocio no tiene rollout fiscal', () => {
    expect(resolveBusinessFiscalRollout(null)).toEqual({
      domainV2Enabled: false,
      sequenceEngineV2Enabled: false,
      reportingEnabled: false,
      monthlyComplianceEnabled: false,
      electronicModelEnabled: false,
      electronicTransportEnabled: false,
      taxationEnabled: true,
    });
  });

  it('mantiene el comportamiento legacy de impuestos cuando domainV2 esta apagado', () => {
    expect(
      resolveBusinessFiscalTaxationPolicy({
        business: {
          features: {
            fiscal: {
              taxationEnabled: true,
            },
          },
        },
        taxReceiptEnabled: false,
      }),
    ).toMatchObject({
      documentaryEnabled: false,
      taxationEnabled: false,
      source: 'legacy-tax-receipt',
    });
  });

  it('usa la politica fiscal del negocio cuando domainV2 esta activo', () => {
    expect(
      resolveBusinessFiscalTaxationPolicy({
        business: {
          features: {
            fiscal: {
              domainV2Enabled: true,
              taxationEnabled: true,
              sequenceEngineV2Enabled: true,
            },
          },
        },
        taxReceiptEnabled: false,
      }),
    ).toMatchObject({
      documentaryEnabled: false,
      taxationEnabled: true,
      source: 'business-fiscal',
    });

    expect(
      shouldUseBackendFiscalSequence({
        features: { fiscal: { sequenceEngineV2Enabled: true } },
      }),
    ).toBe(true);
  });
});
