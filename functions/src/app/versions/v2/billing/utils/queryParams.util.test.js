import { describe, expect, it } from 'vitest';

import { appendQueryParams } from './queryParams.util.js';

describe('queryParams.util', () => {
  describe('appendQueryParams', () => {
    it('appends query params to a URL without existing search params', () => {
      expect(
        appendQueryParams('https://example.test/checkout', {
          provider: 'manual',
          businessId: 'business-1',
          amount: 1500,
        }),
      ).toBe(
        'https://example.test/checkout?provider=manual&businessId=business-1&amount=1500',
      );
    });

    it('preserves existing query params and hash fragments', () => {
      expect(
        appendQueryParams('https://example.test/checkout?existing=1#resume', {
          provider: 'azul',
          planCode: 'pro',
        }),
      ).toBe(
        'https://example.test/checkout?existing=1&provider=azul&planCode=pro#resume',
      );
    });

    it('replaces existing query params with matching keys', () => {
      expect(
        appendQueryParams('https://example.test/checkout?provider=old', {
          provider: 'cardnet',
        }),
      ).toBe('https://example.test/checkout?provider=cardnet');
    });

    it('returns the URL unchanged when params are null or empty', () => {
      const baseUrl = 'https://example.test/checkout?existing=1';

      expect(appendQueryParams(baseUrl, null)).toBe(baseUrl);
      expect(appendQueryParams(baseUrl, undefined)).toBe(baseUrl);
      expect(appendQueryParams(baseUrl, {})).toBe(baseUrl);
    });

    it('skips nullish values and preserves explicit empty values', () => {
      expect(
        appendQueryParams('https://example.test/checkout', {
          billingAccountId: null,
          businessId: undefined,
          planCode: '',
          retry: false,
          count: 0,
        }),
      ).toBe('https://example.test/checkout?planCode=&retry=false&count=0');
    });
  });
});
