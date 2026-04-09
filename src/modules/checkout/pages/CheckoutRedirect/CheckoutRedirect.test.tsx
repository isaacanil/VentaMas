import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cardnetProviderAdapter } from '../../../../../functions/src/app/versions/v2/billing/adapters/cardnet.provider.js';

vi.mock('antd', () => ({
  Spin: (props: Record<string, unknown>) => (
    <div data-testid="spin" {...props} />
  ),
  Typography: {
    Title: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  },
}));

const getHiddenInput = (
  container: HTMLElement,
  name: string,
): HTMLInputElement | null =>
  container.querySelector(`input[type="hidden"][name="${name}"]`);

describe('Checkout integration (adapter + redirect proxy)', () => {
  beforeEach(() => {
    vi.stubEnv(
      'BILLING_CARDNET_AUTHORIZE_URL',
      'https://labservicios.cardnet.com.do/authorize',
    );
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('creates a checkout session for CardNET QA and keeps the session-key server side', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          SESSION: 'sess_123',
          'session-key': 'key_abc',
          expiration: '2026-03-03T23:59:59Z',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await cardnetProviderAdapter.createCheckoutSession({
      billingAccountId: 'ba_cardnet',
      businessId: 'biz_cardnet',
      returnUrl: 'https://ventamax.web.app/settings/subscription/plans',
      actorUserId: 'user_cardnet',
      planCode: 'plus',
      currency: 'DOP',
      amount: 1500,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://labservicios.cardnet.com.do/sessions',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result.checkoutSession.gatewaySessionId).toBe('sess_123');
    expect(result.checkoutSession.gatewaySessionKey).toBe('key_abc');

    const url = new URL(result.url);
    expect(url.searchParams.get('provider')).toBe('cardnet');
    expect(url.searchParams.get('SESSION')).toBe('sess_123');
    expect(url.searchParams.get('authorizeUrl')).toBe(
      'https://labservicios.cardnet.com.do/authorize',
    );
    expect(url.searchParams.get('orderNumber')).toMatch(/^CN-/);
  });

  it('uses the return origin as the checkout proxy origin for CardNET', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          SESSION: 'sess_local',
          'session-key': 'key_local',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await cardnetProviderAdapter.createCheckoutSession({
      billingAccountId: 'ba_local',
      businessId: 'biz_local',
      returnUrl: 'http://localhost:5173/account/subscription/plans',
      actorUserId: 'user_local',
      planCode: 'plus',
      currency: 'DOP',
      amount: 1500,
    });

    const url = new URL(result.url);
    expect(`${url.origin}${url.pathname}`).toBe('http://localhost:5173/checkout');
  });

  it('builds CardNET return URLs through the static callback page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          SESSION: 'sess_return',
          'session-key': 'key_return',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await cardnetProviderAdapter.createCheckoutSession({
      billingAccountId: 'ba_return',
      businessId: 'biz_return',
      returnUrl: 'https://ventamaxpos-staging.web.app/account/subscription/plans',
      actorUserId: 'user_return',
      planCode: 'plus',
      currency: 'DOP',
      amount: 1500,
    });

    expect(result.checkoutSession.approvedUrl).toContain(
      '/billing-return.html?billingResult=success&provider=cardnet',
    );
    expect(result.checkoutSession.cancelUrl).toContain(
      '/billing-return.html?billingResult=canceled&provider=cardnet',
    );
    expect(result.checkoutSession.approvedUrl).toContain('orderNumber=CN-');
  });

  it('renders a CardNET hosted form with SESSION and auto-submits to authorize', async () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          SESSION: 'sess_456',
          'session-key': 'key_xyz',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const checkout = await cardnetProviderAdapter.createCheckoutSession({
      billingAccountId: 'ba_001',
      businessId: 'biz_001',
      returnUrl: 'https://ventamax.web.app/settings/subscription',
      actorUserId: 'user_3',
      planCode: 'pro',
      currency: 'DOP',
      amount: 2500,
    });
    const checkoutUrl = new URL(checkout.url);
    const { default: CheckoutRedirect } =
      await import('./CheckoutRedirect');
    vi.useFakeTimers();

    const { container } = render(
      <MemoryRouter initialEntries={[`/checkout${checkoutUrl.search}`]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutRedirect />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/redirigiendo a cardnet/i)).toBeInTheDocument();

    const form = container.querySelector('form');
    expect(form).toHaveAttribute(
      'action',
      'https://labservicios.cardnet.com.do/authorize',
    );
    expect(form).toHaveAttribute('method', 'POST');
    expect(getHiddenInput(container, 'SESSION')).toHaveValue('sess_456');

    await vi.advanceTimersByTimeAsync(1000);

    expect(submitSpy).toHaveBeenCalledTimes(1);
  });
});

