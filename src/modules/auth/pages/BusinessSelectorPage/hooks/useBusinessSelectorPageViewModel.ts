import { message } from 'antd';
import {
  useCallback,
  useMemo,
  useReducer,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { addUserData, selectUser } from '@/features/auth/userSlice';
import {
  buildAccessControlFromBusinesses,
  normalizeAvailableBusinesses,
  resolveCurrentActiveBusinessId,
  setStoredActiveBusinessId,
} from '@/modules/auth/utils/businessContext';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { hasBusinessCreateUnderAccountQuotaAccess } from '@/utils/access/accountLevelCapabilities';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import {
  businessSelectorUiReducer,
  initialBusinessSelectorUiState,
} from '../BusinessSelectorPage.state';
import { useBusinessMetadata } from '../useBusinessMetadata';
import {
  CREATE_BUSINESS_LOCKED_TOOLTIP,
  CREATE_BUSINESS_TOOLTIP,
  isSubscriptionStatusBlocked,
  resolveBusinessSelectionErrorMessage,
  resolveInviteErrorMessage,
  sortBusinesses,
  toCleanString,
  upsertBusiness,
} from '../utils/businessSelectorPage';
import {
  runBusinessSelection,
  runRedeemBusinessInvite,
} from '../utils/businessSelectorAsync';

export const useBusinessSelectorPageViewModel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser) as
    | (UserIdentity & Record<string, unknown>)
    | null;
  const [uiState, dispatchUi] = useReducer(
    businessSelectorUiReducer,
    initialBusinessSelectorUiState,
  );
  const {
    inviteCode,
    redeemingInvite,
    selectingBusinessId,
    inviteModalOpen,
    upgradeModalOpen,
    inviteFeedback,
  } = uiState;

  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const availableBusinesses = useMemo(
    () => normalizeAvailableBusinesses(user),
    [user],
  );
  const isDeveloperUser = useMemo(() => hasDeveloperAccess(user), [user]);
  const sortedBusinesses = useMemo(
    () => sortBusinesses(availableBusinesses, activeBusinessId),
    [availableBusinesses, activeBusinessId],
  );
  const businessMetadataMap = useBusinessMetadata(sortedBusinesses);
  const hasBusinesses = sortedBusinesses.length > 0;
  const hasMultipleBusinesses = sortedBusinesses.length > 1;
  const authUid = useMemo(
    () => toCleanString(user?.uid) || toCleanString(user?.id) || null,
    [user],
  );
  const activeBusiness = useMemo(
    () =>
      sortedBusinesses.find(
        (business) => business.businessId === activeBusinessId,
      ) || null,
    [activeBusinessId, sortedBusinesses],
  );
  const ownerBusinesses = useMemo(
    () =>
      sortedBusinesses.filter((business) => {
        const metadata = businessMetadataMap.get(business.businessId);
        return Boolean(
          authUid && metadata?.ownerUid && metadata.ownerUid === authUid,
        );
      }),
    [authUid, businessMetadataMap, sortedBusinesses],
  );
  const hasOwnedBusinessLink = ownerBusinesses.length > 0;
  const canManagePayments = hasOwnedBusinessLink;
  const canManageSubscriptions = isFrontendFeatureEnabled(
    'subscriptionManagement',
  );
  const canAccessBusinessCreation =
    isFrontendFeatureEnabled('businessCreation');
  const canCreateBusiness = hasBusinessCreateUnderAccountQuotaAccess({
    user,
    hasBusinesses,
    hasOwnedBusinessLink,
  });
  const defaultHomePath = useMemo(() => resolveDefaultHomeRoute(user), [user]);
  const ownerBusinessContext = useMemo(() => {
    if (!ownerBusinesses.length) return null;

    const preferredBusiness =
      ownerBusinesses.find(
        (business) => business.businessId === activeBusinessId,
      ) || ownerBusinesses[0];
    if (!preferredBusiness) return null;

    const metadata =
      businessMetadataMap.get(preferredBusiness.businessId) || null;
    return {
      business: preferredBusiness,
      metadata,
      subscriptionStatus:
        toCleanString(metadata?.subscriptionStatus)?.toLowerCase() || null,
      subscriptionPlanId: toCleanString(metadata?.subscriptionPlanId),
    };
  }, [activeBusinessId, businessMetadataMap, ownerBusinesses]);
  const ownerSubscriptionStatus = useMemo(
    () =>
      toCleanString(ownerBusinessContext?.subscriptionStatus)?.toLowerCase() ||
      null,
    [ownerBusinessContext?.subscriptionStatus],
  );
  const subscriptionNeedsPlanSelection = useMemo(
    () =>
      canManagePayments &&
      (!ownerSubscriptionStatus || ownerSubscriptionStatus === 'none'),
    [canManagePayments, ownerSubscriptionStatus],
  );
  const subscriptionAccessBlocked = useMemo(
    () =>
      canManagePayments &&
      Boolean(
        ownerSubscriptionStatus &&
        isSubscriptionStatusBlocked(ownerSubscriptionStatus),
      ),
    [canManagePayments, ownerSubscriptionStatus],
  );
  const canCreateBusinessBySubscription = useMemo(
    () =>
      isDeveloperUser ||
      (!subscriptionNeedsPlanSelection && !subscriptionAccessBlocked),
    [
      isDeveloperUser,
      subscriptionAccessBlocked,
      subscriptionNeedsPlanSelection,
    ],
  );
  const currentRole = normalizeRoleId(
    activeBusiness?.role || user?.activeBusinessRole || user?.role,
  );
  const showMissingOwnerHint = Boolean(
    !canManagePayments &&
    currentRole === 'admin' &&
    activeBusiness &&
    !businessMetadataMap.get(activeBusiness.businessId)?.ownerUid,
  );
  const isSelectingBusiness = Boolean(selectingBusinessId);

  const handleSelectBusiness = useCallback(
    (business: (typeof sortedBusinesses)[number]) => {
      if (
        !business.isActive ||
        business.businessId === activeBusinessId ||
        selectingBusinessId
      ) {
        return;
      }

      dispatchUi({
        type: 'setSelectingBusinessId',
        value: business.businessId,
      });

      void runBusinessSelection({
        business,
        businessMetadataMap,
        hasMultipleBusinesses,
        onError: (error) => {
          if (isDeveloperUser) {
            console.error(
              '[BusinessSelectorPage] select business failed',
              error,
            );
          }
          message.error(resolveBusinessSelectionErrorMessage(error));
        },
        onSettled: () => {
          dispatchUi({ type: 'setSelectingBusinessId', value: null });
        },
        onSuccess: ({
          hasMultipleBusinesses: nextHasMultipleBusinesses,
          nextBusinesses,
          selectedBusinessHasOwners,
          selectedBusinessId,
          selectedRole,
        }) => {
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
              hasMultipleBusinesses: nextHasMultipleBusinesses,
              ...(typeof selectedBusinessHasOwners === 'boolean'
                ? { businessHasOwners: selectedBusinessHasOwners }
                : {}),
              availableBusinesses: nextBusinesses,
              accessControl: buildAccessControlFromBusinesses(nextBusinesses),
            }),
          );

          setStoredActiveBusinessId(selectedBusinessId);
          navigate(defaultHomePath, { replace: true });
        },
        sortedBusinesses,
      });
    },
    [
      activeBusinessId,
      defaultHomePath,
      dispatch,
      hasMultipleBusinesses,
      businessMetadataMap,
      isDeveloperUser,
      navigate,
      selectingBusinessId,
      sortedBusinesses,
    ],
  );

  const handleCreateBusiness = useCallback(() => {
    if (!canAccessBusinessCreation) return;
    navigate(ROUTES_PATH.DEV_VIEW_TERM.CREATE_BUSINESS);
  }, [canAccessBusinessCreation, navigate]);

  const handleOpenUpgradeModal = useCallback(() => {
    dispatchUi({ type: 'setUpgradeModalOpen', value: true });
  }, []);

  const handleCloseUpgradeModal = useCallback(() => {
    dispatchUi({ type: 'setUpgradeModalOpen', value: false });
  }, []);

  const handleOpenSubscriptionCenter = useCallback(() => {
    if (!canManageSubscriptions) return;
    navigate(ROUTES_PATH.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE);
  }, [canManageSubscriptions, navigate]);

  const handleCreateBusinessAction = useCallback(() => {
    if (!canCreateBusiness) return;
    if (!canCreateBusinessBySubscription) {
      dispatchUi({ type: 'setUpgradeModalOpen', value: true });
      return;
    }
    handleCreateBusiness();
  }, [
    canCreateBusiness,
    canCreateBusinessBySubscription,
    handleCreateBusiness,
  ]);

  const handleOpenInviteModal = useCallback(() => {
    dispatchUi({ type: 'setInviteModalOpen', value: true });
  }, []);

  const handleCloseInviteModal = useCallback(() => {
    dispatchUi({ type: 'setInviteModalOpen', value: false });
  }, []);

  const mergeBusinessIntoSelector = useCallback(
    (businessId: string, role: string, businessName: string | null) => {
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
    },
    [activeBusinessId, dispatch, sortedBusinesses],
  );

  const handleInviteCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatchUi({
        type: 'setInviteCode',
        value: event.target.value.toUpperCase(),
      });
      if (inviteFeedback) {
        dispatchUi({ type: 'setInviteFeedback', value: null });
      }
    },
    [inviteFeedback],
  );

  const handleRedeemInvite = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const normalizedCode = inviteCode
        .trim()
        .replace(/\s+/g, '')
        .toUpperCase();
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

      void runRedeemBusinessInvite({
        code: normalizedCode,
        onAlreadyMember: ({ businessId, businessName, role }) => {
          if (businessId) {
            mergeBusinessIntoSelector(businessId, role, businessName);
          }
          dispatchUi({ type: 'setInviteModalOpen', value: false });
          dispatchUi({
            type: 'setInviteFeedback',
            value: {
              type: 'info',
              message:
                'Ya perteneces a este negocio. Lo agregamos al selector.',
            },
          });
          dispatchUi({ type: 'setInviteCode', value: '' });
        },
        onError: (error) => {
          dispatchUi({
            type: 'setInviteFeedback',
            value: {
              type: 'error',
              message: resolveInviteErrorMessage(error),
            },
          });
        },
        onSettled: () => {
          dispatchUi({ type: 'setRedeemingInvite', value: false });
        },
        onSuccess: ({ businessId, businessName, role }) => {
          if (businessId) {
            mergeBusinessIntoSelector(businessId, role, businessName);
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
        },
      });
    },
    [inviteCode, mergeBusinessIntoSelector],
  );

  const createBusinessTooltip = !canCreateBusiness
    ? CREATE_BUSINESS_LOCKED_TOOLTIP
    : !canCreateBusinessBySubscription
      ? subscriptionNeedsPlanSelection
        ? 'Primero debes seleccionar un plan para continuar con onboarding.'
        : 'Tu suscripcion esta bloqueada. Regulariza pago para crear mas negocios.'
      : CREATE_BUSINESS_TOOLTIP;
  const upgradeModalTitle = subscriptionNeedsPlanSelection
    ? 'Activa un plan para crear mas negocios'
    : 'Regulariza tu suscripcion para seguir creciendo';
  const upgradeModalReason = subscriptionNeedsPlanSelection
    ? 'todavia no tienes un plan activo para habilitar onboarding y nuevos negocios'
    : 'la cuenta tiene restricciones por estado de pago y no puede crear mas negocios';
  const upgradeModalDescription = subscriptionNeedsPlanSelection
    ? 'Tu cuenta ya esta lista para operar, pero crear otro negocio requiere activar un plan. Desde el centro de suscripcion puedes elegir el upgrade sin salir del flujo.'
    : 'Detectamos una restriccion de pago en la cuenta owner. Regulariza la suscripcion para desbloquear la creacion de negocios y recuperar el crecimiento normal.';

  return {
    activeBusinessId,
    businessMetadataMap,
    canAccessBusinessCreation,
    canCreateBusiness,
    canManagePayments,
    canManageSubscriptions,
    createBusinessTooltip,
    handleCloseInviteModal,
    handleCloseUpgradeModal,
    handleCreateBusinessAction,
    handleInviteCodeChange,
    handleOpenInviteModal,
    handleOpenSubscriptionCenter,
    handleOpenUpgradeModal,
    handleRedeemInvite,
    handleSelectBusiness,
    hasBusinesses,
    inviteCode,
    inviteFeedback,
    inviteModalOpen,
    isDeveloperUser,
    isSelectingBusiness,
    ownerBusinessContext,
    redeemingInvite,
    selectingBusinessId,
    showMissingOwnerHint,
    sortedBusinesses,
    subscriptionAccessBlocked,
    subscriptionNeedsPlanSelection,
    upgradeModalDescription,
    upgradeModalOpen,
    upgradeModalReason,
    upgradeModalTitle,
  };
};
