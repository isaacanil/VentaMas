import { describe, expect, it } from 'vitest';

import {
  ACTIVE_SUBSCRIPTION_PROVIDER_ID,
  isSameOriginCheckoutProxyUrl,
  normalizePaymentStatus,
  normalizeNoticeWindowDays,
  resolveOwnership,
  resolvePreferredCheckoutProvider,
  resolveSubscriptionProviderId,
  resolveSubscriptionProviderLabel,
  toMillis,
  validateNoticeWindow,
} from './subscription.utils';
import { buildVersionEditorSeed } from './subscriptionVersioning.utils';

describe('noticeWindowDays normalization', () => {
  it('falls back to 30 when a legacy value is outside the supported options', () => {
    expect(normalizeNoticeWindowDays(21)).toBe(30);
  });

  it('preserves supported options including immediate activation', () => {
    expect(normalizeNoticeWindowDays(0)).toBe(0);
    expect(normalizeNoticeWindowDays(90)).toBe(90);
  });

  it('sanitizes the editor seed when the current version has an unsupported value', () => {
    const seed = buildVersionEditorSeed({
      planCode: 'plus',
      currentVersion: {
        versionId: 'plus-v01-20260303',
        displayName: 'Plus',
        noticeWindowDays: 21,
      },
    });

    expect(seed?.noticeWindowDays).toBe(30);
  });

  it('still rejects unsupported values before submit', () => {
    expect(() => validateNoticeWindow(21)).toThrow(
      'noticeWindowDays solo permite 0, 7, 15, 30 o 90',
    );
  });
});

describe('resolvePreferredCheckoutProvider', () => {
  it('preserves the preferred provider when the backend reports it as implemented', () => {
    expect(
      resolvePreferredCheckoutProvider(' CardNET ', ['manual', 'cardnet']),
    ).toBe('cardnet');
  });

  it('drops stale saved providers that are not implemented in backend', () => {
    expect(resolvePreferredCheckoutProvider('cardnet', ['manual'])).toBe(
      null,
    );
  });

  it('avoids forcing a provider when the backend did not publish the implemented list', () => {
    expect(resolvePreferredCheckoutProvider('manual', null)).toBe(null);
  });
});

describe('resolveSubscriptionProviderId', () => {
  it('forces CardNET for legacy subscription providers in active subscription UI', () => {
    expect(resolveSubscriptionProviderId('azul')).toBe(ACTIVE_SUBSCRIPTION_PROVIDER_ID);
    expect(resolveSubscriptionProviderId('manual')).toBe(ACTIVE_SUBSCRIPTION_PROVIDER_ID);
    expect(resolveSubscriptionProviderId(null)).toBe(ACTIVE_SUBSCRIPTION_PROVIDER_ID);
  });

  it('returns CardNET label for active subscription surfaces', () => {
    expect(resolveSubscriptionProviderLabel('azul')).toBe('CardNET');
  });
});

describe('isSameOriginCheckoutProxyUrl', () => {
  it('accepts checkout URLs in the current origin', () => {
    expect(
      isSameOriginCheckoutProxyUrl(
        'http://localhost:5173/checkout?provider=cardnet',
        'http://localhost:5173',
      ),
    ).toBe(true);
  });

  it('rejects checkout URLs from another origin', () => {
    expect(
      isSameOriginCheckoutProxyUrl(
        'https://ventamax.web.app/checkout?provider=cardnet',
        'http://localhost:5173',
      ),
    ).toBe(false);
  });

  it('rejects non-checkout routes even in the same origin', () => {
    expect(
      isSameOriginCheckoutProxyUrl(
        'http://localhost:5173/settings/subscription',
        'http://localhost:5173',
      ),
    ).toBe(false);
  });
});

describe('subscription helpers', () => {
  it('converts Firestore-like timestamps and ISO strings to milliseconds', () => {
    expect(toMillis({ seconds: 1_735_689_600 })).toBe(1_735_689_600_000);
    expect(toMillis('2026-03-17T00:00:00.000Z')).toBe(1_773_705_600_000);
  });

  it('normalizes successful, pending and failed payment statuses', () => {
    expect(normalizePaymentStatus('approved')).toBe('pagado');
    expect(normalizePaymentStatus('processing')).toBe('pendiente');
    expect(normalizePaymentStatus('declined')).toBe('fallido');
    expect(normalizePaymentStatus('cancelled')).toBe('cancelado');
    expect(normalizePaymentStatus('')).toBe('desconocido');
  });

  it('resolves business ownership from owner uid and platform access', () => {
    expect(
      resolveOwnership(
        {
          business: {
            ownerUid: 'owner-1',
          },
        },
        {
          uid: 'owner-1',
          activeBusinessRole: 'admin',
        },
      ),
    ).toEqual({
      isOwner: true,
      isAdmin: true,
      isPlatformDev: false,
    });

    expect(
      resolveOwnership(
        {
          ownerUid: 'owner-2',
        },
        {
          uid: 'dev-1',
          activeRole: 'dev',
          platformRoles: { dev: true },
        },
      ),
    ).toEqual({
      isOwner: false,
      isAdmin: false,
      isPlatformDev: true,
    });
  });
});
