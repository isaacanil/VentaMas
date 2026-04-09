import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { isAccountingRolloutEnabledForBusiness } from '@/utils/accounting/monetary';
import {
  defaultBankPaymentPolicy,
  normalizeBankPaymentPolicy,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';

interface AccountingBankingSettingsSnapshot {
  rolloutEnabled: boolean;
  bankAccountsEnabled: boolean;
  bankPaymentPolicy: BankPaymentPolicy;
}

interface AccountingBankingSettingsSnapshotState
  extends AccountingBankingSettingsSnapshot {
  businessId: string;
}

const defaultAccountingBankingSettings =
  (
    businessId?: string | null,
  ): AccountingBankingSettingsSnapshot => ({
    rolloutEnabled: isAccountingRolloutEnabledForBusiness(businessId),
    bankAccountsEnabled: true,
    bankPaymentPolicy: defaultBankPaymentPolicy(),
  });

export const useAccountingBankingSettings = (
  businessId: string | null | undefined,
  isEnabled: boolean,
): AccountingBankingSettingsSnapshot => {
  const [snapshotSettings, setSnapshotSettings] =
    useState<AccountingBankingSettingsSnapshotState | null>(null);
  const fallbackSettings = defaultAccountingBankingSettings(businessId);

  useEffect(() => {
    if (!isEnabled || !businessId) {
      return undefined;
    }

    const settingsRef = doc(
      db,
      'businesses',
      businessId,
      'settings',
      'accounting',
    );

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        setSnapshotSettings({
          businessId,
          rolloutEnabled: isAccountingRolloutEnabledForBusiness(
            businessId,
            snapshot.data(),
          ),
          bankAccountsEnabled: snapshot.data()?.bankAccountsEnabled !== false,
          bankPaymentPolicy: normalizeBankPaymentPolicy(
            snapshot.data()?.bankPaymentPolicy,
          ),
        });
      },
      () => {
        setSnapshotSettings({
          businessId,
          ...defaultAccountingBankingSettings(businessId),
        });
      },
    );

    return unsubscribe;
  }, [businessId, isEnabled]);

  if (!isEnabled || !businessId) {
    return fallbackSettings;
  }

  return snapshotSettings?.businessId === businessId
    ? snapshotSettings
    : fallbackSettings;
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
