import {
  useCallback,
  useMemo,
  useReducer,
  type ChangeEvent,
  type FormEvent,
  type JSX,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Modal, Tooltip, message } from 'antd';

import { getRoleLabelById } from '@/abilities/roles';
import { PageLayout } from '@/components/layout/PageShell';
import UpgradeModal from '@/components/paywall/UpgradeModal/UpgradeModal';
import { addUserData, selectUser } from '@/features/auth/userSlice';
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
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';
import type { MembershipStatus } from '@/types/models';
import type { UserIdentity } from '@/types/users';
import { hasBusinessCreateUnderAccountQuotaAccess } from '@/utils/access/accountLevelCapabilities';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import type { AvailableBusinessContext } from '@/utils/auth-adapter';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';
import { useBusinessMetadata } from './useBusinessMetadata';
import {
  runBusinessSelection,
  runRedeemBusinessInvite,
} from './utils/businessSelectorAsync';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  revoked: 'Revocado',
  invited: 'Invitado',
};

const getStatusLabel = (status?: MembershipStatus) => {
  const key = String(status || 'active').toLowerCase();
  return STATUS_LABELS[key] || key;
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  none: 'Sin suscripción',
  active: 'Activa',
  trialing: 'En prueba',
  scheduled: 'Programada',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  unpaid: 'Sin pago',
  deprecated: 'Deprecada',
};

const BLOCKED_SUBSCRIPTION_STATUSES = new Set([
  'past_due',
  'unpaid',
  'canceled',
  'paused',
  'deprecated',
]);

type SubscriptionTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const getSubscriptionStatusLabel = (status: string | null): string => {
  if (!status) return 'Sin estado';
  return SUBSCRIPTION_LABELS[status] || status;
};

const getSubscriptionTone = (status: string | null): SubscriptionTone => {
  if (!status) return 'neutral';
  if (status === 'active') return 'success';
  if (status === 'trialing') return 'info';
  if (status === 'none' || status === 'scheduled') return 'warning';
  if (status === 'past_due' || status === 'unpaid') return 'warning';
  if (status === 'canceled' || status === 'paused' || status === 'deprecated') {
    return 'danger';
  }
  return 'neutral';
};

const roleLabel = (role: string) => {
  return getRoleLabelById(role) || role || 'Sin rol';
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

type InviteFeedbackType = 'success' | 'error' | 'info';

interface InviteFeedback {
  type: InviteFeedbackType;
  message: string;
}

type BusinessSelectorUiState = {
  inviteCode: string;
  redeemingInvite: boolean;
  selectingBusinessId: string | null;
  inviteModalOpen: boolean;
  upgradeModalOpen: boolean;
  inviteFeedback: InviteFeedback | null;
};

type BusinessSelectorUiAction =
  | { type: 'setInviteCode'; value: string }
  | { type: 'setRedeemingInvite'; value: boolean }
  | { type: 'setSelectingBusinessId'; value: string | null }
  | { type: 'setInviteModalOpen'; value: boolean }
  | { type: 'setUpgradeModalOpen'; value: boolean }
  | { type: 'setInviteFeedback'; value: InviteFeedback | null };

const CREATE_BUSINESS_TOOLTIP =
  'Registra un nuevo negocio y asígnalo a tu cuenta de pago.';
const CREATE_BUSINESS_LOCKED_TOOLTIP =
  'Solo la cuenta owner puede crear nuevos negocios y consumir el límite del plan.';

const initialBusinessSelectorUiState: BusinessSelectorUiState = {
  inviteCode: '',
  redeemingInvite: false,
  selectingBusinessId: null,
  inviteModalOpen: false,
  upgradeModalOpen: false,
  inviteFeedback: null,
};

const businessSelectorUiReducer = (
  state: BusinessSelectorUiState,
  action: BusinessSelectorUiAction,
): BusinessSelectorUiState => {
  switch (action.type) {
    case 'setInviteCode':
      return { ...state, inviteCode: action.value };
    case 'setRedeemingInvite':
      return { ...state, redeemingInvite: action.value };
    case 'setSelectingBusinessId':
      return { ...state, selectingBusinessId: action.value };
    case 'setInviteModalOpen':
      return { ...state, inviteModalOpen: action.value };
    case 'setUpgradeModalOpen':
      return { ...state, upgradeModalOpen: action.value };
    case 'setInviteFeedback':
      return { ...state, inviteFeedback: action.value };
    default:
      return state;
  }
};

const resolveInviteErrorMessage = (error: unknown): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const message = String(typedError?.message || '').toLowerCase();

  if (code.includes('unauthenticated')) {
    return 'Tu sesion expiro. Inicia sesion nuevamente.';
  }
  if (
    code.includes('not-found') ||
    message.includes('codigo de invitacion invalido')
  ) {
    return 'El codigo no es valido. Revisa e intenta otra vez.';
  }
  if (code.includes('failed-precondition')) {
    if (message.includes('expirada')) {
      return 'El codigo ya expiro.';
    }
    if (message.includes('utilizada')) {
      return 'El codigo ya fue utilizado.';
    }
    return 'La invitacion ya no esta disponible.';
  }
  return 'No se pudo canjear el codigo. Intenta nuevamente.';
};

const resolveBusinessSelectionErrorMessage = (error: unknown): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const rawMessage = String(typedError?.message || '').toLowerCase();

  if (
    code.includes('unauthenticated') ||
    code.includes('auth/') ||
    rawMessage.includes('session')
  ) {
    return 'Tu sesion expiro. Vuelve a iniciar sesion e intenta otra vez.';
  }

  if (
    code.includes('permission-denied') ||
    code.includes('forbidden') ||
    rawMessage.includes('permission')
  ) {
    return 'No tienes permisos para acceder a este negocio.';
  }

  if (
    code.includes('unavailable') ||
    code.includes('network') ||
    rawMessage.includes('network') ||
    rawMessage.includes('fetch')
  ) {
    return 'No pudimos cambiar el negocio por un problema de conexion. Intenta de nuevo.';
  }

  if (code.includes('failed-precondition') || rawMessage.includes('inactivo')) {
    return 'Este negocio no esta disponible en este momento.';
  }

  return 'No se pudo cambiar el negocio activo. Intenta nuevamente.';
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
        : (existing?.isActive ?? true),
  });

  return Array.from(byBusinessId.values());
};

const useBusinessSelectorPageViewModel = () => {
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
  const canAccessBusinessCreation = isFrontendFeatureEnabled('businessCreation');
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
        BLOCKED_SUBSCRIPTION_STATUSES.has(ownerSubscriptionStatus),
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
    (business: AvailableBusinessContext) => {
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
            console.error('[BusinessSelectorPage] select business failed', error);
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
              message: 'Ya perteneces a este negocio. Lo agregamos al selector.',
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
        : 'Tu suscripción está bloqueada. Regulariza pago para crear más negocios.'
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

export const BusinessSelectorPage = (): JSX.Element => {
  const {
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
    redeemingInvite,
    selectingBusinessId,
    inviteModalOpen,
    inviteFeedback,
    isDeveloperUser,
    isSelectingBusiness,
    ownerBusinessContext,
    showMissingOwnerHint,
    sortedBusinesses,
    subscriptionAccessBlocked,
    subscriptionNeedsPlanSelection,
    upgradeModalDescription,
    upgradeModalOpen,
    upgradeModalReason,
    upgradeModalTitle,
  } = useBusinessSelectorPageViewModel();

  return (
    <Page>
      <HubToolbar>
        <HubToolbarTitle>Hub de negocio</HubToolbarTitle>
      </HubToolbar>
      <Content>
        {canManagePayments && canManageSubscriptions ? (
          <SubscriptionWidget>
            <SubscriptionWidgetLeft>
              <SubscriptionWidgetTitle>
                Suscripción
                <Tooltip title="Este acceso representa el plan de tu cuenta. Durante la transición seguimos mostrando datos desde el contexto legacy del negocio propietario.">
                  <SubscriptionInfoIcon>?</SubscriptionInfoIcon>
                </Tooltip>
              </SubscriptionWidgetTitle>
              <SubscriptionWidgetPlan>
                Plan:{' '}
                <strong>
                  {ownerBusinessContext?.subscriptionPlanId || 'Sin plan'}
                </strong>
              </SubscriptionWidgetPlan>
            </SubscriptionWidgetLeft>
            <SubscriptionWidgetRight>
              <SubscriptionPill
                $tone={getSubscriptionTone(
                  ownerBusinessContext?.subscriptionStatus || null,
                )}
              >
                {getSubscriptionStatusLabel(
                  ownerBusinessContext?.subscriptionStatus || null,
                )}
              </SubscriptionPill>
              <SubscriptionWidgetBtn
                type="button"
                onClick={handleOpenSubscriptionCenter}
              >
                Gestionar
              </SubscriptionWidgetBtn>
            </SubscriptionWidgetRight>
          </SubscriptionWidget>
        ) : null}

        {canManageSubscriptions && subscriptionNeedsPlanSelection ? (
          <SubscriptionHint $tone="info">
            <div>
              No tienes una suscripción activa para esta cuenta. Selecciona un
              plan para completar onboarding y habilitar creación de negocios.
            </div>
            <SubscriptionHintButton
              type="button"
              onClick={handleOpenUpgradeModal}
            >
              Elegir plan
            </SubscriptionHintButton>
          </SubscriptionHint>
        ) : null}

        {canManageSubscriptions && subscriptionAccessBlocked ? (
          <SubscriptionHint $tone="danger">
            <div>
              Tu suscripción está bloqueada por estado de pago. Regulariza desde
              el centro de suscripción para recuperar acceso completo.
            </div>
            <SubscriptionHintButton
              type="button"
              onClick={handleOpenUpgradeModal}
            >
              Regularizar suscripción
            </SubscriptionHintButton>
          </SubscriptionHint>
        ) : null}

        {showMissingOwnerHint ? (
          <SubscriptionHint $tone="warning">
            Este negocio aún no tiene owner asignado. Un admin debe reclamar la
            propiedad para habilitar el centro de pagos.
          </SubscriptionHint>
        ) : null}

        {!hasBusinesses ? (
          <EmptyState>
            <EmptyTitle>No tienes negocios disponibles</EmptyTitle>
            <EmptyText>
              Solicita acceso a un negocio o completa el onboarding inicial.
            </EmptyText>
          </EmptyState>
        ) : null}

        <BusinessActionsWidget>
          <BusinessActionsLeft>
            <BusinessActionsTitle>Agregar mas negocios</BusinessActionsTitle>
            <BusinessActionsText>
              {canAccessBusinessCreation
                ? 'Unete con un codigo de invitacion o crea uno nuevo desde tu cuenta.'
                : 'Unete con un codigo de invitacion para acceder a otro negocio.'}
            </BusinessActionsText>
          </BusinessActionsLeft>
          <BusinessActionsRight>
            <BusinessActionPrimary
              type="button"
              onClick={handleOpenInviteModal}
            >
              Unirme con codigo
            </BusinessActionPrimary>
            {canAccessBusinessCreation ? (
              <Tooltip title={createBusinessTooltip}>
                <BusinessActionTooltipAnchor>
                  <BusinessActionSecondary
                    type="button"
                    onClick={handleCreateBusinessAction}
                    disabled={!canCreateBusiness}
                  >
                    + Crear negocio
                  </BusinessActionSecondary>
                </BusinessActionTooltipAnchor>
              </Tooltip>
            ) : null}
          </BusinessActionsRight>
        </BusinessActionsWidget>
        {inviteFeedback ? (
          <JoinByCodeFeedback $type={inviteFeedback.type}>
            {inviteFeedback.message}
          </JoinByCodeFeedback>
        ) : null}
        <Header>
          <Subtitle>
            Selecciona un negocio para continuar. Puedes cambiarlo luego desde
            la barra superior.
          </Subtitle>
        </Header>

        <Modal
          title="Unirme con codigo"
          open={inviteModalOpen}
          onCancel={handleCloseInviteModal}
          footer={null}
          destroyOnHidden
        >
          <JoinByCodeModalForm onSubmit={handleRedeemInvite}>
            <JoinByCodeRow>
              <JoinByCodeInput
                type="text"
                inputMode="text"
                value={inviteCode}
                onChange={handleInviteCodeChange}
                placeholder="VM-XXXXXX..."
                autoComplete="off"
                maxLength={40}
              />
              <JoinByCodeButton
                type="submit"
                disabled={redeemingInvite || !inviteCode.trim()}
              >
                {redeemingInvite ? 'Validando...' : 'Ingresar'}
              </JoinByCodeButton>
            </JoinByCodeRow>
            {inviteFeedback ? (
              <JoinByCodeFeedback $type={inviteFeedback.type}>
                {inviteFeedback.message}
              </JoinByCodeFeedback>
            ) : null}
          </JoinByCodeModalForm>
        </Modal>
        {canManageSubscriptions ? (
          <UpgradeModal
            open={upgradeModalOpen}
            onClose={handleCloseUpgradeModal}
            onUpgrade={handleOpenSubscriptionCenter}
            featureName="Crear negocio"
            limitReason={upgradeModalReason}
            title={upgradeModalTitle}
            description={upgradeModalDescription}
            upgradeLabel={
              subscriptionNeedsPlanSelection
                ? 'Ver planes'
                : 'Mejorar suscripcion'
            }
            benefits={[
              'Agrega mas negocios sin cortar el onboarding actual.',
              'Aumenta la capacidad de tu cuenta owner para crecer con orden.',
              'Gestiona upgrade, cobros y regularizacion desde una sola pantalla.',
            ]}
          />
        ) : null}

        {hasBusinesses ? (
          <BusinessGrid>
            {sortedBusinesses.map((business) => {
              const isCurrent = business.businessId === activeBusinessId;
              const isSelectingCard =
                selectingBusinessId === business.businessId;
              const status = getStatusLabel(business.status);
              const metadata =
                businessMetadataMap.get(business.businessId) || null;
              const displayName = resolveBusinessDisplayName({
                businessId: business.businessId,
                candidateNames: [metadata?.name, business.name],
                isDeveloperUser,
              });
              const businessDevIdLabel = resolveBusinessDevIdLabel({
                businessId: business.businessId,
                isDeveloperUser,
              });
              return (
                <BusinessCard
                  key={business.businessId}
                  type="button"
                  onClick={() => handleSelectBusiness(business)}
                  disabled={!business.isActive || isSelectingBusiness}
                  $active={isCurrent}
                  $disabled={!business.isActive || isSelectingBusiness}
                >
                  <CardHeader>
                    <BusinessTitle>
                      <BusinessName title={displayName}>
                        {displayName}
                      </BusinessName>
                      {businessDevIdLabel ? (
                        <BusinessId>{businessDevIdLabel}</BusinessId>
                      ) : null}
                    </BusinessTitle>
                    {isCurrent ? <CurrentBadge>Actual</CurrentBadge> : null}
                  </CardHeader>
                  <MetaRow>
                    <MetaLabel>Rol</MetaLabel>
                    <MetaValue>
                      {isSelectingCard
                        ? 'Cambiando...'
                        : roleLabel(String(business.role))}
                    </MetaValue>
                  </MetaRow>
                  <MetaRow>
                    <MetaLabel>Estado</MetaLabel>
                    <StatusPill $active={business.isActive}>
                      {status}
                    </StatusPill>
                  </MetaRow>
                </BusinessCard>
              );
            })}
          </BusinessGrid>
        ) : null}
      </Content>
    </Page>
  );
};

export default BusinessSelectorPage;

const Page = styled(PageLayout)`
  background: linear-gradient(180deg, #f7fafc 0%, #eef2f7 100%);
`;

const HubToolbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background: #fff;
  border-bottom: 1px solid #e4e7ec;
  flex-wrap: wrap;
`;

const HubToolbarTitle = styled.h1`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #101828;
  white-space: nowrap;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: min(960px, 100%);
  margin: 0 auto;
  padding: 1.5rem 1rem 2rem;
  overflow: auto;
`;

const Header = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #475467;
`;

const SubscriptionWidget = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  border: 1px solid #d0d5dd;
  background: #fff;
  flex-wrap: wrap;
`;

const SubscriptionWidgetLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const SubscriptionWidgetTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: #101828;
`;

const SubscriptionInfoIcon = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: #f2f4f7;
  color: #667085;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: help;
`;

const SubscriptionWidgetPlan = styled.span`
  font-size: 0.8rem;
  color: #475467;
`;

const SubscriptionWidgetRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SubscriptionWidgetBtn = styled.button`
  min-height: 1.85rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #344054;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: #f2f4f7;
    border-color: #98a2b3;
  }
`;

const SubscriptionHint = styled.div<{ $tone?: 'warning' | 'danger' | 'info' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === 'danger') return '#fecaca';
      if ($tone === 'info') return '#bfdbfe';
      return '#fde68a';
    }};
  background: ${({ $tone }) => {
    if ($tone === 'danger') return '#fef2f2';
    if ($tone === 'info') return '#eff6ff';
    return '#fffbeb';
  }};
  font-size: 0.8rem;
  color: ${({ $tone }) => ($tone === 'danger' ? '#7f1d1d' : '#475467')};
`;

const SubscriptionHintButton = styled.button`
  min-height: 1.95rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid #98a2b3;
  border-radius: 8px;
  background: #fff;
  color: #344054;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: #f8fafc;
    border-color: #667085;
  }
`;

const BusinessActionsWidget = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #d0d5dd;
  background: #fff;
  flex-wrap: wrap;
`;

const BusinessActionsLeft = styled.div`
  display: grid;
  gap: 0.2rem;
`;

const BusinessActionsTitle = styled.h2`
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #101828;
`;

const BusinessActionsText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #475467;
`;

const BusinessActionsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const BusinessActionPrimary = styled.button`
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid #5ca3d8;
  border-radius: 8px;
  background: #5ca3d8;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(0.95);
  }
`;

const BusinessActionSecondary = styled.button`
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #344054;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: #f2f4f7;
    border-color: #98a2b3;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const BusinessActionTooltipAnchor = styled.span`
  display: inline-flex;
`;

const BusinessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.9rem;
`;

const BusinessCard = styled.button<{ $active: boolean; $disabled: boolean }>`
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: #fff;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(16, 24, 40, 0.28)' : '#d0d5dd')};
  border-radius: 12px;
  box-shadow: ${({ $active }) =>
    $active ? '0 6px 16px rgba(16, 24, 40, 0.08)' : 'none'};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? '#d0d5dd' : '#98a2b3')};
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'translateY(-1px)')};
    box-shadow: ${({ $disabled }) =>
      $disabled ? 'none' : '0 10px 24px rgba(16, 24, 40, 0.08)'};
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: space-between;
`;

const BusinessName = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #101828;
`;

const BusinessTitle = styled.div`
  display: grid;
  gap: 0.1rem;
`;

const BusinessId = styled.span`
  font-size: 0.72rem;
  font-weight: 500;
  color: #667085;
`;

const CurrentBadge = styled.span`
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0b4a6f;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 999px;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: space-between;
`;

const MetaLabel = styled.span`
  font-size: 0.83rem;
  color: #667085;
`;

const MetaValue = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  color: #344054;
`;

const StatusPill = styled.span<{ $active: boolean }>`
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $active }) => ($active ? '#085d3a' : '#912018')};
  background: ${({ $active }) => ($active ? '#dcfae6' : '#fee4e2')};
  border: 1px solid ${({ $active }) => ($active ? '#abefc6' : '#fecdca')};
  border-radius: 999px;
`;

const SubscriptionPill = styled.span<{ $tone: SubscriptionTone }>`
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $tone }) => {
    if ($tone === 'danger') return '#991b1b';
    if ($tone === 'warning') return '#92400e';
    if ($tone === 'info') return '#0c4a6e';
    if ($tone === 'success') return '#14532d';
    return '#344054';
  }};
  background: ${({ $tone }) => {
    if ($tone === 'danger') return '#fee2e2';
    if ($tone === 'warning') return '#fef3c7';
    if ($tone === 'info') return '#e0f2fe';
    if ($tone === 'success') return '#dcfce7';
    return '#f2f4f7';
  }};
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === 'danger') return '#fecaca';
      if ($tone === 'warning') return '#fde68a';
      if ($tone === 'info') return '#bae6fd';
      if ($tone === 'success') return '#bbf7d0';
      return '#d0d5dd';
    }};
  border-radius: 999px;
`;

const JoinByCodeModalForm = styled.form`
  display: grid;
  gap: 0.7rem;
`;

const JoinByCodeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.55rem;
  align-items: center;

  @media (width <= 420px) {
    grid-template-columns: 1fr;
  }
`;

const JoinByCodeInput = styled.input`
  width: 100%;
  min-height: 2.25rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.86rem;
  border: 1px solid #d0d5dd;
  border-radius: 9px;
  background: #fff;
  color: #101828;

  &:focus {
    outline: none;
    border-color: #5ca3d8;
    box-shadow: 0 0 0 3px rgb(92 163 216 / 20%);
  }
`;

const JoinByCodeButton = styled.button`
  min-height: 2.25rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid #5ca3d8;
  border-radius: 9px;
  background: #5ca3d8;
  color: #fff;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(0.95);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const JoinByCodeFeedback = styled.p<{ $type: InviteFeedbackType }>`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ $type }) => {
    if ($type === 'success') return '#085d3a';
    if ($type === 'info') return '#0b4a6f';
    return '#912018';
  }};
`;

const EmptyState = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 1.2rem;
  background: #fff;
  border: 1px dashed #d0d5dd;
  border-radius: 12px;
`;

const EmptyTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #101828;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #667085;
`;
