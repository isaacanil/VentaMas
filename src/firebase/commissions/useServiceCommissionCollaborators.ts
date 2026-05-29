import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type {
  ServiceCommissionCollaboratorRecord,
  ServiceCommissionType,
} from '@/types/commissions';

interface ServiceCommissionCollaboratorsState {
  businessId: string | null;
  error: Error | null;
  loading: boolean;
  rows: ServiceCommissionCollaboratorRecord[];
}

export interface ServiceCommissionCollaboratorInput {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  linkedUserId?: string | null;
  hrEmployeeId?: string | null;
  partyId?: string | null;
  defaultType?: ServiceCommissionType | null;
  defaultRate?: number | string | null;
  active?: boolean;
  notes?: string | null;
}

interface SaveServiceCommissionCollaboratorArgs {
  businessId: string;
  collaborator: ServiceCommissionCollaboratorInput;
  userId?: string | null;
}

const EMPTY_STATE: ServiceCommissionCollaboratorsState = {
  businessId: null,
  rows: [],
  loading: false,
  error: null,
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeType = (
  value: unknown,
  fallback: ServiceCommissionType = 'percentage',
): ServiceCommissionType =>
  value === 'fixed' || value === 'percentage' ? value : fallback;

export const resolveServiceCommissionCollaboratorId = (
  collaborator: ServiceCommissionCollaboratorInput,
): string | null => {
  const source =
    toCleanString(collaborator.id) ?? toCleanString(collaborator.code);
  const normalized = source
    ?.toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
  return normalized || null;
};

const normalizeCollaboratorRecord = (
  id: string,
  data: Record<string, unknown>,
): ServiceCommissionCollaboratorRecord => {
  const code = toCleanString(data.code) ?? id;
  const name =
    toCleanString(data.name) ??
    toCleanString(data.displayName) ??
    toCleanString(data.email) ??
    code;
  const defaultRate =
    data.defaultRate == null
      ? null
      : Math.max(0, toFiniteNumber(data.defaultRate));

  return {
    ...data,
    id,
    businessId: toCleanString(data.businessId) ?? '',
    code,
    name,
    linkedUserId: toCleanString(data.linkedUserId),
    hrEmployeeId: toCleanString(data.hrEmployeeId),
    partyId: toCleanString(data.partyId),
    defaultType: normalizeType(data.defaultType),
    defaultRate,
    active: data.active !== false,
    notes: toCleanString(data.notes),
  };
};

export const saveServiceCommissionCollaborator = async ({
  businessId,
  collaborator,
  userId = null,
}: SaveServiceCommissionCollaboratorArgs): Promise<string> => {
  const id = resolveServiceCommissionCollaboratorId(collaborator);
  const code = toCleanString(collaborator.code);
  const name = toCleanString(collaborator.name);

  if (!businessId) {
    throw new Error('Falta el negocio para guardar el colaborador.');
  }

  if (!id || !code || !name) {
    throw new Error('El codigo y el nombre del colaborador son requeridos.');
  }

  const defaultType = normalizeType(collaborator.defaultType);
  const defaultRate = Math.max(0, toFiniteNumber(collaborator.defaultRate));
  const isExistingCollaborator = Boolean(toCleanString(collaborator.id));
  const collaboratorRef = doc(
    db,
    'businesses',
    businessId,
    'serviceCommissionCollaborators',
    id,
  );

  await setDoc(
    collaboratorRef,
    {
      id,
      businessId,
      code,
      name,
      linkedUserId: toCleanString(collaborator.linkedUserId),
      hrEmployeeId: toCleanString(collaborator.hrEmployeeId),
      partyId: toCleanString(collaborator.partyId),
      defaultType,
      defaultRate,
      active: collaborator.active !== false,
      notes: toCleanString(collaborator.notes),
      ...(isExistingCollaborator
        ? {}
        : {
            createdAt: serverTimestamp(),
            createdBy: userId,
          }),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true },
  );

  return id;
};

export const useServiceCommissionCollaborators = (
  businessId?: string | null,
) => {
  const [state, setState] =
    useState<ServiceCommissionCollaboratorsState>(EMPTY_STATE);

  const collaboratorQuery = useMemo(() => {
    if (!businessId) return null;
    return query(
      collection(
        db,
        'businesses',
        businessId,
        'serviceCommissionCollaborators',
      ),
      orderBy('code', 'asc'),
    );
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !collaboratorQuery) return undefined;

    return onSnapshot(
      collaboratorQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((docSnapshot) =>
          normalizeCollaboratorRecord(
            docSnapshot.id,
            docSnapshot.data() as Record<string, unknown>,
          ),
        );

        setState({
          businessId,
          rows,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          businessId,
          rows: [],
          loading: false,
          error,
        });
      },
    );
  }, [businessId, collaboratorQuery]);

  if (!businessId) return EMPTY_STATE;
  if (state.businessId !== businessId) {
    return {
      businessId,
      rows: [],
      loading: true,
      error: null,
    };
  }

  return state;
};

export default useServiceCommissionCollaborators;
