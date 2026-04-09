import { describe, expect, it } from 'vitest';

import { isPreorderDocument } from '@/utils/invoice/documentIdentity';

describe('isPreorderDocument', () => {
  it('treats corrupted boolean status as preorder when invoice is marked as preorder and has no NCF', () => {
    expect(
      isPreorderDocument({
        type: 'preorder',
        // legacy corrupted status
        status: true as any,
        preorderDetails: { isOrWasPreorder: true, numberID: 123 },
        NCF: '',
      }),
    ).toBe(true);
  });

  it('does not treat completed docs as preorder', () => {
    expect(
      isPreorderDocument({
        type: 'preorder',
        status: 'completed',
        preorderDetails: { isOrWasPreorder: true, numberID: 123 },
        NCF: '',
      }),
    ).toBe(false);
  });
});

