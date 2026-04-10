import { Timestamp, collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { isAccountingRolloutEnabledForBusiness } from '@/utils/accounting/monetary';

import type { ModuleStatus } from '../components/ModuleCard';

interface UseModulesConfigArgs {
  businessId: string | null;
  userId: string | null;
}

interface ModulesSnapshotState {
  accountingEnabled: boolean;
  bankAccountsEnabled: boolean;
  bankAccountsTotal: number;
  generalAccountingEnabled: boolean;
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
  accountingEnabled: false,
  bankAccountsEnabled: true,
  bankAccountsTotal: 0,
  generalAccountingEnabled: false,
  treasuryEnabled: true,
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
  const [loading, setLoading] = useState(true);
  const [savingAccounting, setSavingAccounting] = useState(false);
  const [savingTreasury, setSavingTreasury] = useState(false);
  const [state, setState] = useState<ModulesSnapshotState>(DEFAULT_MODULES_STATE);

  useEffect(() => {
    if (!businessId) {
      setState(DEFAULT_MODULES_STATE);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const settingsRef = doc(db, 'businesses', businessId, 'settings', 'accounting');

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : null;
        setState((current) => ({
          ...current,
          accountingEnabled: isAccountingRolloutEnabledForBusiness(businessId, data),
          generalAccountingEnabled: toGeneralAccountingEnabled(data),
          bankAccountsEnabled: toBankAccountsEnabled(data),
          treasuryEnabled: toTreasuryEnabled(data),
        }));
        setLoading(false);
        setError(null);
      },
      (cause) => {
        setLoading(false);
        setError(cause.message || 'No se pudo cargar el estado de los módulos.');
      },
    );

    return unsubscribe;
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      return undefined;
    }

    const bankAccountsRef = collection(db, 'businesses', businessId, 'bankAccounts');
    const unsubscribe = onSnapshot(
      bankAccountsRef,
      (snapshot) => {
        setState((current) => ({
          ...current,
          bankAccountsTotal: snapshot.docs.filter(
            (item) => asRecord(item.data()).status !== 'inactive',
          ).length,
        }));
      },
      () => {
        setState((current) => ({
          ...current,
          bankAccountsTotal: 0,
        }));
      },
    );

    return unsubscribe;
  }, [businessId]);

  const persistModuleState = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!businessId) return;

      const settingsRef = doc(db, 'businesses', businessId, 'settings', 'accounting');
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
          cause instanceof Error ? cause.message : 'No se pudo actualizar Tesorería.',
        );
      } finally {
        setSavingTreasury(false);
      }
    },
    [persistModuleState],
  );

  const accountingModule = useMemo<ModuleCardState>(
    () => ({
      checked: state.accountingEnabled,
      helperText: state.accountingEnabled
        ? 'Activa catálogo, perfiles y las rutas protegidas de contabilidad.'
        : 'Mantiene ocultas las rutas y configuraciones contables del negocio.',
      loading: loading || savingAccounting,
      status: getAccountingModuleStatus(state),
      summary: [
        {
          label: 'Estado',
          value: state.accountingEnabled ? 'Habilitado' : 'Deshabilitado',
        },
        {
          label: 'Contabilidad general',
          value: state.generalAccountingEnabled ? 'Configurada' : 'Pendiente',
        },
        {
          label: 'Tesorería dependiente',
          value: state.treasuryEnabled ? 'Sí' : 'No',
        },
      ],
    }),
    [loading, savingAccounting, state],
  );

  const treasuryModule = useMemo<ModuleCardState>(
    () => ({
      checked: state.treasuryEnabled,
      configureDisabled: !state.accountingEnabled,
      helperText: state.accountingEnabled
        ? 'Hoy la configuración bancaria reutiliza la base contable existente.'
        : 'Primero activa Contabilidad para abrir la configuración bancaria actual.',
      loading: loading || savingTreasury,
      status: getTreasuryModuleStatus(state),
      summary: [
        {
          label: 'Estado',
          value: state.treasuryEnabled ? 'Habilitada' : 'Deshabilitada',
        },
        {
          label: 'Cuentas bancarias',
          value:
            state.bankAccountsTotal > 0
              ? `${state.bankAccountsTotal} configurada(s)`
              : 'Pendiente',
        },
        {
          label: 'Resolución bancaria',
          value: state.bankAccountsEnabled ? 'Activa' : 'Desactivada',
        },
      ],
    }),
    [loading, savingTreasury, state],
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
