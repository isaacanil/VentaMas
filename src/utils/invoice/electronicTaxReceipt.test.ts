import { describe, expect, it } from 'vitest';

import {
  resolveElectronicTaxReceiptStatusKey,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/utils/invoice/electronicTaxReceipt';

describe('electronicTaxReceipt status helpers', () => {
  it('keeps issued as the visible status while DGII validation is pending', () => {
    const snapshot = {
      status: 'not_checked',
      eNcf: 'E320000000001',
      localStatus: 'signed_local',
      requestStatus: 'queued',
      dgiiSubmissionStatus: 'queued',
      dgiiStatus: 'pending',
      dgiiValidationStatus: 'not_checked',
      links: {
        xml: 'https://api.gisys.net/v1/ecf/sub-1/xml',
      },
    };

    expect(resolveElectronicTaxReceiptStatusKey(snapshot)).toBe('issued');
    expect(resolveElectronicTaxReceiptStatusLabel(snapshot)).toBe(
      'Emitido (DGII pendiente)',
    );
  });

  it('promotes accepted DGII validation over the lifecycle status', () => {
    const snapshot = {
      status: 'issued',
      eNcf: 'E320000000001',
      dgiiValidationStatus: 'accepted',
    };

    expect(resolveElectronicTaxReceiptStatusKey(snapshot)).toBe('accepted');
    expect(resolveElectronicTaxReceiptStatusLabel(snapshot)).toBe('Aceptado');
  });
});
