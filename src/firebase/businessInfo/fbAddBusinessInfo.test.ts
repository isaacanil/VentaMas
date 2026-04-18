import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: {},
  functions: {},
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: vi.fn(() => ({})),
}));

import { normalizeBusinessInfoForUpdate } from './fbAddBusinessInfo';

describe('normalizeBusinessInfoForUpdate', () => {
  it('removes stale nested business payload before persisting', () => {
    const result = normalizeBusinessInfoForUpdate({
      name: 'Nuevo nombre',
      email: 'nuevo@demo.com',
      business: {
        name: 'Nombre viejo',
        email: 'viejo@demo.com',
      },
      invoice: {
        invoiceType: 'invoiceTemplate1',
      },
    });

    expect(result).toEqual({
      name: 'Nuevo nombre',
      email: 'nuevo@demo.com',
      invoice: {
        invoiceType: 'invoiceTemplate1',
      },
    });
  });

  it('keeps invoice payload but removes accidental nested business there too', () => {
    const result = normalizeBusinessInfoForUpdate({
      name: 'Demo',
      invoice: {
        invoiceType: 'invoiceTemplate2',
        business: {
          invoiceType: 'invoiceTemplate1',
        },
      },
    });

    expect(result).toEqual({
      name: 'Demo',
      invoice: {
        invoiceType: 'invoiceTemplate2',
      },
    });
  });
});
