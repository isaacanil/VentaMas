import { isAccountingRolloutEnabledForBusiness } from '@/utils/accounting/monetary';
import {
  defaultBankPaymentPolicy,
  normalizeBankPaymentPolicy,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';

import {
  toCleanBusinessId,
  useAccountingSettingsSnapshot,
} from './useAccountingSettingsSnapshot';

export interface AccountingBankingSettingsSnapshot {
  rolloutEnabled: boolean;
  bankAccountsEnabled: boolean;
  bankPaymentPolicy: BankPaymentPolicy;
}

const defaultAccountingBankingSettings =
  (
    businessId?: string | null,
  ): AccountingBankingSettingsSnapshot => ({
    rolloutEnabled: isAccountingRolloutEnabledForBusiness(businessId),
    bankAccountsEnabled: true,
    bankPaymentPolicy: defaultBankPaymentPolicy(),
  });

export const resolveAccountingBankingSettings = (
  businessId: string | null | undefined,
  settings: Record<string, unknown> | null,
): AccountingBankingSettingsSnapshot => ({
  rolloutEnabled: isAccountingRolloutEnabledForBusiness(businessId, settings),
  bankAccountsEnabled: settings?.bankAccountsEnabled !== false,
  bankPaymentPolicy: normalizeBankPaymentPolicy(settings?.bankPaymentPolicy),
});

export const useAccountingBankingSettings = (
  businessId: string | null | undefined,
  isEnabled: boolean,
): AccountingBankingSettingsSnapshot => {
  const normalizedBusinessId = toCleanBusinessId(businessId);
  const fallbackSettings =
    defaultAccountingBankingSettings(normalizedBusinessId);
  const settingsSnapshot = useAccountingSettingsSnapshot(
    normalizedBusinessId,
    isEnabled,
  );

  if (!isEnabled || !normalizedBusinessId) {
    return fallbackSettings;
  }

  if (settingsSnapshot.status !== 'ready') {
    return fallbackSettings;
  }

  return resolveAccountingBankingSettings(
    normalizedBusinessId,
    settingsSnapshot.data,
  );
};

export const useAccountingBankPaymentPolicy = (
  businessId: string | null | undefined,
  isEnabled: boolean,
): BankPaymentPolicy =>
  useAccountingBankingSettings(businessId, isEnabled).bankPaymentPolicy;

export const useAccountingBankAccountsEnabled = (
  businessId: string | null | undefined,
  isEnabled: boolean,
): boolean =>
  useAccountingBankingSettings(businessId, isEnabled).bankAccountsEnabled;
