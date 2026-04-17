import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

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
    return 'El perfil contable requiere un nombre.';
  }

  if (draft.linesTemplate.length < 2) {
    return 'El perfil contable requiere al menos dos líneas.';
  }

  const hasDebit = draft.linesTemplate.some((line) => line.side === 'debit');
  const hasCredit = draft.linesTemplate.some((line) => line.side === 'credit');
  if (!hasDebit || !hasCredit) {
    return 'El perfil contable debe tener por lo menos una línea débito y una crédito.';
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
      return 'Todas las cuentas usadas en perfiles contables deben estar activas.';
    }

    if (!account.postingAllowed) {
      return 'Todas las cuentas usadas en perfiles contables deben permitir asientos directos.';
    }
  }

  const duplicatePriority = postingProfiles.find(
    (profile) =>
      profile.id !== currentProfileId &&
      profile.eventType === draft.eventType &&
      profile.priority === draft.priority,
  );
  if (duplicatePriority) {
    return 'Ya existe otro perfil contable con esa prioridad para el mismo evento.';
  }

  return null;
};

const buildPostingProfileSnapshot = ({
  businessId,
  profileId,
  draft,
  metadata,
}: {
  businessId: string;
  profileId: string;
  draft: AccountingPostingProfileDraft;
  metadata?: Record<string, unknown> | null;
}) => ({
  id: profileId,
  businessId,
  name: draft.name,
  description: draft.description ?? null,
  eventType: draft.eventType,
  moduleKey: draft.moduleKey,
  status: draft.status ?? 'active',
  priority: draft.priority,
  conditions: draft.conditions ?? {},
  linesTemplate: draft.linesTemplate,
  metadata: metadata ?? draft.metadata ?? {},
});

const normalizeConditionsForComparison = (
  conditions: AccountingPostingProfileDraft['conditions'],
) => ({
  paymentTerm: conditions?.paymentTerm ?? 'any',
  settlementKind: conditions?.settlementKind ?? 'any',
  taxTreatment: conditions?.taxTreatment ?? 'any',
  documentNature: conditions?.documentNature ?? 'any',
  settlementTiming: conditions?.settlementTiming ?? 'any',
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
        setError('No se pudieron cargar los perfiles contables.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessId, chartOfAccounts, enabled]);

  const addPostingProfile = useCallback(
    async (draftInput: Partial<AccountingPostingProfileDraft>) => {
      if (!businessId) {
        message.error(
          'No se encontró un negocio activo para guardar el perfil contable.',
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
        const profileRef = doc(
          collection(db, 'businesses', businessId, 'accountingPostingProfiles'),
        );
        const now = Timestamp.now();
        const profileSnapshot = buildPostingProfileSnapshot({
          businessId,
          profileId: profileRef.id,
          draft,
        });
        const batch = writeBatch(db);

        batch.set(profileRef, {
          ...profileSnapshot,
          createdAt: now,
          updatedAt: now,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        });
        await batch.commit();

        message.success('Perfil contable creado.');
        return true;
      } catch (cause) {
        console.error('Error creando perfil contable:', cause);
        message.error('No se pudo crear el perfil contable.');
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
          'No se encontró un negocio activo para actualizar el perfil contable.',
        );
        return false;
      }

      const existingProfile =
        postingProfiles.find((profile) => profile.id === postingProfileId) ?? null;
      if (!existingProfile) {
        message.error('El perfil contable ya no existe.');
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
        const now = Timestamp.now();
        const nextMetadata = {
          ...(existingProfile.metadata ?? {}),
          ...(draft.metadata ?? {}),
        };
        const collectionRef = collection(
          db,
          'businesses',
          businessId,
          'accountingPostingProfiles',
        );
        const profileRef = doc(collectionRef, postingProfileId);
        const batch = writeBatch(db);

        if (structuralChanges) {
          const rootProfileId =
            typeof existingProfile.metadata?.rootProfileId === 'string'
              ? existingProfile.metadata.rootProfileId
              : postingProfileId;
          const currentVersion =
            typeof existingProfile.metadata?.profileVersion === 'number' &&
            Number.isFinite(existingProfile.metadata.profileVersion)
              ? existingProfile.metadata.profileVersion
              : 1;
          const nextProfileRef = doc(collectionRef);
          const nextSnapshot = buildPostingProfileSnapshot({
            businessId,
            profileId: nextProfileRef.id,
            draft,
            metadata: {
              ...nextMetadata,
              rootProfileId,
              profileVersion: currentVersion + 1,
              previousProfileId: postingProfileId,
            },
          });

          batch.set(nextProfileRef, {
            ...nextSnapshot,
            createdAt: now,
            updatedAt: now,
            createdBy: userId ?? null,
            updatedBy: userId ?? null,
          });
          batch.set(
            profileRef,
            {
              status: 'inactive',
              updatedAt: now,
              updatedBy: userId ?? null,
              metadata: {
                ...(existingProfile.metadata ?? {}),
                rootProfileId,
                profileVersion: currentVersion,
                replacedByProfileId: nextProfileRef.id,
              },
            },
            { merge: true },
          );
        } else {
          const nextSnapshot = buildPostingProfileSnapshot({
            businessId,
            profileId: postingProfileId,
            draft,
            metadata: nextMetadata,
          });

          batch.set(
            profileRef,
            {
              ...nextSnapshot,
              updatedAt: now,
              updatedBy: userId ?? null,
            },
            { merge: true },
          );
        }
        await batch.commit();

        message.success(
          structuralChanges
            ? 'Se creó una nueva versión del perfil contable.'
            : 'Perfil contable actualizado.',
        );
        return true;
      } catch (cause) {
        console.error('Error actualizando perfil contable:', cause);
        message.error('No se pudo actualizar el perfil contable.');
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
          'No se encontró un negocio activo para actualizar el perfil contable.',
        );
        return false;
      }

      const existingProfile =
        postingProfiles.find((profile) => profile.id === postingProfileId) ?? null;
      if (!existingProfile) {
        message.error('El perfil contable ya no existe.');
        return false;
      }

      if (existingProfile.status === status) {
        return true;
      }

      setSaving(true);
      try {

        const profileRef = doc(
          db,
          'businesses',
          businessId,
          'accountingPostingProfiles',
          postingProfileId,
        );
        const now = Timestamp.now();
        const batch = writeBatch(db);

        batch.set(
          profileRef,
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
            ? 'Perfil contable activado.'
            : 'Perfil contable desactivado.',
        );
        return true;
      } catch (cause) {
        console.error('Error actualizando estado de perfil contable:', cause);
        message.error(
          'No se pudo actualizar el estado del perfil contable.',
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
        'No se encontró un negocio activo para sembrar perfiles contables.',
      );
      return false;
    }

    if (!chartOfAccounts.length) {
      message.error(
        'Carga primero el catálogo de cuentas antes de sembrar perfiles contables.',
      );
      return false;
    }

    const draftTemplates = buildDefaultAccountingPostingProfileTemplates(
      chartOfAccounts,
    );
    if (!draftTemplates.length) {
      message.error(
        'No hay suficientes cuentas canónicas para sembrar perfiles contables base.',
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
      message.info('La plantilla base de perfiles contables ya está cargada.');
      return true;
    }

    setSeeding(true);
    try {
      const collectionRef = collection(
        db,
        'businesses',
        businessId,
        'accountingPostingProfiles',
      );
      const batch = writeBatch(db);
      const now = Timestamp.now();

      templatesToCreate.forEach((template) => {
        const profileRef = doc(collectionRef);
        const profileSnapshot = buildPostingProfileSnapshot({
          businessId,
          profileId: profileRef.id,
          draft: template,
          metadata: {
            ...(template.metadata ?? {}),
            seededBy: 'default_posting_profiles',
          },
        });
        batch.set(profileRef, {
          ...profileSnapshot,
          createdAt: now,
          updatedAt: now,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        });
      });

      await batch.commit();
      message.success('Perfiles contables base creados.');
      return true;
    } catch (cause) {
      console.error('Error sembrando perfiles contables:', cause);
      message.error('No se pudieron cargar los perfiles contables base.');
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
