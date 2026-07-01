import { describe, expect, it } from 'vitest';

import type { AccountsPayableRow } from './accountsPayableDashboard';
import {
  getAccountsPayableControlActions,
  isAccountsPayableControlActionEvidenceRequired,
} from './accountsPayableControlActions';

const buildRow = (
  status: AccountsPayableRow['paymentControl']['status'],
  overrides: Partial<AccountsPayableRow> = {},
): AccountsPayableRow =>
  ({
    paymentControl: {
      canRegisterPayment: status === 'payable',
      label: status,
      reason: null,
      status,
      tone: status === 'payable' ? 'success' : 'neutral',
    },
    paidAmount: 0,
    paymentCount: 0,
    ...overrides,
  }) as AccountsPayableRow;

describe('accountsPayableControlActions', () => {
  it('offers approval decisions when the bill is pending approval', () => {
    expect(
      getAccountsPayableControlActions(buildRow('pending_approval')).map(
        (definition) => definition.action,
      ),
    ).toEqual(['approve', 'reject', 'place_hold', 'open_dispute', 'void']);
  });

  it('offers release when the bill is on hold', () => {
    expect(
      getAccountsPayableControlActions(buildRow('on_hold')).map(
        (definition) => definition.action,
      ),
    ).toEqual(['release_hold', 'open_dispute', 'void']);
  });

  it('offers dispute resolution when the bill is disputed', () => {
    expect(
      getAccountsPayableControlActions(buildRow('disputed')).map(
        (definition) => definition.action,
      ),
    ).toEqual(['resolve_dispute', 'place_hold', 'void']);
  });

  it('offers void for unpaid payable rows and hides it when payments exist', () => {
    expect(
      getAccountsPayableControlActions(buildRow('payable')).map(
        (definition) => definition.action,
      ),
    ).toEqual(['request_approval', 'place_hold', 'open_dispute', 'void']);

    expect(
      getAccountsPayableControlActions(
        buildRow('payable', { paidAmount: 25, paymentCount: 1 }),
      ).map((definition) => definition.action),
    ).toEqual(['request_approval', 'place_hold', 'open_dispute']);
  });

  it('does not offer control actions for closed payable rows', () => {
    expect(getAccountsPayableControlActions(buildRow('closed'))).toEqual([]);
  });

  it('requires evidence for every payment-eligibility control decision', () => {
    expect(isAccountsPayableControlActionEvidenceRequired('approve')).toBe(
      true,
    );
    expect(isAccountsPayableControlActionEvidenceRequired('reject')).toBe(true);
    expect(isAccountsPayableControlActionEvidenceRequired('place_hold')).toBe(
      true,
    );
    expect(isAccountsPayableControlActionEvidenceRequired('release_hold')).toBe(
      true,
    );
    expect(isAccountsPayableControlActionEvidenceRequired('open_dispute')).toBe(
      true,
    );
    expect(
      isAccountsPayableControlActionEvidenceRequired('resolve_dispute'),
    ).toBe(true);
    expect(isAccountsPayableControlActionEvidenceRequired('void')).toBe(true);
    expect(
      isAccountsPayableControlActionEvidenceRequired('request_approval'),
    ).toBe(false);
  });

  it('labels positive control references as required evidence', () => {
    expect(
      getAccountsPayableControlActions(buildRow('pending_approval'))[0],
    ).toMatchObject({
      action: 'approve',
      evidenceLabel: 'Referencia de aprobación',
      requiresEvidence: true,
    });
    expect(
      getAccountsPayableControlActions(buildRow('on_hold'))[0],
    ).toMatchObject({
      action: 'release_hold',
      evidenceLabel: 'Referencia de liberación',
      requiresEvidence: true,
    });
    expect(
      getAccountsPayableControlActions(buildRow('disputed'))[0],
    ).toMatchObject({
      action: 'resolve_dispute',
      evidenceLabel: 'Referencia de resolución',
      requiresEvidence: true,
    });
  });

  it('does not require evidence to request approval', () => {
    expect(
      getAccountsPayableControlActions(buildRow('payable'))[0],
    ).toMatchObject({
      action: 'request_approval',
      requiresEvidence: false,
    });
    expect(
      isAccountsPayableControlActionEvidenceRequired('request_approval'),
    ).toBe(false);
  });

  it('labels void as a destructive evidence-required action', () => {
    expect(
      getAccountsPayableControlActions(buildRow('payable')).at(-1),
    ).toMatchObject({
      action: 'void',
      label: 'Anular CxP',
      requiresEvidence: true,
      tone: 'danger',
    });
  });
});
