import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import type { BankAccount } from '@/types/accounting';
import {
  normalizeBankAccountDraft,
  normalizeBankAccountRecord,
  type BankAccountDraft,
} from '@/utils/accounting/bankAccounts';
import {
  normalizeBankPaymentPolicy,
  syncBankPaymentPolicyDefaultAccount,
  type BankPaymentPolicy,
} from '@/utils/payments/bankPaymentPolicy';
import {
  buildManualRatesByCurrency,
  defaultAccountingSettings,
  getEnabledForeignCurrencies,
  normalizeAccountingHistoryEntry,
  normalizeAccountingSettings,
  normalizeFunctionalCurrency,
  type AccountingSettingsConfig,
  type AccountingCurrencyRateConfig,
  type AccountingSettingsHistoryEntry,
  type SupportedDocumentCurrency,
} from '../utils/accountingConfig';
import {
  deriveExchangeRateReferenceSnapshot,
  normalizeExchangeRateProviderSnapshot,
  type ExchangeRateProviderSnapshot,
} from '../utils/exchangeRateReference';

interface UseAccountingConfigArgs {
  businessId: string | null;
  userId: string | null;
}

interface DirtySectionsState {
  banking: boolean;
  exchange: boolean;
  generalAccounting: boolean;
}

const buildBankAccountSnapshot = ({
  accountNumberLast4,
  bankAccountId,
  businessId,
  currency,
  institutionName,
  metadata,
  name,
  notes,
  openingBalance,
  openingBalanceDate,
  status = 'active',
  type,
}: {
  accountNumberLast4?: string | null;
  bankAccountId: string;
  businessId: string;
  currency: BankAccount['currency'];
  institutionName?: string | null;
  metadata?: Record<string, unknown> | null;
  name: string;
  notes?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: BankAccount['openingBalanceDate'] | null;
  status?: BankAccount['status'];
  type?: BankAccount['type'];
}) => ({
  id: bankAccountId,
  businessId,
  name,
  currency,
  status,
  type: type ?? null,
  institutionName: institutionName ?? null,
  accountNumberLast4: accountNumberLast4 ?? null,
  openingBalance: openingBalance ?? null,
  openingBalanceDate: openingBalanceDate ?? null,
  notes: notes ?? null,
  metadata: metadata ?? {},
});

const pickExchangeSettingsSlice = (
  config: AccountingSettingsConfig,
): Pick<
  AccountingSettingsConfig,
  | 'currentExchangeRateIdsByCurrency'
  | 'documentCurrencies'
  | 'exchangeRateMode'
  | 'functionalCurrency'
  | 'manualRatesByCurrency'
> => ({
  functionalCurrency: config.functionalCurrency,
  documentCurrencies: config.documentCurrencies,
  exchangeRateMode: config.exchangeRateMode,
  manualRatesByCurrency: config.manualRatesByCurrency,
  currentExchangeRateIdsByCurrency: config.currentExchangeRateIdsByCurrency,
});

const pickBankingSettingsSlice = (
  config: AccountingSettingsConfig,
): Pick<
  AccountingSettingsConfig,
  'bankAccountsEnabled' | 'bankPaymentPolicy'
> => ({
  bankAccountsEnabled: config.bankAccountsEnabled,
  bankPaymentPolicy: config.bankPaymentPolicy,
});

const pickGeneralAccountingSlice = (
  config: AccountingSettingsConfig,
): Pick<AccountingSettingsConfig, 'generalAccountingEnabled'> => ({
  generalAccountingEnabled: config.generalAccountingEnabled,
});

const serializeExchangeSettingsForComparison = (
  config: AccountingSettingsConfig,
): string =>
  JSON.stringify({
    functionalCurrency: config.functionalCurrency,
    documentCurrencies: [...config.documentCurrencies].sort(),
    manualRatesByCurrency: Object.fromEntries(
      Object.entries(config.manualRatesByCurrency)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, rates]) => [
          currency,
          {
            buyRate: rates?.buyRate ?? null,
            sellRate: rates?.sellRate ?? null,
          },
        ]),
    ),
  });

const serializeBankingSettingsForComparison = (
  config:
    | Pick<
        AccountingSettingsConfig,
        'bankAccountsEnabled' | 'bankPaymentPolicy'
      >
    | null
    | undefined,
): string => {
  const normalizedPolicy = normalizeBankPaymentPolicy(
    config?.bankPaymentPolicy,
  );

  return JSON.stringify({
    bankAccountsEnabled: config?.bankAccountsEnabled !== false,
    defaultBankAccountId: normalizedPolicy.defaultBankAccountId ?? null,
    card: {
      selectionMode: normalizedPolicy.card.selectionMode,
      defaultBankAccountId: normalizedPolicy.card.defaultBankAccountId ?? null,
    },
    transfer: {
      selectionMode: normalizedPolicy.transfer.selectionMode,
      defaultBankAccountId:
        normalizedPolicy.transfer.defaultBankAccountId ?? null,
    },
    moduleOverrides: Object.fromEntries(
      Object.entries(normalizedPolicy.moduleOverrides).map(
        ([moduleKey, moduleOverride]) => [
          moduleKey,
          {
            enabled: moduleOverride.enabled,
            bankAccountId: moduleOverride.bankAccountId ?? null,
          },
        ],
      ),
    ),
  });
};

const serializeGeneralAccountingSettingsForComparison = (
  config:
    | Pick<AccountingSettingsConfig, 'generalAccountingEnabled'>
    | null
    | undefined,
): string =>
  JSON.stringify({
    generalAccountingEnabled: config?.generalAccountingEnabled === true,
  });

const mergeConfigWithDirtySections = ({
  currentConfig,
  dirtySections,
  persistedConfig,
}: {
  currentConfig: AccountingSettingsConfig;
  dirtySections: DirtySectionsState;
  persistedConfig: AccountingSettingsConfig;
}): AccountingSettingsConfig => ({
  ...persistedConfig,
  ...(dirtySections.exchange ? pickExchangeSettingsSlice(currentConfig) : {}),
  ...(dirtySections.banking ? pickBankingSettingsSlice(currentConfig) : {}),
  ...(dirtySections.generalAccounting
    ? pickGeneralAccountingSlice(currentConfig)
    : {}),
});

export const useAccountingConfig = ({
  businessId,
  userId,
}: UseAccountingConfigArgs) => {
  const isAccountingRolloutBusiness = useAccountingRolloutEnabled(businessId);
  const [config, setConfig] = useState<AccountingSettingsConfig>(() =>
    defaultAccountingSettings(userId),
  );
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AccountingSettingsHistoryEntry[]>([]);
  const [savingBanking, setSavingBanking] = useState(false);
  const [savingExchange, setSavingExchange] = useState(false);
  const [savingGeneralAccounting, setSavingGeneralAccounting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(true);
  const [marketExchangeRateReference, setMarketExchangeRateReference] =
    useState<ExchangeRateProviderSnapshot | null>(null);
  const [lastPersistedConfig, setLastPersistedConfig] =
    useState<AccountingSettingsConfig>(() => defaultAccountingSettings(userId));
  const dirtySectionsRef = useRef<DirtySectionsState>({
    banking: false,
    exchange: false,
    generalAccounting: false,
  });
  const syncDefaultBankAccountWithActiveAccountsRef = useRef<
    (args: {
      activeBankAccountIds: readonly string[];
    }) => Promise<void>
  >(async () => {});
  const latestBankingSaveRequestIdRef = useRef(0);
  const latestGeneralAccountingSaveRequestIdRef = useRef(0);

  const hasUnsavedExchangeChanges = useMemo(
    () =>
      serializeExchangeSettingsForComparison(config) !==
      serializeExchangeSettingsForComparison(lastPersistedConfig),
    [config, lastPersistedConfig],
  );

  const hasUnsavedBankingChanges = useMemo(
    () =>
      serializeBankingSettingsForComparison(config) !==
      serializeBankingSettingsForComparison(lastPersistedConfig),
    [config, lastPersistedConfig],
  );

  const hasUnsavedGeneralAccountingChanges = useMemo(
    () =>
      serializeGeneralAccountingSettingsForComparison(config) !==
      serializeGeneralAccountingSettingsForComparison(lastPersistedConfig),
    [config, lastPersistedConfig],
  );

  useEffect(() => {
    dirtySectionsRef.current = {
      banking: hasUnsavedBankingChanges,
      exchange: hasUnsavedExchangeChanges,
      generalAccounting: hasUnsavedGeneralAccountingChanges,
    };
  }, [
    hasUnsavedBankingChanges,
    hasUnsavedExchangeChanges,
    hasUnsavedGeneralAccountingChanges,
  ]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const settingsRef = doc(
      db,
      'businesses',
      businessId,
      'settings',
      'accounting',
    );

    const ensureSettings = async () => {
      const snapshot = await getDoc(settingsRef);
      if (!snapshot.exists()) {
        await setDoc(settingsRef, {
          ...defaultAccountingSettings(userId),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    };

    void ensureSettings().catch((cause) => {
      console.error('Error inicializando accounting settings:', cause);
    });

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        const nextConfig = normalizeAccountingSettings(snapshot.data(), userId);
        setLastPersistedConfig(nextConfig);
        setConfig((current) =>
          mergeConfigWithDirtySections({
            currentConfig: current,
            dirtySections: dirtySectionsRef.current,
            persistedConfig: nextConfig,
          }),
        );
        setLoading(false);
        setError(null);
      },
      (cause) => {
        setLoading(false);
        setError(cause.message || 'No se pudo cargar la configuración.');
      },
    );

    return unsubscribe;
  }, [businessId, userId]);

  useEffect(() => {
    if (!businessId) {
      setBankAccounts([]);
      setBankAccountsLoading(false);
      return;
    }

    setBankAccountsLoading(true);
    const bankAccountsRef = collection(
      db,
      'businesses',
      businessId,
      'bankAccounts',
    );

    const unsubscribe = onSnapshot(
      bankAccountsRef,
      (snapshot) => {
        const nextBankAccounts = snapshot.docs
          .map((bankAccountDoc) =>
            normalizeBankAccountRecord(
              bankAccountDoc.id,
              businessId,
              bankAccountDoc.data(),
            ),
          )
          .sort((left, right) => {
            if (left.status !== right.status) {
              return left.status === 'active' ? -1 : 1;
            }

            return left.name.localeCompare(right.name);
          });

        setBankAccounts(nextBankAccounts);
        setBankAccountsLoading(false);
      },
      (cause) => {
        console.error('Error cargando cuentas bancarias:', cause);
        setBankAccountsLoading(false);
      },
    );

    return unsubscribe;
  }, [businessId]);

  useEffect(() => {
    const latestRef = doc(
      db,
      'system',
      'marketData',
      'exchangeRateProviders',
      'open-exchange-rates',
    );

    const unsubscribe = onSnapshot(
      latestRef,
      (snapshot) => {
        setMarketExchangeRateReference(
          snapshot.exists()
            ? normalizeExchangeRateProviderSnapshot(snapshot.data())
            : null,
        );
      },
      (cause) => {
        console.error('Error cargando referencia de tasa de cambio:', cause);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!businessId) {
      setHistory([]);
      return;
    }

    const historyRef = collection(
      db,
      'businesses',
      businessId,
      'settings',
      'accounting',
      'history',
    );
    const historyQuery = query(
      historyRef,
      orderBy('changedAt', 'desc'),
      limit(12),
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        setHistory(
          snapshot.docs.map((historyDoc) =>
            normalizeAccountingHistoryEntry(
              historyDoc.id,
              historyDoc.data(),
              userId,
            ),
          ),
        );
      },
      (cause) => {
        console.error(
          'Error cargando historial de accounting settings:',
          cause,
        );
      },
    );

    return unsubscribe;
  }, [businessId, userId]);

  const updateCurrencyConfiguration = useCallback(
    ({
      functionalCurrency,
      documentCurrencies,
    }: {
      functionalCurrency: SupportedDocumentCurrency;
      documentCurrencies: SupportedDocumentCurrency[];
    }) => {
      const nextDocumentCurrencies = Array.from(
        new Set([functionalCurrency, ...documentCurrencies]),
      );

      setConfig((current) => ({
        ...current,
        functionalCurrency,
        documentCurrencies: nextDocumentCurrencies,
        manualRatesByCurrency: buildManualRatesByCurrency(
          functionalCurrency,
          nextDocumentCurrencies,
          current.manualRatesByCurrency,
        ),
      }));
    },
    [],
  );

  const updateCurrencyRate = useCallback(
    (
      currency: SupportedDocumentCurrency,
      patch: Partial<AccountingCurrencyRateConfig>,
    ) => {
      setConfig((current) => ({
        ...current,
        manualRatesByCurrency: {
          ...current.manualRatesByCurrency,
          [currency]: {
            buyRate: current.manualRatesByCurrency[currency]?.buyRate ?? null,
            sellRate: current.manualRatesByCurrency[currency]?.sellRate ?? null,
            ...patch,
          },
        },
      }));
    },
    [],
  );

  const updateBuyRate = useCallback(
    (currency: SupportedDocumentCurrency, rate: number | null) => {
      updateCurrencyRate(currency, {
        buyRate: rate,
      });
    },
    [updateCurrencyRate],
  );

  const updateSellRate = useCallback(
    (currency: SupportedDocumentCurrency, rate: number | null) => {
      updateCurrencyRate(currency, {
        sellRate: rate,
      });
    },
    [updateCurrencyRate],
  );

  const enabledForeignCurrencies = getEnabledForeignCurrencies(config);
  const exchangeRateReference = deriveExchangeRateReferenceSnapshot({
    providerSnapshot: marketExchangeRateReference,
    functionalCurrency: config.functionalCurrency,
    documentCurrencies: config.documentCurrencies,
  });

  const addBankAccount = useCallback(
    async (draft: Partial<BankAccountDraft>) => {
      if (!businessId) return;

      const normalizedDraft = normalizeBankAccountDraft(draft);
      if (!normalizedDraft.name) {
        void message.error('El nombre de la cuenta bancaria es requerido.');
        return;
      }

      const now = Timestamp.now();
      const bankAccountRef = doc(
        collection(db, 'businesses', businessId, 'bankAccounts'),
      );
      const nextSnapshot = buildBankAccountSnapshot({
        bankAccountId: bankAccountRef.id,
        businessId,
        name: normalizedDraft.name,
        currency: normalizedDraft.currency,
        type: normalizedDraft.type ?? null,
        institutionName: normalizedDraft.institutionName ?? null,
        accountNumberLast4: normalizedDraft.accountNumberLast4 ?? null,
        openingBalance: normalizedDraft.openingBalance ?? null,
        openingBalanceDate: normalizedDraft.openingBalanceDate ?? null,
        notes: normalizedDraft.notes ?? null,
        status: 'active',
      });
      const batch = writeBatch(db);

      batch.set(bankAccountRef, {
        ...nextSnapshot,
        createdAt: now,
        updatedAt: now,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      });

      await batch.commit();

      const nextActiveBankAccountIds = [
        ...bankAccounts
          .filter((bankAccount) => bankAccount.status === 'active')
          .map((bankAccount) => bankAccount.id),
        bankAccountRef.id,
      ];
      await syncDefaultBankAccountWithActiveAccountsRef.current({
        activeBankAccountIds: nextActiveBankAccountIds,
      });

      void message.success('Cuenta bancaria guardada.');
    },
    [bankAccounts, businessId, userId],
  );

  const updateBankAccountStatus = useCallback(
    async (bankAccountId: string, status: BankAccount['status']) => {
      if (!businessId || !bankAccountId) return;

      const currentBankAccount =
        bankAccounts.find((bankAccount) => bankAccount.id === bankAccountId) ??
        null;
      if (!currentBankAccount) {
        void message.error('No se encontró la cuenta bancaria seleccionada.');
        return;
      }

      const now = Timestamp.now();
      const bankAccountRef = doc(
        db,
        'businesses',
        businessId,
        'bankAccounts',
        bankAccountId,
      );
      const previousSnapshot = buildBankAccountSnapshot({
        bankAccountId: currentBankAccount.id,
        businessId,
        name: currentBankAccount.name,
        currency: currentBankAccount.currency,
        type: currentBankAccount.type ?? null,
        institutionName: currentBankAccount.institutionName ?? null,
        accountNumberLast4: currentBankAccount.accountNumberLast4 ?? null,
        openingBalance: currentBankAccount.openingBalance ?? null,
        openingBalanceDate: currentBankAccount.openingBalanceDate ?? null,
        notes: currentBankAccount.notes ?? null,
        status: currentBankAccount.status,
        metadata: currentBankAccount.metadata ?? {},
      });
      const nextSnapshot = buildBankAccountSnapshot({
        bankAccountId: currentBankAccount.id,
        businessId,
        name: currentBankAccount.name,
        currency: currentBankAccount.currency,
        type: currentBankAccount.type ?? null,
        institutionName: currentBankAccount.institutionName ?? null,
        accountNumberLast4: currentBankAccount.accountNumberLast4 ?? null,
        openingBalance: currentBankAccount.openingBalance ?? null,
        openingBalanceDate: currentBankAccount.openingBalanceDate ?? null,
        notes: currentBankAccount.notes ?? null,
        status,
        metadata: currentBankAccount.metadata ?? {},
      });
      const batch = writeBatch(db);

      batch.set(
        bankAccountRef,
        {
          status,
          updatedAt: now,
          updatedBy: userId ?? null,
        },
        { merge: true },
      );

      await batch.commit();

      const nextActiveBankAccountIds = bankAccounts
        .filter((bankAccount) =>
          bankAccount.id === bankAccountId
            ? status === 'active'
            : bankAccount.status === 'active',
        )
        .map((bankAccount) => bankAccount.id);

      if (
        status === 'active' &&
        !nextActiveBankAccountIds.includes(bankAccountId)
      ) {
        nextActiveBankAccountIds.push(bankAccountId);
      }

      await syncDefaultBankAccountWithActiveAccountsRef.current({
        activeBankAccountIds: nextActiveBankAccountIds,
      });

      void message.success(
        status === 'active'
          ? 'Cuenta bancaria activada.'
          : 'Cuenta bancaria desactivada.',
      );
    },
    [bankAccounts, businessId, userId],
  );

  const updateBankAccount = useCallback(
    async (bankAccountId: string, draft: Partial<BankAccountDraft>) => {
      if (!businessId || !bankAccountId) return;

      const currentBankAccount =
        bankAccounts.find((bankAccount) => bankAccount.id === bankAccountId) ??
        null;
      if (!currentBankAccount) {
        void message.error('No se encontró la cuenta bancaria seleccionada.');
        return;
      }

      const normalizedDraft = normalizeBankAccountDraft(draft);
      const now = Timestamp.now();
      const bankAccountRef = doc(
        db,
        'businesses',
        businessId,
        'bankAccounts',
        bankAccountId,
      );
      const previousSnapshot = buildBankAccountSnapshot({
        bankAccountId: currentBankAccount.id,
        businessId,
        name: currentBankAccount.name,
        currency: currentBankAccount.currency,
        type: currentBankAccount.type ?? null,
        institutionName: currentBankAccount.institutionName ?? null,
        accountNumberLast4: currentBankAccount.accountNumberLast4 ?? null,
        openingBalance: currentBankAccount.openingBalance ?? null,
        openingBalanceDate: currentBankAccount.openingBalanceDate ?? null,
        notes: currentBankAccount.notes ?? null,
        status: currentBankAccount.status,
        metadata: currentBankAccount.metadata ?? {},
      });
      const nextSnapshot = buildBankAccountSnapshot({
        bankAccountId,
        businessId,
        name: normalizedDraft.name,
        currency: normalizedDraft.currency,
        type: normalizedDraft.type ?? null,
        institutionName: normalizedDraft.institutionName ?? null,
        accountNumberLast4: normalizedDraft.accountNumberLast4 ?? null,
        openingBalance: normalizedDraft.openingBalance ?? null,
        openingBalanceDate: normalizedDraft.openingBalanceDate ?? null,
        notes: normalizedDraft.notes ?? null,
        status: currentBankAccount.status,
        metadata: currentBankAccount.metadata ?? {},
      });
      const batch = writeBatch(db);

      batch.set(
        bankAccountRef,
        {
          ...nextSnapshot,
          updatedAt: now,
          updatedBy: userId ?? null,
        },
        { merge: true },
      );

      await batch.commit();

      void message.success('Cuenta bancaria actualizada.');
    },
    [bankAccounts, businessId, userId],
  );

  const buildNextExchangeConfig = useCallback(
    (draftConfig: AccountingSettingsConfig): AccountingSettingsConfig => {
      const normalizedConfig = normalizeAccountingSettings(draftConfig, userId);
      const functionalCurrency = normalizeFunctionalCurrency(
        normalizedConfig.functionalCurrency,
      );
      const documentCurrencies = Array.from(
        new Set([functionalCurrency, ...normalizedConfig.documentCurrencies]),
      );

      return {
        ...lastPersistedConfig,
        ...normalizedConfig,
        functionalCurrency,
        documentCurrencies,
        manualRatesByCurrency: buildManualRatesByCurrency(
          functionalCurrency,
          documentCurrencies,
          normalizedConfig.manualRatesByCurrency,
        ),
        generalAccountingEnabled: lastPersistedConfig.generalAccountingEnabled,
        bankAccountsEnabled: lastPersistedConfig.bankAccountsEnabled,
        bankPaymentPolicy: lastPersistedConfig.bankPaymentPolicy,
        updatedBy: userId,
      };
    },
    [lastPersistedConfig, userId],
  );

  const persistExchangeSettings = useCallback(
    async ({
      draftConfig,
      noChangesMessage,
      successMessage,
    }: {
      draftConfig: AccountingSettingsConfig;
      noChangesMessage?: string | null;
      successMessage: string;
    }) => {
      if (!businessId) return;

      setSavingExchange(true);
      setError(null);

      try {
        const settingsRef = doc(
          db,
          'businesses',
          businessId,
          'settings',
          'accounting',
        );
        const nextConfig = buildNextExchangeConfig(draftConfig);

        if (
          serializeExchangeSettingsForComparison(nextConfig) ===
          serializeExchangeSettingsForComparison(lastPersistedConfig)
        ) {
          if (noChangesMessage) {
            void message.info(noChangesMessage);
          }
          return;
        }

        const now = Timestamp.now();
        const persistedConfig: AccountingSettingsConfig = nextConfig;
        const batch = writeBatch(db);
        batch.set(
          settingsRef,
          {
            schemaVersion: persistedConfig.schemaVersion,
            rolloutMode: persistedConfig.rolloutMode,
            functionalCurrency: persistedConfig.functionalCurrency,
            documentCurrencies: persistedConfig.documentCurrencies,
            exchangeRateMode: persistedConfig.exchangeRateMode,
            manualRatesByCurrency: persistedConfig.manualRatesByCurrency,
            overridePolicy: persistedConfig.overridePolicy,
            updatedBy: userId,
            updatedAt: now,
          },
          { merge: true },
        );

        await batch.commit();

        setLastPersistedConfig((current) => ({
          ...current,
          ...pickExchangeSettingsSlice(persistedConfig),
          updatedBy: persistedConfig.updatedBy,
        }));
        setConfig((current) => ({
          ...current,
          ...pickExchangeSettingsSlice(persistedConfig),
          updatedBy: persistedConfig.updatedBy,
        }));
        void message.success(successMessage);
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : 'No se pudo guardar la configuración.';
        setError(message);
      } finally {
        setSavingExchange(false);
      }
    },
    [buildNextExchangeConfig, businessId, lastPersistedConfig, userId],
  );

  const updateFunctionalCurrency = useCallback(
    (currency: SupportedDocumentCurrency) => {
      const nextDocumentCurrencies = Array.from(
        new Set([currency, ...config.documentCurrencies]),
      );
      const nextDraftConfig: AccountingSettingsConfig = {
        ...config,
        functionalCurrency: currency,
        documentCurrencies: nextDocumentCurrencies,
        manualRatesByCurrency: buildManualRatesByCurrency(
          currency,
          nextDocumentCurrencies,
          config.manualRatesByCurrency,
        ),
        updatedBy: userId,
      };

      setConfig((current) => ({
        ...current,
        functionalCurrency: currency,
        documentCurrencies: nextDocumentCurrencies,
        manualRatesByCurrency: buildManualRatesByCurrency(
          currency,
          nextDocumentCurrencies,
          current.manualRatesByCurrency,
        ),
        updatedBy: userId,
      }));
      void persistExchangeSettings({
        draftConfig: nextDraftConfig,
        noChangesMessage: null,
        successMessage: 'Moneda base actualizada.',
      });
    },
    [config, persistExchangeSettings, userId],
  );

  const saveExchangeSettings = useCallback(async () => {
    await persistExchangeSettings({
      draftConfig: config,
      noChangesMessage: 'No hubo cambios nuevos en las monedas activas.',
      successMessage: 'Monedas activas guardadas y versionadas.',
    });
  }, [config, persistExchangeSettings]);

  const persistBankingSettings = useCallback(
    async ({
      bankAccountsEnabled,
      bankPaymentPolicy,
    }: Pick<
      AccountingSettingsConfig,
      'bankAccountsEnabled' | 'bankPaymentPolicy'
    >) => {
      if (!businessId) return;

      const normalizedPolicy = normalizeBankPaymentPolicy(bankPaymentPolicy);
      const normalizedBankAccountsEnabled = bankAccountsEnabled !== false;
      if (
        serializeBankingSettingsForComparison({
          bankAccountsEnabled: normalizedBankAccountsEnabled,
          bankPaymentPolicy: normalizedPolicy,
        }) === serializeBankingSettingsForComparison(lastPersistedConfig)
      ) {
        return;
      }

      const requestId = latestBankingSaveRequestIdRef.current + 1;
      latestBankingSaveRequestIdRef.current = requestId;
      setSavingBanking(true);
      setError(null);

      try {
        const settingsRef = doc(
          db,
          'businesses',
          businessId,
          'settings',
          'accounting',
        );
        const now = Timestamp.now();
        const persistedConfig: AccountingSettingsConfig = {
          ...lastPersistedConfig,
          bankAccountsEnabled: normalizedBankAccountsEnabled,
          bankPaymentPolicy: normalizedPolicy,
          updatedBy: userId,
        };
        const batch = writeBatch(db);

        batch.set(
          settingsRef,
          {
            bankAccountsEnabled: normalizedBankAccountsEnabled,
            bankPaymentPolicy: normalizedPolicy,
            updatedAt: now,
            updatedBy: userId,
          },
          { merge: true },
        );

        await batch.commit();

        if (latestBankingSaveRequestIdRef.current !== requestId) {
          return;
        }

        setLastPersistedConfig((current) => ({
          ...current,
          bankAccountsEnabled: normalizedBankAccountsEnabled,
          bankPaymentPolicy: normalizedPolicy,
          updatedBy: userId,
        }));
        setConfig((current) => ({
          ...current,
          bankAccountsEnabled: normalizedBankAccountsEnabled,
          bankPaymentPolicy: normalizedPolicy,
          updatedBy: userId,
        }));
      } catch (cause) {
        if (latestBankingSaveRequestIdRef.current !== requestId) {
          return;
        }

        const message =
          cause instanceof Error
            ? cause.message
            : 'No se pudo guardar la configuración bancaria.';
        setError(message);
      } finally {
        if (latestBankingSaveRequestIdRef.current === requestId) {
          setSavingBanking(false);
        }
      }
    },
    [businessId, lastPersistedConfig, userId],
  );

  syncDefaultBankAccountWithActiveAccountsRef.current = async ({
    activeBankAccountIds,
  }: {
    activeBankAccountIds: readonly string[];
  }) => {
    const currentBankPaymentPolicy = normalizeBankPaymentPolicy(
      config.bankPaymentPolicy,
    );
    const nextBankPaymentPolicy = syncBankPaymentPolicyDefaultAccount({
      policy: currentBankPaymentPolicy,
      availableBankAccountIds: activeBankAccountIds,
    });

    if (
      JSON.stringify(nextBankPaymentPolicy) ===
      JSON.stringify(currentBankPaymentPolicy)
    ) {
      return;
    }

    setConfig((current) => ({
      ...current,
      bankPaymentPolicy: nextBankPaymentPolicy,
      updatedBy: userId,
    }));
    await persistBankingSettings({
      bankAccountsEnabled: config.bankAccountsEnabled,
      bankPaymentPolicy: nextBankPaymentPolicy,
    });
  };

  const updateBankPaymentPolicy = useCallback(
    (bankPaymentPolicy: BankPaymentPolicy) => {
      const normalizedPolicy = normalizeBankPaymentPolicy(bankPaymentPolicy);

      setConfig((current) => ({
        ...current,
        bankPaymentPolicy: normalizedPolicy,
        updatedBy: userId,
      }));
      void persistBankingSettings({
        bankAccountsEnabled: config.bankAccountsEnabled,
        bankPaymentPolicy: normalizedPolicy,
      });
    },
    [config.bankAccountsEnabled, persistBankingSettings, userId],
  );

  const updateBankAccountsEnabled = useCallback(
    (bankAccountsEnabled: boolean) => {
      setConfig((current) => ({
        ...current,
        bankAccountsEnabled,
        updatedBy: userId,
      }));
      void persistBankingSettings({
        bankAccountsEnabled,
        bankPaymentPolicy: config.bankPaymentPolicy,
      });
    },
    [config.bankPaymentPolicy, persistBankingSettings, userId],
  );

  const updateGeneralAccountingEnabled = useCallback(
    async (generalAccountingEnabled: boolean) => {
      if (!businessId) return;

      if (
        serializeGeneralAccountingSettingsForComparison({
          generalAccountingEnabled,
        }) ===
        serializeGeneralAccountingSettingsForComparison(lastPersistedConfig)
      ) {
        return;
      }

      const requestId = latestGeneralAccountingSaveRequestIdRef.current + 1;
      latestGeneralAccountingSaveRequestIdRef.current = requestId;

      setConfig((current) => ({
        ...current,
        generalAccountingEnabled,
        updatedBy: userId,
      }));
      setSavingGeneralAccounting(true);
      setError(null);

      try {
        const settingsRef = doc(
          db,
          'businesses',
          businessId,
          'settings',
          'accounting',
        );
        const now = Timestamp.now();
        const persistedConfig: AccountingSettingsConfig = {
          ...lastPersistedConfig,
          generalAccountingEnabled,
          updatedBy: userId,
        };
        const batch = writeBatch(db);

        batch.set(
          settingsRef,
          {
            generalAccountingEnabled,
            updatedAt: now,
            updatedBy: userId,
          },
          { merge: true },
        );

        await batch.commit();

        if (latestGeneralAccountingSaveRequestIdRef.current !== requestId) {
          return;
        }

        setLastPersistedConfig((current) => ({
          ...current,
          generalAccountingEnabled,
          updatedBy: userId,
        }));
        setConfig((current) => ({
          ...current,
          generalAccountingEnabled,
          updatedBy: userId,
        }));
      } catch (cause) {
        if (latestGeneralAccountingSaveRequestIdRef.current !== requestId) {
          return;
        }

        const message =
          cause instanceof Error
            ? cause.message
            : 'No se pudo guardar la configuración contable general.';
        setError(message);
      } finally {
        if (latestGeneralAccountingSaveRequestIdRef.current === requestId) {
          setSavingGeneralAccounting(false);
        }
      }
    },
    [businessId, lastPersistedConfig, userId],
  );

  return {
    addBankAccount,
    bankAccounts,
    bankAccountsLoading,
    config,
    enabledForeignCurrencies,
    error,
    exchangeRateReference,
    hasUnsavedBankingChanges,
    hasUnsavedExchangeChanges,
    history,
    isAccountingRolloutBusiness,
    loading,
    saveExchangeSettings,
    savingBanking,
    savingExchange,
    savingGeneralAccounting,
    updateBankAccount,
    updateBankAccountStatus,
    updateBankAccountsEnabled,
    updateBankPaymentPolicy,
    updateCurrencyConfiguration,
    updateFunctionalCurrency,
    updateGeneralAccountingEnabled,
    updateBuyRate,
    updateSellRate,
  };
};
