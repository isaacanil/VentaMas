import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MutableRefObject,
} from 'react';
import { message } from 'antd';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import {
  createChartOfAccountConfig,
  disableChartOfAccountConfig,
  updateChartOfAccountConfig,
} from '@/firebase/accounting/accountingConfiguration';
import { db } from '@/firebase/firebaseconfig';
import type { ChartOfAccount } from '@/types/accounting';
import {
  CHART_OF_ACCOUNTS_MAX_LEVEL,
  buildChartOfAccountChildrenByParentId,
  buildChartOfAccountsById,
  collectChartOfAccountDescendantIds,
  DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE,
  getChartOfAccountLevel,
  getChartOfAccountMaxDescendantDepth,
  normalizeChartOfAccountDraft,
  normalizeChartOfAccountRecord,
  type ChartOfAccountDraft,
} from '@/utils/accounting/chartOfAccounts';

interface UseChartOfAccountsArgs {
  businessId: string | null;
  enabled: boolean;
  functionalCurrency: string;
  referencedAccountIdsRef?: MutableRefObject<Set<string>>;
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

const serializeStructuralDraftForComparison = (
  draft: ChartOfAccountDraft,
): Record<string, unknown> => ({
  code: draft.code,
  type: draft.type,
  parentId: draft.parentId ?? null,
  postingAllowed: draft.postingAllowed !== false,
  normalSide: draft.normalSide,
  currencyMode: draft.currencyMode,
});

const hasProtectedStructuralChanges = (
  currentAccount: ChartOfAccount,
  nextDraft: ChartOfAccountDraft,
) =>
  JSON.stringify(
    serializeStructuralDraftForComparison(
      normalizeChartOfAccountDraft(currentAccount),
    ),
  ) !== JSON.stringify(serializeStructuralDraftForComparison(nextDraft));

const getProtectedAccountReason = ({
  account,
  referencedAccountIds,
}: {
  account: ChartOfAccount;
  referencedAccountIds: Set<string>;
}) => {
  if (account.systemKey) {
    return 'La cuenta es canónica del sistema.';
  }

  if (referencedAccountIds.has(account.id)) {
    return 'La cuenta ya está referenciada por reglas de contabilización.';
  }

  return null;
};

export const useChartOfAccounts = ({
  businessId,
  enabled,
  functionalCurrency,
  referencedAccountIdsRef,
  userId,
}: UseChartOfAccountsArgs) => {
  const queryKey =
    businessId && enabled ? `chartOfAccounts:${businessId}` : null;
  const [snapshotState, setSnapshotState] = useState<{
    chartOfAccounts: ChartOfAccount[];
    error: string | null;
    key: string | null;
  }>({
    chartOfAccounts: [],
    error: null,
    key: null,
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!queryKey || !businessId) return undefined;

    const chartRef = collection(
      db,
      'businesses',
      businessId,
      'chartOfAccounts',
    );
    const chartQuery = query(chartRef, orderBy('code'));

    const unsubscribe = onSnapshot(
      chartQuery,
      (snapshot) => {
        setSnapshotState({
          chartOfAccounts: snapshot.docs.map((docSnapshot) =>
            normalizeChartOfAccountRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
            ),
          ),
          error: null,
          key: queryKey,
        });
      },
      (cause) => {
        console.error('Error cargando chartOfAccounts:', cause);
        setSnapshotState({
          chartOfAccounts: [],
          error: 'No se pudo cargar el catálogo de cuentas.',
          key: queryKey,
        });
      },
    );

    return unsubscribe;
  }, [businessId, queryKey]);

  const chartOfAccounts = useMemo(
    () =>
      queryKey && snapshotState.key === queryKey
        ? snapshotState.chartOfAccounts
        : [],
    [queryKey, snapshotState.chartOfAccounts, snapshotState.key],
  );
  const loading = Boolean(queryKey && snapshotState.key !== queryKey);
  const error =
    queryKey && snapshotState.key === queryKey ? snapshotState.error : null;

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
        message.error(
          'No se encontró un negocio activo para guardar la cuenta.',
        );
        return false;
      }

      const draft = normalizeChartOfAccountDraft(draftInput);
      if (!draft.code || !draft.name) {
        message.error('La cuenta contable requiere código y nombre.');
        return false;
      }

      if (
        chartOfAccounts.some(
          (account) => buildCodeKey(account.code) === buildCodeKey(draft.code),
        )
      ) {
        message.error('Ya existe una cuenta con ese código.');
        return false;
      }

      if (draft.parentId) {
        const accountsById = buildChartOfAccountsById(chartOfAccounts);
        const parentAccount = accountsById.get(draft.parentId) ?? null;

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

        if (
          getChartOfAccountLevel(parentAccount, accountsById) >=
          CHART_OF_ACCOUNTS_MAX_LEVEL
        ) {
          message.error(
            `El catálogo solo permite subcuentas hasta el nivel ${CHART_OF_ACCOUNTS_MAX_LEVEL}.`,
          );
          return false;
        }
      }

      setSaving(true);
      try {
        await createChartOfAccountConfig({
          businessId,
          account: {
            ...draft,
            status: 'active',
          },
          clientUserId: userId,
        });

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
        chartOfAccounts.find((account) => account.id === chartOfAccountId) ??
        null;
      if (!existingAccount) {
        message.error('La cuenta contable ya no existe.');
        return false;
      }

      const draft = normalizeChartOfAccountDraft({
        ...existingAccount,
        ...draftInput,
      });
      const referencedAccountIds =
        referencedAccountIdsRef?.current ?? new Set();
      const protectedAccountReason = getProtectedAccountReason({
        account: existingAccount,
        referencedAccountIds,
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
        const accountsById = buildChartOfAccountsById(chartOfAccounts);
        const parentAccount = accountsById.get(draft.parentId) ?? null;

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

        const childrenByParentId =
          buildChartOfAccountChildrenByParentId(chartOfAccounts);
        const parentLevel = getChartOfAccountLevel(parentAccount, accountsById);
        const maxDescendantDepth = getChartOfAccountMaxDescendantDepth(
          chartOfAccountId,
          childrenByParentId,
        );

        if (
          parentLevel + 1 + maxDescendantDepth >
          CHART_OF_ACCOUNTS_MAX_LEVEL
        ) {
          message.error(
            `Mover esta cuenta excedería el nivel ${CHART_OF_ACCOUNTS_MAX_LEVEL} permitido.`,
          );
          return false;
        }
      }

      const hasChildren = chartOfAccounts.some(
        (account) => account.parentId === chartOfAccountId,
      );
      if (hasChildren && draft.postingAllowed !== false) {
        message.error(
          'Una Cuenta Mayor con subcuentas no puede recibir asientos directos.',
        );
        return false;
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

      const currentComparableDraft =
        normalizeChartOfAccountDraft(existingAccount);
      if (
        JSON.stringify(serializeDraftForComparison(draft)) ===
        JSON.stringify(serializeDraftForComparison(currentComparableDraft))
      ) {
        message.info('No hubo cambios nuevos en la cuenta contable.');
        return true;
      }

      if (
        protectedAccountReason &&
        hasProtectedStructuralChanges(existingAccount, draft)
      ) {
        message.error(
          `${protectedAccountReason} Crea otra cuenta y remapea la configuración en vez de editar su estructura.`,
        );
        return false;
      }

      setSaving(true);
      try {
        const nextMetadata = {
          ...existingAccount.metadata,
          ...draft.metadata,
        };
        await updateChartOfAccountConfig({
          businessId,
          accountId: chartOfAccountId,
          account: {
            ...draft,
            metadata: nextMetadata,
            status: existingAccount.status,
          },
          clientUserId: userId,
        });

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
    [businessId, chartOfAccounts, referencedAccountIdsRef, userId],
  );

  const updateChartOfAccountStatus = useCallback(
    async (chartOfAccountId: string, status: ChartOfAccount['status']) => {
      if (!businessId) {
        message.error(
          'No se encontró un negocio activo para actualizar la cuenta.',
        );
        return;
      }

      const targetAccount =
        chartOfAccounts.find((account) => account.id === chartOfAccountId) ??
        null;
      if (!targetAccount) {
        message.error('La cuenta contable ya no existe.');
        return false;
      }

      if (targetAccount.status === status) {
        return true;
      }

      const referencedAccountIds =
        referencedAccountIdsRef?.current ?? new Set();
      const protectedAccountReason = getProtectedAccountReason({
        account: targetAccount,
        referencedAccountIds,
      });
      if (status === 'inactive' && protectedAccountReason) {
        message.error(
          `${protectedAccountReason} No se puede desactivar desde esta pantalla.`,
        );
        return false;
      }

      if (
        status === 'inactive' &&
        chartOfAccounts.some(
          (account) =>
            account.parentId === chartOfAccountId &&
            account.status === 'active',
        )
      ) {
        message.error(
          'No puedes desactivar una cuenta que todavía tiene subcuentas activas.',
        );
        return false;
      }

      setSaving(true);
      try {
        if (status === 'inactive') {
          await disableChartOfAccountConfig({
            businessId,
            accountId: chartOfAccountId,
            clientUserId: userId,
          });
        } else {
          await updateChartOfAccountConfig({
            businessId,
            accountId: chartOfAccountId,
            account: {
              ...targetAccount,
              status,
            },
            clientUserId: userId,
          });
        }

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
    [businessId, chartOfAccounts, referencedAccountIdsRef, userId],
  );

  const seedDefaultChartOfAccounts = useCallback(async () => {
    if (!businessId) {
      message.error(
        'No se encontró un negocio activo para sembrar el catálogo.',
      );
      return;
    }

    const existingByCode = new Map(
      chartOfAccounts.map((account) => [account.code, account]),
    );
    const existingBySystemKey = new Map(
      chartOfAccounts
        .filter((account) => account.systemKey)
        .map((account) => [account.systemKey as string, account]),
    );
    const conflictingCanonicalTemplates =
      DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.filter((template) => {
        if (!template.systemKey) {
          return false;
        }

        const existingCanonicalAccount =
          existingBySystemKey.get(template.systemKey) ?? null;
        return Boolean(
          existingCanonicalAccount &&
          existingCanonicalAccount.code !== template.code,
        );
      });

    if (conflictingCanonicalTemplates.length) {
      message.error(
        'Hay cuentas canónicas renombradas o movidas. Revisa esas cuentas antes de completar la plantilla base.',
      );
      return;
    }

    const templatesToCreate = DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE.filter(
      (template) =>
        !existingByCode.has(template.code) &&
        (!template.systemKey || !existingBySystemKey.has(template.systemKey)),
    );

    if (!templatesToCreate.length) {
      message.info('La plantilla base ya está cargada en este negocio.');
      return;
    }

    setSeeding(true);
    try {
      const createdByCode = new Map<string, string>();

      for (const template of templatesToCreate) {
        const parentId = template.parentCode
          ? (existingByCode.get(template.parentCode)?.id ??
            createdByCode.get(template.parentCode) ??
            null)
          : null;
        const result = await createChartOfAccountConfig({
          businessId,
          account: {
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
          clientUserId: userId,
        });
        createdByCode.set(template.code, result.accountId);
      }
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
