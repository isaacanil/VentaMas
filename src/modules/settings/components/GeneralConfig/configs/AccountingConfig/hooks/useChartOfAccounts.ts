import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ChartOfAccount } from '@/types/accounting';
import {
  collectChartOfAccountDescendantIds,
  DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE,
  normalizeChartOfAccountDraft,
  normalizeChartOfAccountRecord,
  type ChartOfAccountDraft,
} from '@/utils/accounting/chartOfAccounts';

interface UseChartOfAccountsArgs {
  businessId: string | null;
  enabled: boolean;
  functionalCurrency: string;
  userId: string | null;
}

const buildCodeKey = (value: string) => value.trim().toLowerCase();

const serializeDraftForComparison = (
  draft: ChartOfAccountDraft,
): Record<string, unknown> => ({
  code: draft.code,
  name: draft.name,
  type: draft.type,
  subtype: draft.subtype ?? null,
  parentId: draft.parentId ?? null,
  postingAllowed: draft.postingAllowed !== false,
  normalSide: draft.normalSide,
  currencyMode: draft.currencyMode,
});

const buildChartOfAccountSnapshot = ({
  businessId,
  chartOfAccountId,
  draft,
  metadata,
  status = 'active',
}: {
  businessId: string;
  chartOfAccountId: string;
  draft: ChartOfAccountDraft;
  metadata?: Record<string, unknown> | null;
  status?: ChartOfAccount['status'];
}) => ({
  id: chartOfAccountId,
  businessId,
  code: draft.code,
  name: draft.name,
  type: draft.type,
  subtype: draft.subtype ?? null,
  parentId: draft.parentId ?? null,
  postingAllowed: draft.postingAllowed !== false,
  status,
  normalSide: draft.normalSide,
  currencyMode: draft.currencyMode,
  systemKey: draft.systemKey ?? null,
  metadata: metadata ?? draft.metadata ?? {},
});

export const useChartOfAccounts = ({
  businessId,
  enabled,
  functionalCurrency,
  userId,
}: UseChartOfAccountsArgs) => {
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !enabled) {
      setChartOfAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const chartRef = collection(db, 'businesses', businessId, 'chartOfAccounts');
    const chartQuery = query(chartRef, orderBy('code'));

    const unsubscribe = onSnapshot(
      chartQuery,
      (snapshot) => {
        setChartOfAccounts(
          snapshot.docs.map((docSnapshot) =>
            normalizeChartOfAccountRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
            ),
          ),
        );
        setLoading(false);
        setError(null);
      },
      (cause) => {
        console.error('Error cargando chartOfAccounts:', cause);
        setError('No se pudo cargar el catálogo de cuentas.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessId, enabled]);

  const chartAccountOptions = useMemo(
    () =>
      chartOfAccounts.map((account) => ({
        label: `${account.code} · ${account.name}`,
        value: account.id,
      })),
    [chartOfAccounts],
  );

  const addChartOfAccount = useCallback(
    async (draftInput: Partial<ChartOfAccountDraft>) => {
      if (!businessId) {
        message.error('No se encontró un negocio activo para guardar la cuenta.');
        return false;
      }

      const draft = normalizeChartOfAccountDraft(draftInput);
      if (!draft.code || !draft.name) {
        message.error('La cuenta contable requiere código y nombre.');
        return false;
      }

      if (chartOfAccounts.some((account) => buildCodeKey(account.code) === buildCodeKey(draft.code))) {
        message.error('Ya existe una cuenta con ese código.');
        return false;
      }

      if (draft.parentId) {
        const parentAccount =
          chartOfAccounts.find((account) => account.id === draft.parentId) ?? null;

        if (!parentAccount) {
          message.error('La cuenta padre seleccionada no existe.');
          return false;
        }

        if (parentAccount.status !== 'active') {
          message.error('La cuenta padre debe estar activa.');
          return false;
        }

        if (parentAccount.type !== draft.type) {
          message.error(
            'La cuenta padre debe pertenecer al mismo tipo contable.',
          );
          return false;
        }
      }

      setSaving(true);
      try {
        const accountRef = doc(
          collection(db, 'businesses', businessId, 'chartOfAccounts'),
        );
        const now = Timestamp.now();
        const accountSnapshot = buildChartOfAccountSnapshot({
          businessId,
          chartOfAccountId: accountRef.id,
          draft,
          status: 'active',
        });
        const batch = writeBatch(db);

        batch.set(accountRef, {
          ...accountSnapshot,
          createdAt: now,
          updatedAt: now,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        });
        await batch.commit();

        message.success('Cuenta contable creada.');
        return true;
      } catch (cause) {
        console.error('Error creando cuenta contable:', cause);
        message.error('No se pudo crear la cuenta contable.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [businessId, chartOfAccounts, userId],
  );

  const updateChartOfAccount = useCallback(
    async (
      chartOfAccountId: string,
      draftInput: Partial<ChartOfAccountDraft>,
    ) => {
      if (!businessId) {
        message.error(
          'No se encontró un negocio activo para actualizar la cuenta.',
        );
        return false;
      }

      const existingAccount =
        chartOfAccounts.find((account) => account.id === chartOfAccountId) ?? null;
      if (!existingAccount) {
        message.error('La cuenta contable ya no existe.');
        return false;
      }

      const draft = normalizeChartOfAccountDraft({
        ...existingAccount,
        ...draftInput,
      });

      if (!draft.code || !draft.name) {
        message.error('La cuenta contable requiere código y nombre.');
        return false;
      }

      const duplicateAccount = chartOfAccounts.find(
        (account) =>
          account.id !== chartOfAccountId &&
          buildCodeKey(account.code) === buildCodeKey(draft.code),
      );
      if (duplicateAccount) {
        message.error('Ya existe otra cuenta con ese código.');
        return false;
      }

      if (draft.parentId === chartOfAccountId) {
        message.error('Una cuenta no puede ser padre de sí misma.');
        return false;
      }

      const descendantIds = collectChartOfAccountDescendantIds(
        chartOfAccounts,
        chartOfAccountId,
      );
      if (draft.parentId && descendantIds.has(draft.parentId)) {
        message.error(
          'La cuenta padre no puede ser una subcuenta de la cuenta actual.',
        );
        return false;
      }

      if (draft.parentId) {
        const parentAccount =
          chartOfAccounts.find((account) => account.id === draft.parentId) ?? null;

        if (!parentAccount) {
          message.error('La cuenta padre seleccionada no existe.');
          return false;
        }

        if (parentAccount.status !== 'active') {
          message.error('La cuenta padre debe estar activa.');
          return false;
        }

        if (parentAccount.type !== draft.type) {
          message.error(
            'La cuenta padre debe pertenecer al mismo tipo contable.',
          );
          return false;
        }
      }

      const childrenWithDifferentType = chartOfAccounts.filter(
        (account) =>
          account.parentId === chartOfAccountId && account.type !== draft.type,
      );
      if (childrenWithDifferentType.length > 0) {
        message.error(
          'No puedes cambiar el tipo porque hay subcuentas con otro tipo contable.',
        );
        return false;
      }

      const currentComparableDraft = normalizeChartOfAccountDraft(existingAccount);
      if (
        JSON.stringify(serializeDraftForComparison(draft)) ===
        JSON.stringify(serializeDraftForComparison(currentComparableDraft))
      ) {
        message.info('No hubo cambios nuevos en la cuenta contable.');
        return true;
      }

      setSaving(true);
      try {
        const accountRef = doc(
          db,
          'businesses',
          businessId,
          'chartOfAccounts',
          chartOfAccountId,
        );
        const now = Timestamp.now();
        const nextMetadata = {
          ...(existingAccount.metadata ?? {}),
          ...(draft.metadata ?? {}),
        };
        const nextSnapshot = buildChartOfAccountSnapshot({
          businessId,
          chartOfAccountId,
          draft,
          metadata: nextMetadata,
          status: existingAccount.status,
        });
        const batch = writeBatch(db);

        batch.set(
          accountRef,
          {
            ...nextSnapshot,
            updatedAt: now,
            updatedBy: userId ?? null,
          },
          { merge: true },
        );
        await batch.commit();

        message.success('Cuenta contable actualizada.');
        return true;
      } catch (cause) {
        console.error('Error actualizando cuenta contable:', cause);
        message.error('No se pudo actualizar la cuenta contable.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [businessId, chartOfAccounts, userId],
  );

  const updateChartOfAccountStatus = useCallback(
    async (chartOfAccountId: string, status: ChartOfAccount['status']) => {
      if (!businessId) {
        message.error('No se encontró un negocio activo para actualizar la cuenta.');
        return;
      }

      const targetAccount =
        chartOfAccounts.find((account) => account.id === chartOfAccountId) ?? null;
      if (!targetAccount) {
        message.error('La cuenta contable ya no existe.');
        return false;
      }

      if (targetAccount.status === status) {
        return true;
      }

      if (
        status === 'inactive' &&
        chartOfAccounts.some(
          (account) =>
            account.parentId === chartOfAccountId && account.status === 'active',
        )
      ) {
        message.error(
          'No puedes desactivar una cuenta que todavía tiene subcuentas activas.',
        );
        return false;
      }

      setSaving(true);
      try {
        const accountRef = doc(
          db,
          'businesses',
          businessId,
          'chartOfAccounts',
          chartOfAccountId,
        );
        const now = Timestamp.now();
        const batch = writeBatch(db);

        batch.set(
          accountRef,
          {
            status,
            updatedAt: now,
            updatedBy: userId ?? null,
          },
          { merge: true },
        );
        await batch.commit();

        message.success(
          status === 'active'
            ? 'Cuenta contable activada.'
            : 'Cuenta contable desactivada.',
        );
        return true;
      } catch (cause) {
        console.error('Error actualizando estado de cuenta contable:', cause);
        message.error('No se pudo actualizar el estado de la cuenta contable.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [businessId, chartOfAccounts, userId],
  );

  const seedDefaultChartOfAccounts = useCallback(async () => {
    if (!businessId) {
      message.error('No se encontró un negocio activo para sembrar el catálogo.');
      return;
    }

    const existingByCode = new Map(
      chartOfAccounts.map((account) => [account.code, account]),
    );
    const templatesToCreate = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.filter(
      (template) => !existingByCode.has(template.code),
    );

    if (!templatesToCreate.length) {
      message.info('La plantilla base ya está cargada en este negocio.');
      return;
    }

    setSeeding(true);
    try {
      const chartRef = collection(db, 'businesses', businessId, 'chartOfAccounts');
      const refsByCode = new Map(
        templatesToCreate.map((template) => [template.code, doc(chartRef)]),
      );
      const batch = writeBatch(db);
      const now = Timestamp.now();

      templatesToCreate.forEach((template) => {
        const accountRef = refsByCode.get(template.code);
        if (!accountRef) return;

        const parentId = template.parentCode
          ? existingByCode.get(template.parentCode)?.id ??
            refsByCode.get(template.parentCode)?.id ??
            null
          : null;
        const accountSnapshot = buildChartOfAccountSnapshot({
          businessId,
          chartOfAccountId: accountRef.id,
          draft: {
            ...template,
            parentId,
            currencyMode:
              template.systemKey === 'bank' && functionalCurrency !== 'DOP'
                ? 'multi_currency_reference'
                : template.currencyMode,
            metadata: {
              seededBy: 'default_chart_template',
            },
          },
          metadata: {
            seededBy: 'default_chart_template',
          },
          status: 'active',
        });

        batch.set(accountRef, {
          ...accountSnapshot,
          createdAt: now,
          updatedAt: now,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        });
      });

      await batch.commit();
      message.success('Plantilla base de catálogo de cuentas creada.');
    } catch (cause) {
      console.error('Error sembrando chartOfAccounts:', cause);
      message.error('No se pudo cargar la plantilla base del catálogo.');
    } finally {
      setSeeding(false);
    }
  }, [businessId, chartOfAccounts, functionalCurrency, userId]);

  return {
    addChartOfAccount,
    chartAccountOptions,
    chartOfAccounts,
    error,
    loading,
    saving,
    seeding,
    seedDefaultChartOfAccounts,
    updateChartOfAccount,
    updateChartOfAccountStatus,
  };
};
