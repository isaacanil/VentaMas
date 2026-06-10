import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { collection, onSnapshot } from 'firebase/firestore';

import {
  createAccountingPostingProfileConfig,
  disableAccountingPostingProfileConfig,
  updateAccountingPostingProfileConfig,
} from '@/firebase/accounting/accountingConfiguration';
import { db } from '@/firebase/firebaseconfig';
import type { AccountingPostingProfile, ChartOfAccount } from '@/types/accounting';
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

    if (!account.postingAllowed) {
      return 'Todas las cuentas usadas en reglas de contabilización deben permitir asientos directos.';
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
      'accountSystemKey' in line ? line.accountSystemKey ?? null : null,
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
  const [postingProfiles, setPostingProfiles] = useState<
    AccountingPostingProfile[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !enabled) {
      setPostingProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const profilesRef = collection(
      db,
      'businesses',
      businessId,
      'accountingPostingProfiles',
    );

    const unsubscribe = onSnapshot(
      profilesRef,
      (snapshot) => {
        const nextProfiles = snapshot.docs
          .map((docSnapshot) =>
            normalizeAccountingPostingProfileRecord(
              docSnapshot.id,
              businessId,
              docSnapshot.data(),
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

        setPostingProfiles(nextProfiles);
        setLoading(false);
        setError(null);
      },
      (cause) => {
        console.error('Error cargando accountingPostingProfiles:', cause);
        setError('No se pudieron cargar las reglas de contabilización.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessId, chartOfAccounts, enabled]);

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
        postingProfiles.find((profile) => profile.id === postingProfileId) ?? null;
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
        postingProfiles.find((profile) => profile.id === postingProfileId) ?? null;
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
        console.error('Error actualizando estado de regla de contabilización:', cause);
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

    const draftTemplates = buildDefaultAccountingPostingProfileTemplates(
      chartOfAccounts,
    );
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
      message.info('La plantilla base de reglas de contabilización ya está cargada.');
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
      message.error('No se pudieron cargar las reglas de contabilización base.');
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
