import { describe, expect, it } from 'vitest';

import { resolveModuleMeta } from './moduleMeta';

type ModuleMetaRequest = Parameters<typeof resolveModuleMeta>[0];

type ResolveModuleMetaCase = {
  name: string;
  request: ModuleMetaRequest;
  expectedIconName: string;
  expectedModuleKey: string;
};

const cases: ResolveModuleMetaCase[] = [
  {
    name: 'maps cashRegister to the accountsReceivable meta',
    request: { module: 'cashRegister' },
    expectedIconName: 'cash-register',
    expectedModuleKey: 'accountsReceivable',
  },
  {
    name: 'maps invoiceEditAuthorizations to the invoices meta',
    request: { collectionKey: 'invoiceEditAuthorizations' },
    expectedIconName: 'file-invoice-dollar',
    expectedModuleKey: 'invoices',
  },
  {
    name: 'uses metadata.module before type and collectionKey',
    request: {
      collectionKey: 'invoiceEditAuthorizations',
      metadata: { module: 'creditNotes' },
      type: 'cashRegister',
    },
    expectedIconName: 'file-invoice',
    expectedModuleKey: 'creditNotes',
  },
  {
    name: 'falls back to the invoices meta when invoiceId is present',
    request: { invoiceId: 'invoice-1' },
    expectedIconName: 'file-invoice-dollar',
    expectedModuleKey: 'invoices',
  },
  {
    name: 'falls back to the generic meta for unknown modules',
    request: { module: 'unknownModule' },
    expectedIconName: 'clipboard-list',
    expectedModuleKey: 'generic',
  },
];

describe('resolveModuleMeta', () => {
  it.each(cases)('$name', ({ request, expectedIconName, expectedModuleKey }) => {
    expect(resolveModuleMeta(request)).toMatchObject({
      moduleKey: expectedModuleKey,
      icon: expect.objectContaining({
        iconName: expectedIconName,
      }),
    });
  });
});
