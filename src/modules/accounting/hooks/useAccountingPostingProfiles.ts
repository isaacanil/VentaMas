import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { collection, onSnapshot } from 'firebase/firestore';

import {
  createAccountingPostingProfileConfig,
  disableAccountingPostingProfileConfig,
  updateAccountingPostingProfileConfig,
} from '@/firebase/accounting/accountingConfiguration';
import { db } from '@/firebase/firebaseconfig';
import type {
  AccountingPostingProfile,
  ChartOfAccount,
} from '@/types/accounting';
import {
  buildChartOfAccountChildrenByParentId,
  isChartOfAccountPostingAllowedForEntries,
} from '@/utils/accounting/chartOfAccounts';
import {
  buildDefaultAccountingPostingProfileTemplates,
  normalizeAccountingPostingProfileDraft,
  normalizeAccountingPostingProfileRecord,
  type AccountingPostingProfileDraft,
} from '@/utils/accounting/postingProfiles';

interface UseAccountingPostingProfilesArgs {
  businessId: string | null;
  chartOfAccounts: ChartOfAccount[];
  enabled: boolean;
  userId: string | null;
}

interface PostingProfileSnapshotRecord {
  data: unknown;
  id: string;
}

const buildValidationError = ({
  chartOfAccounts,
  currentProfileId,
  draft,
  postingProfiles,
}: {
  chartOfAccounts: ChartOfAccount[];
  currentProfileId?: string;
  draft: AccountingPostingProfileDraft;
  postingProfiles: AccountingPostingProfile[];
}): string | null => {
  if (!draft.name.trim()) {
    return 'La regla de contabilización requiere un nombre.';
  }

  if (draft.linesTemplate.length < 2) {
    return 'La regla de contabilización requiere al menos dos líneas.';
  }

  const hasDebit = draft.linesTemplate.some((line) => line.side === 'debit');
  const hasCredit = draft.linesTemplate.some((line) => line.side === 'credit');
  if (!hasDebit || !hasCredit) {
    return 'La regla de contabilización debe tener por lo menos una línea débito y una crédito.';
  }

  const accountsById = new Map(
    chartOfAccounts.map((account) => [account.id, account]),
  );
  const childCountByParentId =
    buildChartOfAccountChildrenByParentId(chartOfAccounts);
  for (const line of draft.linesTemplate) {
    if (!line.accountId) {
      return 'Todas las lineas deben apuntar a una cuenta contable.';
    }

    const account = accountsById.get(line.accountId) ?? null;
    if (!account) {
      return 'Una de las cuentas seleccionadas ya no existe.';
    }

    if (account.status !== 'active') {
      return 'Todas las cuentas usadas en reglas de contabilización deben estar activas.';
    }

    if (
      !isChartOfAccountPostingAllowedForEntries(
        account,
        childCountByParentId.get(account.id)?.length ?? 0,
      )
    ) {
      return 'Todas las cuentas usadas en reglas de contabilización deben ser Cuentas Detalle.';
    }
  }

  const duplicatePriority = postingProfiles.find(
    (profile) =>
      profile.id !== currentProfileId &&
      profile.eventType === draft.eventType &&
      profile.priority === draft.priority,
  );
  if (duplicatePriority) {
    return 'Ya existe otra regla de contabilización con esa prioridad para el mismo evento.';
  }

  return null;
};

const normalizeConditionsForComparison = (
  conditions: AccountingPostingProfileDraft['conditions'],
) => ({
  paymentTerm: conditions?.paymentTerm ?? 'any',
  settlementKind: conditions?.settlementKind ?? 'any',
  taxTreatment: conditions?.taxTreatment ?? 'any',
  documentNature: conditions?.documentNature ?? 'any',
  settlementTiming: conditions?.settlementTiming ?? 'any',
  transferDirection: conditions?.transferDirection ?? 'any',
});

const serializeLinesTemplateForComparison = (
  linesTemplate: AccountingPostingProfileDraft['linesTemplate'],
) =>
  linesTemplate.map((line) => ({
    side: line.side,
    accountId: line.accountId ?? null,
    accountSystemKey:
      'accountSystemKey' in line ? (line.accountSystemKey ?? null) : null,
    amountSource: line.amountSource,
    description: line.description ?? null,
    omitIfZero: line.omitIfZero !== false,
    metadata: line.metadata ?? {},
  }));

const hasStructuralPostingProfileChanges = ({
  draft,
  existingProfile,
}: {
  draft: AccountingPostingProfileDraft;
  existingProfile: AccountingPostingProfile;
}) =>
  JSON.stringify({
    priority: draft.priority,
    conditions: normalizeConditionsForComparison(draft.conditions),
    linesTemplate: serializeLinesTemplateForComparison(draft.linesTemplate),
  }) !==
  JSON.stringify({
    priority: existingProfile.priority,
    conditions: normalizeConditionsForComparison(existingProfile.conditions),
    linesTemplate: serializeLinesTemplateForComparison(
      existingProfile.linesTemplate,
    ),
  });

export const useAccountingPostingProfiles = ({
  businessId,
  chartOfAccounts,
  enabled,
  userId,
}: UseAccountingPostingProfilesArgs) => {
  const queryKey =
    businessId && enabled ? `accountingPostingProfiles:${businessId}` : null;
  const [snapshotState, setSnapshotState] = useState<{
    error: string | null;
    key: string | null;
    records: PostingProfileSnapshotRecord[];
  }>({
    error: null,
    key: null,
    records: [],
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!queryKey || !businessId) return undefined;

    const profilesRef = collection(
      db,
      'businesses',
      businessId,
      'accountingPostingProfiles',
    );

    const unsubscribe = onSnapshot(
      profilesRef,
      (snapshot) => {
        setSnapshotState({
          error: null,
          key: queryKey,
          records: snapshot.docs.map((docSnapshot) => ({
            data: docSnapshot.data(),
            id: docSnapshot.id,
          })),
        });
      },
      (cause) => {
        console.error('Error cargando accountingPostingProfiles:', cause);
        setSnapshotState({
          error: 'No se pudieron cargar las reglas de contabilización.',
          key: queryKey,
          records: [],
        });
      },
    );

    return unsubscribe;
  }, [businessId, queryKey]);

  const postingProfiles = useMemo(() => {
    if (!businessId || !queryKey || snapshotState.key !== queryKey) {
      return [];
    }

    return snapshotState.records
      .map((record) =>
        normalizeAccountingPostingProfileRecord(
          record.id,
          businessId,
          record.data,
          chartOfAccounts,
        ),
      )
      .sort((left, right) => {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }

        if (left.eventType !== right.eventType) {
          return left.eventType.localeCompare(right.eventType);
        }

        return left.name.localeCompare(right.name);
      });
  }, [
    businessId,
    chartOfAccounts,
    queryKey,
    snapshotState.key,
    snapshotState.records,
  ]);
  const loading = Boolean(queryKey && snapshotState.key !== queryKey);
  const error =
    queryKey && snapshotState.key === queryKey ? snapshotState.error : null;

  const addPostingProfile = useCallback(
    async (draftInput: Partial<AccountingPostingProfileDraft>) => {
      if (!businessId) {
        message.error(
          'No se encontró un negocio activo para guardar la regla de contabilización.',
        );
        return false;
      }

      const draft = normalizeAccountingPostingProfileDraft(
        draftInput,
        chartOfAccounts,
      );
      const validationError = buildValidationError({
        chartOfAccounts,
        draft,
        postingProfiles,
      });
      if (validationError) {
        message.error(validationError);
        return false;
      }

      setSaving(true);
      try {
        await createAccountingPostingProfileConfig({
          businessId,
          profile: draft,
          clientUserId: userId,
        });

        message.success('Regla de contabilización creada.');
        return true;
      } catch (cause) {
        console.error('Error creando regla de contabilización:', cause);
        message.error('No se pudo crear la regla de contabilización.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [businessId, chartOfAccounts, postingProfiles, userId],
  );

  const updatePostingProfile = useCallback(
    async (
      postingProfileId: string,
      draftInput: Partial<AccountingPostingProfileDraft>,
    ) => {
      if (!businessId) {
        message.error(
          'No se encontró un negocio activo para actualizar la regla de contabilización.',
        );
        return false;
      }

      const existingProfile =
        postingProfiles.find((profile) => profile.id === postingProfileId) ??
        null;
      if (!existingProfile) {
        message.error('La regla de contabilización ya no existe.');
        return false;
      }

      const draft = normalizeAccountingPostingProfileDraft(
        {
          ...existingProfile,
          ...draftInput,
        },
        chartOfAccounts,
      );
      const validationError = buildValidationError({
        chartOfAccounts,
        currentProfileId: postingProfileId,
        draft,
        postingProfiles,
      });
      if (validationError) {
        message.error(validationError);
        return false;
      }

      const structuralChanges = hasStructuralPostingProfileChanges({
        draft,
        existingProfile,
      });

      setSaving(true);
      try {
        const nextMetadata = {
          ...existingProfile.metadata,
          ...draft.metadata,
        };
        const result = await updateAccountingPostingProfileConfig({
          businessId,
          profileId: postingProfileId,
          profile: {
            ...draft,
            metadata: nextMetadata,
          },
          clientUserId: userId,
        });

        message.success(
          structuralChanges || result.versioned
            ? 'Se creó una nueva versión de la regla de contabilización.'
            : 'Regla de contabilización actualizada.',
        );
        return true;
      } catch (cause) {
        console.error('Error actualizando regla de contabilización:', cause);
        message.error('No se pudo actualizar la regla de contabilización.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [businessId, chartOfAccounts, postingProfiles, userId],
  );

  const updatePostingProfileStatus = useCallback(
    async (
      postingProfileId: string,
      status: AccountingPostingProfile['status'],
    ) => {
      if (!businessId) {
        message.error(
          'No se encontró un negocio activo para actualizar la regla de contabilización.',
        );
        return false;
      }

      const existingProfile =
        postingProfiles.find((profile) => profile.id === postingProfileId) ??
        null;
      if (!existingProfile) {
        message.error('La regla de contabilización ya no existe.');
        return false;
      }

      if (existingProfile.status === status) {
        return true;
      }

      setSaving(true);
      try {
        if (status === 'inactive') {
          await disableAccountingPostingProfileConfig({
            businessId,
            profileId: postingProfileId,
            clientUserId: userId,
          });
        } else {
          await updateAccountingPostingProfileConfig({
            businessId,
            profileId: postingProfileId,
            profile: {
              ...existingProfile,
              status,
            },
            clientUserId: userId,
          });
        }

        message.success(
          status === 'active'
            ? 'Regla de contabilización activada.'
            : 'Regla de contabilización desactivada.',
        );
        return true;
      } catch (cause) {
        console.error(
          'Error actualizando estado de regla de contabilización:',
          cause,
        );
        message.error(
          'No se pudo actualizar el estado de la regla de contabilización.',
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [businessId, postingProfiles, userId],
  );

  const seedDefaultPostingProfiles = useCallback(async () => {
    if (!businessId) {
      message.error(
        'No se encontró un negocio activo para crear reglas de contabilización base.',
      );
      return false;
    }

    if (!chartOfAccounts.length) {
      message.error(
        'Carga primero el catálogo de cuentas antes de crear reglas de contabilización base.',
      );
      return false;
    }

    const draftTemplates =
      buildDefaultAccountingPostingProfileTemplates(chartOfAccounts);
    if (!draftTemplates.length) {
      message.error(
        'No hay suficientes cuentas canónicas para crear reglas de contabilización base.',
      );
      return false;
    }

    const existingSeedKeys = new Set(
      postingProfiles
        .map((profile) => profile.metadata?.seedKey)
        .filter((seedKey): seedKey is string => typeof seedKey === 'string'),
    );
    const templatesToCreate = draftTemplates.filter((template) => {
      const seedKey =
        typeof template.metadata?.seedKey === 'string'
          ? template.metadata.seedKey
          : null;
      return seedKey ? !existingSeedKeys.has(seedKey) : true;
    });

    if (!templatesToCreate.length) {
      message.info(
        'La plantilla base de reglas de contabilización ya está cargada.',
      );
      return true;
    }

    setSeeding(true);
    try {
      for (const template of templatesToCreate) {
        await createAccountingPostingProfileConfig({
          businessId,
          profile: {
            ...template,
            metadata: {
              ...template.metadata,
              seededBy: 'default_posting_profiles',
            },
          },
          clientUserId: userId,
        });
      }
      message.success('Reglas de contabilización base creadas.');
      return true;
    } catch (cause) {
      console.error('Error creando reglas de contabilización base:', cause);
      message.error(
        'No se pudieron cargar las reglas de contabilización base.',
      );
      return false;
    } finally {
      setSeeding(false);
    }
  }, [businessId, chartOfAccounts, postingProfiles, userId]);

  return {
    addPostingProfile,
    error,
    loading,
    postingProfiles,
    saving,
    seeding,
    seedDefaultPostingProfiles,
    updatePostingProfile,
    updatePostingProfileStatus,
  };
};
