import { describe, expect, it } from 'vitest';

import {
  isFrontendFeatureEnabled,
  isLoginDevModeEnabledHost,
  isRestrictedProductionHost,
} from './frontendFeatureAccess';

describe('frontendFeatureAccess', () => {
  it('blocks gated features on the production web host', () => {
    expect(isRestrictedProductionHost('ventamax.web.app')).toBe(true);
    expect(
      isFrontendFeatureEnabled('userRegistration', 'ventamax.web.app'),
    ).toBe(false);
    expect(
      isFrontendFeatureEnabled('businessCreation', 'ventamax.web.app'),
    ).toBe(false);
    expect(
      isFrontendFeatureEnabled('subscriptionManagement', 'ventamax.web.app'),
    ).toBe(false);
    expect(
      isFrontendFeatureEnabled('invoiceTemplateV2Beta', 'ventamax.web.app'),
    ).toBe(false);
  });

  it('keeps the same features enabled on staging and localhost', () => {
    expect(
      isFrontendFeatureEnabled('userRegistration', 'ventamaxpos-staging.web.app'),
    ).toBe(true);
    expect(isFrontendFeatureEnabled('businessCreation', 'localhost')).toBe(
      true,
    );
    expect(
      isFrontendFeatureEnabled('subscriptionManagement', '127.0.0.1'),
    ).toBe(true);
    expect(
      isFrontendFeatureEnabled('invoiceTemplateV2Beta', 'localhost'),
    ).toBe(true);
    expect(
      isFrontendFeatureEnabled(
        'invoiceTemplateV2Beta',
        'ventamaxpos-staging.web.app',
      ),
    ).toBe(true);
  });

  it('keeps invoice template beta disabled on non-whitelisted public hosts', () => {
    expect(
      isFrontendFeatureEnabled('invoiceTemplateV2Beta', 'preview.ventamax.app'),
    ).toBe(false);
    expect(
      isFrontendFeatureEnabled('invoiceTemplateV2Beta', 'example.com'),
    ).toBe(false);
  });

  it('enables login dev mode only on localhost and staging hosts', () => {
    expect(isLoginDevModeEnabledHost('localhost')).toBe(true);
    expect(isLoginDevModeEnabledHost('127.0.0.1')).toBe(true);
    expect(isLoginDevModeEnabledHost('ventamaxpos-staging.web.app')).toBe(
      true,
    );
    expect(isLoginDevModeEnabledHost('ventamax.web.app')).toBe(false);
  });
});
