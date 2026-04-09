import { httpsCallable } from 'firebase/functions';

import { fbSelectActiveBusiness } from '@/firebase/Auth/fbAuthV2/fbSelectActiveBusiness';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { AvailableBusinessContext } from '@/utils/auth-adapter';

type BusinessMetadataLike = {
  ownerUid?: string | null;
};

type RedeemBusinessInviteRequest = {
  code: string;
  sessionToken?: string;
};

type RedeemBusinessInviteResponse = {
  businessId?: string;
  businessName?: string | null;
  ok?: boolean;
  reason?: string;
  role?: string;
};

export type BusinessSelectionSuccess = {
  hasMultipleBusinesses: boolean;
  nextBusinesses: AvailableBusinessContext[];
  selectedBusinessHasOwners?: boolean;
  selectedBusinessId: string;
  selectedRole: string;
};

export type RedeemedBusinessInvite = {
  businessId: string | null;
  businessName: string | null;
  role: string;
};

type RunBusinessSelectionParams = {
  business: AvailableBusinessContext;
  businessMetadataMap: ReadonlyMap<string, BusinessMetadataLike>;
  hasMultipleBusinesses: boolean;
  onError: (error: unknown) => void;
  onSettled: () => void;
  onSuccess: (result: BusinessSelectionSuccess) => void;
  sortedBusinesses: AvailableBusinessContext[];
};

type RunRedeemBusinessInviteParams = {
  code: string;
  onAlreadyMember: (result: RedeemedBusinessInvite) => void;
  onError: (error: unknown) => void;
  onSettled: () => void;
  onSuccess: (result: RedeemedBusinessInvite) => void;
};

const redeemBusinessInviteCallable = httpsCallable<
  RedeemBusinessInviteRequest,
  RedeemBusinessInviteResponse
>(functions, 'redeemBusinessInvite');

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export async function runBusinessSelection({
  business,
  businessMetadataMap,
  hasMultipleBusinesses,
  onError,
  onSettled,
  onSuccess,
  sortedBusinesses,
}: RunBusinessSelectionParams) {
  try {
    const selected = await fbSelectActiveBusiness(business.businessId);
    const selectedBusinessId = selected.businessId;
    const selectedRole = selected.role || business.role;
    const selectedBusinessMetadata =
      businessMetadataMap.get(selectedBusinessId) || null;
    const selectedBusinessHasOwners =
      selectedBusinessMetadata?.ownerUid !== undefined
        ? Boolean(selectedBusinessMetadata.ownerUid)
        : undefined;
    const nextBusinesses = sortedBusinesses.map((entry) =>
      entry.businessId === selectedBusinessId
        ? { ...entry, role: selectedRole }
        : entry,
    );

    onSuccess({
      hasMultipleBusinesses:
        selected.hasMultipleBusinesses ?? hasMultipleBusinesses,
      nextBusinesses,
      selectedBusinessHasOwners,
      selectedBusinessId,
      selectedRole,
    });
  } catch (error) {
    onError(error);
  } finally {
    onSettled();
  }
}

export async function runRedeemBusinessInvite({
  code,
  onAlreadyMember,
  onError,
  onSettled,
  onSuccess,
}: RunRedeemBusinessInviteParams) {
  try {
    const { sessionToken } = getStoredSession();
    const response = await redeemBusinessInviteCallable({
      code,
      ...(sessionToken ? { sessionToken } : {}),
    });
    const payload = (response.data || {}) as RedeemBusinessInviteResponse;
    const result = {
      businessId: toCleanString(payload.businessId),
      businessName: toCleanString(payload.businessName),
      role: toCleanString(payload.role) || 'cashier',
    };

    if (payload.ok === false && payload.reason === 'already-member') {
      onAlreadyMember(result);
      return;
    }

    if (!payload.ok) {
      throw new Error('Invitacion no disponible');
    }

    onSuccess(result);
  } catch (error) {
    onError(error);
  } finally {
    onSettled();
  }
}
