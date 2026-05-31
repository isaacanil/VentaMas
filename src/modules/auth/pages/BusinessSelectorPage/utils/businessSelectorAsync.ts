import type { AvailableBusinessContext } from '@/utils/auth-adapter';

import { redeemBusinessInvite } from '../repositories/businessInvite.repository';
import { selectActiveBusiness } from '../repositories/businessSelection.repository';
import {
  isAlreadyMemberInviteResponse,
  normalizeRedeemedBusinessInvite,
  type RedeemedBusinessInvite,
} from './businessInvite';

type BusinessMetadataLike = {
  ownerUid?: string | null;
};

export type BusinessSelectionSuccess = {
  hasMultipleBusinesses: boolean;
  nextBusinesses: AvailableBusinessContext[];
  selectedBusinessHasOwners?: boolean;
  selectedBusinessId: string;
  selectedRole: string;
};

export type { RedeemedBusinessInvite };

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
    const selected = await selectActiveBusiness(business.businessId);
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
    const payload = await redeemBusinessInvite(code);
    const result = normalizeRedeemedBusinessInvite(payload);

    if (isAlreadyMemberInviteResponse(payload)) {
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
