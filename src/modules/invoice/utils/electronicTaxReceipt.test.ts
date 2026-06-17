import { describe, expect, it } from 'vitest';

import {
  resolveElectronicTaxReceiptDiagnosticText,
  resolveElectronicTaxReceiptStatusDisplay,
  resolveElectronicTaxReceiptStatusKey,
  resolveElectronicTaxReceiptStatusLabel,
} from './electronicTaxReceipt';

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

  it('uses adjustment note fallback statuses when there is no electronic snapshot yet', () => {
    expect(
      resolveElectronicTaxReceiptStatusDisplay(null, 'electronic_pending'),
    ).toEqual({ label: 'Pendiente e-CF', color: 'gold' });
    expect(
      resolveElectronicTaxReceiptStatusDisplay(null, 'electronic_failed'),
    ).toEqual({ label: 'e-CF Fallido', color: 'red' });
    expect(resolveElectronicTaxReceiptStatusDisplay(null, 'issued')).toBeNull();
  });

  it('prioritizes the provider snapshot over a legacy fallback status', () => {
    const snapshot = {
      status: 'issued',
      eNcf: 'E340000000004',
      dgiiValidationStatus: 'accepted',
    };

    expect(
      resolveElectronicTaxReceiptStatusDisplay(snapshot, 'electronic_pending'),
    ).toEqual({ label: 'Aceptado', color: 'green' });
  });

  it('builds a compact diagnostic text for rejected electronic receipts', () => {
    const snapshot = {
      status: 'rejected',
      dgiiMessage: 'Documento rechazado',
      dgiiMessages: [
        { code: 'E001', message: 'RNC inválido' },
        { code: 'E001', message: 'RNC inválido' },
      ],
      resolutionAction: 'data_correction',
      requiresDataCorrection: true,
      requiresNewENcf: true,
      dgiiCode: 'E99',
      trackId: 'track-1',
      submissionId: 'sub-1',
    };

    expect(resolveElectronicTaxReceiptDiagnosticText(snapshot)).toBe(
      'Documento rechazado | E001: RNC inválido | Acción sugerida: data_correction | Requiere corregir datos antes de reenviar. | Requiere emitir con un e-NCF nuevo. | Código DGII: E99 | TrackID: track-1 | Submission GISYS: sub-1',
    );
  });

  it('shows trace identifiers for rejected legacy snapshots without messages', () => {
    const snapshot = {
      status: 'rejected',
      submissionId: 'sub-legacy',
      trackId: 'track-legacy',
    };

    expect(resolveElectronicTaxReceiptDiagnosticText(snapshot)).toBe(
      'TrackID: track-legacy | Submission GISYS: sub-legacy',
    );
  });

  it('shows trace identifiers when DGII rejects an issued lifecycle snapshot', () => {
    const snapshot = {
      status: 'issued',
      dgiiValidationStatus: 'rejected',
      dgiiCode: 'E42',
      submissionId: 'sub-rejected',
      trackId: 'track-rejected',
    };

    expect(resolveElectronicTaxReceiptDiagnosticText(snapshot)).toBe(
      'Código DGII: E42 | TrackID: track-rejected | Submission GISYS: sub-rejected',
    );
  });
});
