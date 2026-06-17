import { describe, expect, it } from 'vitest';

import {
  canCreateFinancialEffectsForAdjustmentNote,
  resolveElectronicAdjustmentNoteFiscalStatus,
} from './customerAdjustmentNoteFiscalStatus.util.js';

describe('customerAdjustmentNoteFiscalStatus.util', () => {
  it('does not let not_checked override an accepted GISYS/DGII status', () => {
    const note = {
      ncf: 'E330000000004',
      electronicTaxReceipt: {
        dgiiValidationStatus: 'not_checked',
        dgiiStatus: 'accepted',
        requestStatus: 'accepted',
        status: 'accepted',
      },
    };

    expect(resolveElectronicAdjustmentNoteFiscalStatus(note)).toBe('accepted');
    expect(
      canCreateFinancialEffectsForAdjustmentNote(note, { ncfPrefix: 'E33' }),
    ).toBe(true);
  });

  it('keeps a terminal DGII rejection non-postable', () => {
    const note = {
      ncf: 'E340000000002',
      electronicTaxReceipt: {
        dgiiValidationStatus: 'rejected',
        dgiiStatus: 'accepted',
        status: 'accepted',
      },
    };

    expect(resolveElectronicAdjustmentNoteFiscalStatus(note)).toBe('rejected');
    expect(
      canCreateFinancialEffectsForAdjustmentNote(note, { ncfPrefix: 'E34' }),
    ).toBe(false);
  });

  it('allows accepted conditional adjustment notes', () => {
    const note = {
      ncf: 'E340000000003',
      electronicTaxReceipt: {
        status: 'accepted_conditional',
      },
    };

    expect(
      canCreateFinancialEffectsForAdjustmentNote(note, { ncfPrefix: 'E34' }),
    ).toBe(true);
  });

  it('blocks submitted or not checked adjustment notes', () => {
    const note = {
      ncf: 'E330000000005',
      electronicTaxReceipt: {
        dgiiValidationStatus: 'not_checked',
        dgiiSubmissionStatus: 'submitted',
        status: 'issued',
      },
    };

    expect(resolveElectronicAdjustmentNoteFiscalStatus(note)).toBe('issued');
    expect(
      canCreateFinancialEffectsForAdjustmentNote(note, { ncfPrefix: 'E33' }),
    ).toBe(false);
  });
});
