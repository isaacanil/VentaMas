import { describe, expect, it } from 'vitest';

import { toCleanString } from './billingCommon.util.js';

describe('billingCommon.util', () => {
  it('preserves the toCleanString export for billing consumers', () => {
    expect(toCleanString(' billing-account-1 ')).toBe('billing-account-1');
    expect(toCleanString('   ')).toBeNull();
    expect(toCleanString(123)).toBeNull();
  });
});
