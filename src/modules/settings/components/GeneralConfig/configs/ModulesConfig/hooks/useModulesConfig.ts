import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { isAccountingRolloutEnabledForBusiness } from '@/utils/accounting/monetary';

import type { ModuleStatus } from '../components/ModuleCard';

interface UseModulesConfigArgs {
  businessId: string | null;
  userId: string | null;
}

interface ModulesSnapshotState {
  businessId: string | null;
  accountingEnabled: boolean;
  bankAccountsEnabled: boolean;
  bankAccountsTotal: number;
  generalAccountingEnabled: boolean;
  settingsLoaded: boolean;
  treasuryEnabled: boolean;
}

export interface ModuleCardState {
  checked: boolean;
  configureDisabled?: boolean;
  helperText: string;
  loading: boolean;
  status: ModuleStatus;
  summary: Array<{ label: string; value: string }>;
}

const DEFAULT_MODULES_STATE: ModulesSnapshotState = {
  businessId: null,
  accountingEnabled: false,
  bankAccountsEnabled: true,
  bankAccountsTotal: 0,
  generalAccountingEnabled: false,
  settingsLoaded: false,
  treasuryEnabled: true,
};

const getStateForBusiness = (
  current: ModulesSnapshotState,
  businessId: string,
): ModulesSnapshotState =>
  current.businessId === businessId
    ? current
    : {
        ...DEFAULT_MODULES_STATE,
        businessId,
      };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toTreasuryEnabled = (value: unknown): boolean => {
  const record = asRecord(value);
  return record.treasuryEnabled !== false;
};

const toGeneralAccountingEnabled = (value: unknown): boolean => {
  const record = asRecord(value);
  return record.generalAccountingEnabled === true;
};

const toBankAccountsEnabled = (value: unknown): boolean => {
  const record = asRecord(value);
  return record.bankAccountsEnabled !== false;
};

const getAccountingModuleStatus = ({
  accountingEnabled,
  generalAccountingEnabled,
}: Pick<
  ModulesSnapshotState,
  'accountingEnabled' | 'generalAccountingEnabled'
>): ModuleStatus => {
  if (!accountingEnabled) return 'inactive';
  return generalAccountingEnabled ? 'active' : 'config-pending';
};

const getTreasuryModuleStatus = ({
  accountingEnabled,
  bankAccountsTotal,
  treasuryEnabled,
}: Pick<
  ModulesSnapshotState,
  'accountingEnabled' | 'bankAccountsTotal' | 'treasuryEnabled'
>): ModuleStatus => {
  if (!treasuryEnabled) return 'inactive';
  if (!accountingEnabled || bankAccountsTotal === 0) {
    return 'config-pending';
  }
  return 'active';
};

export const useModulesConfig = ({
  businessId,
  userId,
}: UseModulesConfigArgs) => {
  const [error, setError] = useState<string | null>(null);
  const [savingAccounting, setSavingAccounting] = useState(false);
  const [savingTreasury, setSavingTreasury] = useState(false);
  const [state, setState] = useState<ModulesSnapshotState>(
    DEFAULT_MODULES_STATE,
  );
  const activeState =
    businessId && state.businessId === businessId
      ? state
      : DEFAULT_MODULES_STATE;
  const loading = Boolean(businessId) && !activeState.settingsLoaded;

  useEffect(() => {
    if (!businessId) {
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
        const data = snapshot.exists() ? snapshot.data() : null;
        setState((current) => {
          const next = getStateForBusiness(current, businessId);
          return {
            ...next,
            accountingEnabled: isAccountingRolloutEnabledForBusiness(
              businessId,
              data,
            ),
            generalAccountingEnabled: toGeneralAccountingEnabled(data),
            bankAccountsEnabled: toBankAccountsEnabled(data),
            settingsLoaded: true,
            treasuryEnabled: toTreasuryEnabled(data),
          };
        });
        setError(null);
      },
      (cause) => {
        setState((current) => ({
          ...getStateForBusiness(current, businessId),
          settingsLoaded: true,
        }));
        setError(
          cause.message || 'No se pudo cargar el estado de los módulos.',
        );
      },
    );

    return unsubscribe;
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      return undefined;
    }

    const bankAccountsRef = collection(
      db,
      'businesses',
      businessId,
      'bankAccounts',
    );
    const unsubscribe = onSnapshot(
      bankAccountsRef,
      (snapshot) => {
        setState((current) => {
          const next = getStateForBusiness(current, businessId);
          return {
            ...next,
            bankAccountsTotal: snapshot.docs.filter(
              (item) => asRecord(item.data()).status !== 'inactive',
            ).length,
          };
        });
      },
      () => {
        setState((current) => ({
          ...getStateForBusiness(current, businessId),
          bankAccountsTotal: 0,
        }));
      },
    );

    return unsubscribe;
  }, [businessId]);

  const persistModuleState = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!businessId) return;

      const settingsRef = doc(
        db,
        'businesses',
        businessId,
        'settings',
        'accounting',
      );
      await setDoc(
        settingsRef,
        {
          ...patch,
          updatedAt: Timestamp.now(),
          updatedBy: userId ?? null,
        },
        { merge: true },
      );
    },
    [businessId, userId],
  );

  const setAccountingEnabled = useCallback(
    async (enabled: boolean) => {
      setSavingAccounting(true);
      setError(null);
      try {
        await persistModuleState({
          generalAccountingEnabled: enabled,
          rolloutEnabled: enabled,
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo actualizar Contabilidad.',
        );
      } finally {
        setSavingAccounting(false);
      }
    },
    [persistModuleState],
  );

  const setTreasuryEnabled = useCallback(
    async (enabled: boolean) => {
      setSavingTreasury(true);
      setError(null);
      try {
        await persistModuleState({
          bankAccountsEnabled: enabled,
          treasuryEnabled: enabled,
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo actualizar Tesorería.',
        );
      } finally {
        setSavingTreasury(false);
      }
    },
    [persistModuleState],
  );

  const accountingModule = useMemo<ModuleCardState>(
    () => ({
      checked: activeState.accountingEnabled,
      helperText: activeState.accountingEnabled
        ? 'Activa catálogo, reglas y las rutas protegidas de contabilidad.'
        : 'Mantiene ocultas las rutas y configuraciones contables del negocio.',
      loading: loading || savingAccounting,
      status: getAccountingModuleStatus(activeState),
      summary: [
        {
          label: 'Estado',
          value: activeState.accountingEnabled ? 'Habilitado' : 'Deshabilitado',
        },
        {
          label: 'Contabilidad general',
          value: activeState.generalAccountingEnabled
            ? 'Configurada'
            : 'Pendiente',
        },
        {
          label: 'Tesorería dependiente',
          value: activeState.treasuryEnabled ? 'Sí' : 'No',
        },
      ],
    }),
    [activeState, loading, savingAccounting],
  );

  const treasuryModule = useMemo<ModuleCardState>(
    () => ({
      checked: activeState.treasuryEnabled,
      configureDisabled: !activeState.accountingEnabled,
      helperText: activeState.accountingEnabled
        ? 'Hoy la configuración bancaria reutiliza la base contable existente.'
        : 'Primero activa Contabilidad para abrir la configuración bancaria actual.',
      loading: loading || savingTreasury,
      status: getTreasuryModuleStatus(activeState),
      summary: [
        {
          label: 'Estado',
          value: activeState.treasuryEnabled ? 'Habilitada' : 'Deshabilitada',
        },
        {
          label: 'Cuentas bancarias',
          value:
            activeState.bankAccountsTotal > 0
              ? `${activeState.bankAccountsTotal} configurada(s)`
              : 'Pendiente',
        },
        {
          label: 'Resolución bancaria',
          value: activeState.bankAccountsEnabled ? 'Activa' : 'Desactivada',
        },
      ],
    }),
    [activeState, loading, savingTreasury],
  );

  return {
    accountingModule,
    error,
    setAccountingEnabled,
    setTreasuryEnabled,
    treasuryModule,
  };
};

export default useModulesConfig;
