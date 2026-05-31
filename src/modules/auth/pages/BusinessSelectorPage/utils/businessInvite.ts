export type BusinessInviteRedemptionResponse = {
  businessId?: string;
  businessName?: string | null;
  ok?: boolean;
  reason?: string;
  role?: string;
};

export type RedeemedBusinessInvite = {
  businessId: string | null;
  businessName: string | null;
  role: string;
};

const DEFAULT_INVITE_ROLE = 'cashier';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const normalizeRedeemedBusinessInvite = (
  payload: BusinessInviteRedemptionResponse,
): RedeemedBusinessInvite => ({
  businessId: toCleanString(payload.businessId),
  businessName: toCleanString(payload.businessName),
  role: toCleanString(payload.role) || DEFAULT_INVITE_ROLE,
});

export const isAlreadyMemberInviteResponse = (
  payload: BusinessInviteRedemptionResponse,
) => {
  return payload.ok === false && payload.reason === 'already-member';
};
