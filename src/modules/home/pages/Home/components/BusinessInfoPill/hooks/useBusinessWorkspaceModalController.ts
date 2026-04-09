import { message } from 'antd';
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useReducer,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { getRoleLabelById } from '@/abilities/roles';
import { addUserData, selectUser } from '@/features/auth/userSlice';
import { useBusinessMetadata } from '@/modules/auth/pages/BusinessSelectorPage/useBusinessMetadata';
import {
  buildAccessControlFromBusinesses,
  normalizeAvailableBusinesses,
  resolveCurrentActiveBusinessId,
  setStoredActiveBusinessId,
} from '@/modules/auth/utils/businessContext';
import {
  resolveBusinessDevIdLabel,
  resolveBusinessDisplayName,
} from '@/modules/auth/utils/businessDisplay';
import ROUTES_PATH from '@/router/routes/routesName';
import type { MembershipStatus } from '@/types/models';
import type { UserIdentity } from '@/types/users';
import { hasBusinessCreateUnderAccountQuotaAccess } from '@/utils/access/accountLevelCapabilities';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import type { AvailableBusinessContext } from '@/utils/auth-adapter';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

import {
  redeemBusinessInviteCode,
  selectWorkspaceBusiness,
  type RedeemBusinessInviteResponse,
} from '../utils/businessWorkspaceActions';

type InviteFeedbackType = 'success' | 'error' | 'info';
export type BusinessViewFilter = 'active' | 'inactive';

export interface InviteFeedback {
  type: InviteFeedbackType;
  message: string;
}

type BusinessWorkspaceModalUiState = {
  inviteCode: string;
  inviteModalOpen: boolean;
  redeemingInvite: boolean;
  selectingBusinessId: string | null;
  businessFilter: BusinessViewFilter;
  inviteFeedback: InviteFeedback | null;
};

type BusinessWorkspaceModalUiAction =
  | { type: 'setInviteCode'; value: string }
  | { type: 'setInviteModalOpen'; value: boolean }
  | { type: 'setRedeemingInvite'; value: boolean }
  | { type: 'setSelectingBusinessId'; value: string | null }
  | { type: 'setBusinessFilter'; value: BusinessViewFilter }
  | { type: 'setInviteFeedback'; value: InviteFeedback | null };

export interface BusinessWorkspaceCardViewModel {
  business: AvailableBusinessContext;
  businessDevIdLabel: string | null;
  displayName: string;
  isCurrent: boolean;
  isSelectingCard: boolean;
  roleLabel: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  revoked: 'Revocado',
  invited: 'Invitado',
};

const CREATE_BUSINESS_TOOLTIP =
  'Registra un nuevo negocio y asígnalo a tu cuenta de pago.';
const CREATE_BUSINESS_LOCKED_TOOLTIP =
  'Solo la cuenta owner puede crear nuevos negocios y consumir el límite del plan.';
const DEFAULT_BUSINESS_FILTER: BusinessViewFilter = 'active';

const initialBusinessWorkspaceModalUiState: BusinessWorkspaceModalUiState = {
  inviteCode: '',
  inviteModalOpen: false,
  redeemingInvite: false,
  selectingBusinessId: null,
  businessFilter: DEFAULT_BUSINESS_FILTER,
  inviteFeedback: null,
};

const businessWorkspaceModalUiReducer = (
  state: BusinessWorkspaceModalUiState,
  action: BusinessWorkspaceModalUiAction,
): BusinessWorkspaceModalUiState => {
  switch (action.type) {
    case 'setInviteCode':
      return { ...state, inviteCode: action.value };
    case 'setInviteModalOpen':
      return { ...state, inviteModalOpen: action.value };
    case 'setRedeemingInvite':
      return { ...state, redeemingInvite: action.value };
    case 'setSelectingBusinessId':
      return { ...state, selectingBusinessId: action.value };
    case 'setBusinessFilter':
      return { ...state, businessFilter: action.value };
    case 'setInviteFeedback':
      return { ...state, inviteFeedback: action.value };
    default:
      return state;
  }
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const roleLabel = (role: string) => getRoleLabelById(role) || role || 'Sin rol';

export const getStatusLabel = (status?: MembershipStatus) => {
  const key = String(status || 'active').toLowerCase();
  return STATUS_LABELS[key] || key;
};

const sortBusinesses = (
  items: AvailableBusinessContext[],
  activeBusinessId: string | null,
) => {
  return [...items].sort((a, b) => {
    if (a.businessId === activeBusinessId) return -1;
    if (b.businessId === activeBusinessId) return 1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

const upsertBusiness = (
  businesses: AvailableBusinessContext[],
  incoming: AvailableBusinessContext,
): AvailableBusinessContext[] => {
  const byBusinessId = new Map(
    businesses.map((business) => [business.businessId, business]),
  );
  const existing = byBusinessId.get(incoming.businessId);

  byBusinessId.set(incoming.businessId, {
    businessId: incoming.businessId,
    name: incoming.name || existing?.name || `Negocio ${incoming.businessId}`,
    role: incoming.role || existing?.role || 'cashier',
    status: incoming.status || existing?.status || 'active',
    isActive:
      typeof incoming.isActive === 'boolean'
        ? incoming.isActive
        : existing?.isActive ?? true,
  });

  return Array.from(byBusinessId.values());
};

export const useBusinessWorkspaceModalController = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser) as (UserIdentity &
    Record<string, unknown>) | null;
  const [uiState, dispatchUi] = useReducer(
    businessWorkspaceModalUiReducer,
    initialBusinessWorkspaceModalUiState,
  );
  const {
    inviteCode,
    inviteModalOpen,
    redeemingInvite,
    selectingBusinessId,
    businessFilter,
    inviteFeedback,
  } = uiState;

  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const availableBusinesses = normalizeAvailableBusinesses(user);
  const sortedBusinesses = useMemo(
    () => sortBusinesses(availableBusinesses, activeBusinessId),
    [activeBusinessId, availableBusinesses],
  );
  const activeBusinessesCount = sortedBusinesses.filter(
    (business) => business.isActive,
  ).length;
  const inactiveBusinessesCount = sortedBusinesses.filter(
    (business) => !business.isActive,
  ).length;
  const visibleBusinesses = sortedBusinesses.filter((business) =>
    businessFilter === 'active' ? business.isActive : !business.isActive,
  );
  const hasBusinesses = sortedBusinesses.length > 0;
  const hasMultipleBusinesses = sortedBusinesses.length > 1;
  const businessMetadataMap = useBusinessMetadata(sortedBusinesses);
  const isDeveloperUser = hasDeveloperAccess(user);
  const authUid = toCleanString(user?.uid) || toCleanString(user?.id) || null;
  const activeBusiness =
    sortedBusinesses.find((business) => business.businessId === activeBusinessId) ||
    null;
  const ownerBusinesses = sortedBusinesses.filter((business) => {
    const metadata = businessMetadataMap.get(business.businessId);
    return Boolean(authUid && metadata?.ownerUid && metadata.ownerUid === authUid);
  });
  const hasOwnedBusinessLink = ownerBusinesses.length > 0;
  const canAccessBusinessCreation = isFrontendFeatureEnabled('businessCreation');
  const canCreateBusiness = hasBusinessCreateUnderAccountQuotaAccess({
    user,
    hasBusinesses,
    hasOwnedBusinessLink,
  });
  const isSelectingBusiness = Boolean(selectingBusinessId);
  const currentRole = normalizeRoleId(
    activeBusiness?.role || user?.activeBusinessRole || user?.role,
  );
  const createBusinessTooltip = canCreateBusiness
    ? CREATE_BUSINESS_TOOLTIP
    : CREATE_BUSINESS_LOCKED_TOOLTIP;

  const visibleBusinessCards = visibleBusinesses.map((business) => {
    const isCurrent = business.businessId === activeBusinessId;
    const isSelectingCard = selectingBusinessId === business.businessId;
    const metadata = businessMetadataMap.get(business.businessId) || null;
    const displayName = resolveBusinessDisplayName({
      businessId: business.businessId,
      candidateNames: [metadata?.name, business.name],
      isDeveloperUser,
    });

    return {
      business,
      businessDevIdLabel: resolveBusinessDevIdLabel({
        businessId: business.businessId,
        isDeveloperUser,
      }),
      displayName,
      isCurrent,
      isSelectingCard,
      roleLabel: isSelectingCard
        ? 'Cambiando...'
        : roleLabel(String(business.role)),
    };
  });

  const handleSelectBusiness = async (business: AvailableBusinessContext) => {
    if (
      !business.isActive ||
      business.businessId === activeBusinessId ||
      selectingBusinessId
    ) {
      return;
    }

    dispatchUi({ type: 'setSelectingBusinessId', value: business.businessId });
    const result = await selectWorkspaceBusiness(business.businessId);

    if (result.errorMessage) {
      if (isDeveloperUser) {
        console.error(
          '[BusinessWorkspaceModal] select business failed',
          result.error,
        );
      }
      message.error(result.errorMessage);
      dispatchUi({ type: 'setSelectingBusinessId', value: null });
      return;
    }

    const selected = result.selected;
    if (!selected) {
      dispatchUi({ type: 'setSelectingBusinessId', value: null });
      return;
    }

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

    dispatch(
      addUserData({
        businessID: selectedBusinessId,
        businessId: selectedBusinessId,
        activeBusinessId: selectedBusinessId,
        ...(!isDeveloperUser
          ? {
              role: selectedRole,
              activeRole: selectedRole,
            }
          : {}),
        activeBusinessRole: selectedRole,
        lastSelectedBusinessId: selectedBusinessId,
        hasMultipleBusinesses:
          selected.hasMultipleBusinesses ?? hasMultipleBusinesses,
        ...(typeof selectedBusinessHasOwners === 'boolean'
          ? { businessHasOwners: selectedBusinessHasOwners }
          : {}),
        availableBusinesses: nextBusinesses,
        accessControl: buildAccessControlFromBusinesses(nextBusinesses),
      }),
    );
    setStoredActiveBusinessId(selectedBusinessId);
    dispatchUi({ type: 'setSelectingBusinessId', value: null });
    onClose();
  };

  const handleCreateBusiness = () => {
    if (!canAccessBusinessCreation) return;
    onClose();
    navigate(ROUTES_PATH.DEV_VIEW_TERM.CREATE_BUSINESS);
  };

  const mergeBusinessIntoState = (
    businessId: string,
    role: string,
    businessName: string | null,
  ) => {
    const nextBusinesses = sortBusinesses(
      upsertBusiness(sortedBusinesses, {
        businessId,
        role,
        name: businessName || `Negocio ${businessId}`,
        status: 'active',
        isActive: true,
      }),
      activeBusinessId,
    );

    dispatch(
      addUserData({
        availableBusinesses: nextBusinesses,
        accessControl: buildAccessControlFromBusinesses(nextBusinesses),
        hasMultipleBusinesses: nextBusinesses.length > 1,
        lastSelectedBusinessId: businessId,
      }),
    );
  };

  const handleInviteCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatchUi({
      type: 'setInviteCode',
      value: event.target.value.toUpperCase(),
    });
    if (inviteFeedback) {
      dispatchUi({ type: 'setInviteFeedback', value: null });
    }
  };

  const handleRedeemInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCode = inviteCode.trim().replace(/\s+/g, '').toUpperCase();
    if (!normalizedCode) {
      dispatchUi({
        type: 'setInviteFeedback',
        value: {
          type: 'error',
          message: 'Ingresa un codigo para continuar.',
        },
      });
      return;
    }

    dispatchUi({ type: 'setRedeemingInvite', value: true });
    dispatchUi({ type: 'setInviteFeedback', value: null });

    const result = await redeemBusinessInviteCode(normalizedCode);
    if (result.errorMessage) {
      dispatchUi({
        type: 'setInviteFeedback',
        value: {
          type: 'error',
          message: result.errorMessage,
        },
      });
      dispatchUi({ type: 'setRedeemingInvite', value: false });
      return;
    }

    const payload = result.payload as RedeemBusinessInviteResponse;
    const businessId = toCleanString(payload.businessId);
    const role = toCleanString(payload.role) || 'cashier';
    const businessName = toCleanString(payload.businessName);

    if (payload.ok === false && payload.reason === 'already-member') {
      if (businessId) {
        mergeBusinessIntoState(businessId, role, businessName);
      }
      dispatchUi({ type: 'setInviteModalOpen', value: false });
      dispatchUi({
        type: 'setInviteFeedback',
        value: {
          type: 'info',
          message: 'Ya perteneces a este negocio. Lo agregamos al selector.',
        },
      });
      dispatchUi({ type: 'setInviteCode', value: '' });
      dispatchUi({ type: 'setRedeemingInvite', value: false });
      return;
    }

    if (!payload.ok) {
      dispatchUi({
        type: 'setInviteFeedback',
        value: {
          type: 'error',
          message: 'Invitacion no disponible',
        },
      });
      dispatchUi({ type: 'setRedeemingInvite', value: false });
      return;
    }

    if (businessId) {
      mergeBusinessIntoState(businessId, role, businessName);
    }

    dispatchUi({ type: 'setInviteModalOpen', value: false });
    dispatchUi({ type: 'setInviteCode', value: '' });
    dispatchUi({
      type: 'setInviteFeedback',
      value: {
        type: 'success',
        message:
          'Listo. El negocio fue agregado y ya puedes seleccionarlo para continuar.',
      },
    });
    dispatchUi({ type: 'setRedeemingInvite', value: false });
  };

  return {
    activeBusinessesCount,
    businessFilter,
    canAccessBusinessCreation,
    canCreateBusiness,
    createBusinessTooltip,
    currentRole,
    handleCreateBusiness,
    handleInviteCodeChange,
    handleRedeemInvite,
    handleSelectBusiness,
    hasBusinesses,
    inactiveBusinessesCount,
    inviteCode,
    inviteFeedback,
    inviteModalOpen,
    isSelectingBusiness,
    redeemingInvite,
    setBusinessFilter: (value: BusinessViewFilter) =>
      dispatchUi({ type: 'setBusinessFilter', value }),
    setInviteModalOpen: (value: boolean) =>
      dispatchUi({ type: 'setInviteModalOpen', value }),
    visibleBusinessCards,
  };
};
