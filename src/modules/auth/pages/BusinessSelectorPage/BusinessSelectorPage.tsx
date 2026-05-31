import { Modal, Tooltip } from 'antd';
import type { JSX } from 'react';

import UpgradeModal from '@/components/paywall/UpgradeModal/UpgradeModal';
import {
  resolveBusinessDevIdLabel,
  resolveBusinessDisplayName,
} from '@/modules/auth/utils/businessDisplay';
import {
  BusinessActionPrimary,
  BusinessActionsLeft,
  BusinessActionsRight,
  BusinessActionsText,
  BusinessActionsTitle,
  BusinessActionsWidget,
  BusinessActionSecondary,
  BusinessActionTooltipAnchor,
  BusinessCard,
  BusinessGrid,
  BusinessId,
  BusinessName,
  BusinessTitle,
  CardHeader,
  Content,
  CurrentBadge,
  EmptyState,
  EmptyText,
  EmptyTitle,
  Header,
  HubToolbar,
  HubToolbarTitle,
  JoinByCodeButton,
  JoinByCodeFeedback,
  JoinByCodeInput,
  JoinByCodeModalForm,
  JoinByCodeRow,
  MetaLabel,
  MetaRow,
  MetaValue,
  Page,
  StatusPill,
  SubscriptionHint,
  SubscriptionHintButton,
  SubscriptionInfoIcon,
  SubscriptionPill,
  SubscriptionWidget,
  SubscriptionWidgetBtn,
  SubscriptionWidgetLeft,
  SubscriptionWidgetPlan,
  SubscriptionWidgetRight,
  SubscriptionWidgetTitle,
  Subtitle,
} from './BusinessSelectorPage.styles';
import { useBusinessSelectorPageViewModel } from './hooks/useBusinessSelectorPageViewModel';
import {
  getStatusLabel,
  getSubscriptionStatusLabel,
  getSubscriptionTone,
  roleLabel,
} from './utils/businessSelectorPage';

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
                Suscripcion
                <Tooltip title="Este acceso representa el plan de tu cuenta. Durante la transicion seguimos mostrando datos desde el contexto legacy del negocio propietario.">
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
              No tienes una suscripcion activa para esta cuenta. Selecciona un
              plan para completar onboarding y habilitar creacion de negocios.
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
              Tu suscripcion esta bloqueada por estado de pago. Regulariza desde
              el centro de suscripcion para recuperar acceso completo.
            </div>
            <SubscriptionHintButton
              type="button"
              onClick={handleOpenUpgradeModal}
            >
              Regularizar suscripcion
            </SubscriptionHintButton>
          </SubscriptionHint>
        ) : null}

        {showMissingOwnerHint ? (
          <SubscriptionHint $tone="warning">
            Este negocio aun no tiene owner asignado. Un admin debe reclamar la
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
