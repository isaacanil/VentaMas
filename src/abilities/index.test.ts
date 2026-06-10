import { PureAbility } from '@casl/ability';
import { describe, expect, it } from 'vitest';

import { defineAbilitiesFor } from './index';

const canReadAccounting = (role: string): boolean =>
  new PureAbility(defineAbilitiesFor({ role })).can('accountingRead', 'all');

describe('defineAbilitiesFor accounting access', () => {
  it.each([
    'owner',
    'admin',
    'dev',
    'manager',
    'accountant',
    'controller',
    'auditor',
  ])('grants accounting read access to %s', (role) => {
    expect(canReadAccounting(role)).toBe(true);
  });

  it.each(['cashier', 'buyer'])(
    'does not grant accounting read access to %s',
    (role) => {
      expect(canReadAccounting(role)).toBe(false);
    },
  );
});
