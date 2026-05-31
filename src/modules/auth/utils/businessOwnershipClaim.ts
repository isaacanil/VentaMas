import ROUTES_PATH from '@/router/routes/routesName';

import type {
  CreateOwnershipClaimTokenResponse,
  RedeemBusinessOwnershipClaimResponse,
} from '../repositories/businessOwnershipClaims.repository';

export type RedeemBusinessClaimSuccess = {
  businessId: string | null;
  feedbackMessage: string;
  keepGlobalDevRole: boolean;
  membershipRole: string;
  notificationMessage: string;
  status: 'success';
};

export const buildOwnershipClaimUrl = ({
  baseUrl,
  payload,
}: {
  baseUrl?: string;
  payload: CreateOwnershipClaimTokenResponse;
}) => {
  if (payload.claimUrl) return payload.claimUrl;
  if (!baseUrl || !payload.code) return null;

  return `${baseUrl}${ROUTES_PATH.AUTH_TERM.CLAIM_BUSINESS}?token=${encodeURIComponent(payload.code)}`;
};

export const buildRedeemBusinessClaimSuccess = ({
  isPlatformDeveloper,
  payload,
}: {
  isPlatformDeveloper: boolean;
  payload: RedeemBusinessOwnershipClaimResponse;
}): RedeemBusinessClaimSuccess => {
  const businessId = payload.businessId || null;
  const isPlatformDevResponse =
    payload.isPlatformDev === true || payload.globalRole === 'dev';
  const keepGlobalDevRole = isPlatformDeveloper || isPlatformDevResponse;
  const notificationMessage =
    payload.message || 'El negocio ya quedo a tu nombre.';

  return {
    businessId,
    feedbackMessage: `${payload.message || 'Reclamo completado. Ya tienes acceso de administrador.'} Redirigiendo al inicio...`,
    keepGlobalDevRole,
    membershipRole: payload.membershipRole || 'admin',
    notificationMessage,
    status: 'success',
  };
};
