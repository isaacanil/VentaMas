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

  it('treats accepted RFCE as accepted without a standard DGII track', () => {
    const snapshot = {
      status: 'issued',
      eNcf: 'E320000000007',
      requestStatus: 'accepted',
      dgiiSubmissionStatus: 'not_applicable_standard_channel',
      dgiiValidationStatus: 'not_checked',
      dgiiStatus: 'pending',
      routing: {
        channel: 'recepcion_fc',
        rfceToDgii: true,
      },
      rfceStatus: 'accepted',
      rfceSubmissionStatus: 'accepted',
      rfceDgiiCode: 1,
      rfceDgiiEstado: 'Aceptado',
    };

    expect(resolveElectronicTaxReceiptStatusKey(snapshot)).toBe('accepted');
    expect(resolveElectronicTaxReceiptStatusLabel(snapshot)).toBe(
      'Aceptado RFCE',
    );
  });

  it('shows queued RFCE distinctly from a standard DGII pending state', () => {
    const snapshot = {
      status: 'issued',
      eNcf: 'E320000000008',
      localStatus: 'signed_local',
      requestStatus: 'queued',
      dgiiSubmissionStatus: 'queued',
      dgiiValidationStatus: 'not_checked',
      dgiiStatus: 'pending',
      routing: {
        channel: 'recepcion_fc',
        rfceToDgii: true,
      },
    };

    expect(resolveElectronicTaxReceiptStatusKey(snapshot)).toBe('issued');
    expect(resolveElectronicTaxReceiptStatusLabel(snapshot)).toBe(
      'En cola RFCE',
    );
  });

  it('keeps GISYS processing errors visible when DGII has not produced a track', () => {
    const snapshot = {
      status: 'error',
      eNcf: 'E320000000001',
      localStatus: 'signed_local',
      requestStatus: 'error',
      dgiiSubmissionStatus: 'not_applicable_standard_channel',
      dgiiValidationStatus: 'not_checked',
      dgiiStatus: 'pending',
      rfceLastErrorMessage:
        'XML_BUILD_CONTRACT_ERROR: RFCE.Encabezado.Totales.MontoGravadoTotal valor no cumple pattern del XSD',
    };

    expect(resolveElectronicTaxReceiptStatusKey(snapshot)).toBe('error');
    expect(resolveElectronicTaxReceiptStatusLabel(snapshot)).toBe(
      'Error GISYS',
    );
  });
});
