import { Button, Chip, ListBox, Modal, Select, Tooltip } from '@heroui/react';
import type { JSX } from 'react';
import styled from 'styled-components';

import {
  useBusinessWorkspaceModalController,
  type InviteFeedback,
} from './hooks/useBusinessWorkspaceModalController';

interface BusinessWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHOW_JOIN_BY_CODE = false;
type InviteFeedbackType = InviteFeedback['type'];

export const BusinessWorkspaceModal = ({
  isOpen,
  onClose,
}: BusinessWorkspaceModalProps): JSX.Element => {
  const {
    activeBusinessesCount,
    businessFilter,
    canAccessBusinessCreation,
    canCreateBusiness,
    createBusinessTooltip,
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
    setBusinessFilter,
    setInviteModalOpen,
    visibleBusinessCards,
  } = useBusinessWorkspaceModalController({
    onClose,
  });

  return (
    <>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
        className="z-[400]"
      >
        <Modal.Container placement="top" className="max-w-[820px] mt-2.5">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Administrar negocios</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <Body>
                {SHOW_JOIN_BY_CODE && inviteFeedback ? (
                  <JoinByCodeFeedback $type={inviteFeedback.type}>
                    {inviteFeedback.message}
                  </JoinByCodeFeedback>
                ) : null}

                {hasBusinesses || SHOW_JOIN_BY_CODE || canAccessBusinessCreation ? (
                  <Toolbar>
                    {hasBusinesses ? (
                      <Select
                        selectedKey={businessFilter}
                        onSelectionChange={(key) =>
                          setBusinessFilter(key as typeof businessFilter)
                        }
                        aria-label="Filtro de negocios"
                        className="w-44"
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="active" textValue="Activos">
                              Activos ({activeBusinessesCount})
                            </ListBox.Item>
                            <ListBox.Item id="inactive" textValue="No activos">
                              No activos ({inactiveBusinessesCount})
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    ) : (
                      <ToolbarSpacer aria-hidden="true" />
                    )}

                    <ToolbarActions>
                      {SHOW_JOIN_BY_CODE ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={() => setInviteModalOpen(true)}
                        >
                          Unirme con código
                        </Button>
                      ) : null}

                      {canAccessBusinessCreation ? (
                        <Tooltip>
                          <Tooltip.Trigger>
                            <span className="inline-flex">
                              <Button
                                variant="primary"
                                size="sm"
                                onPress={handleCreateBusiness}
                                isDisabled={!canCreateBusiness}
                              >
                                + Crear negocio
                              </Button>
                            </span>
                          </Tooltip.Trigger>
                          {createBusinessTooltip ? (
                            <Tooltip.Content>{createBusinessTooltip}</Tooltip.Content>
                          ) : null}
                        </Tooltip>
                      ) : null}
                    </ToolbarActions>
                  </Toolbar>
                ) : null}

                {!hasBusinesses ? (
                  <EmptyState>
                    <EmptyTitle>No tienes negocios disponibles</EmptyTitle>
                    <EmptyText>Crea uno nuevo para empezar.</EmptyText>
                  </EmptyState>
                ) : !visibleBusinessCards.length ? (
                  <EmptyState>
                    <EmptyTitle>
                      {businessFilter === 'active'
                        ? 'No hay negocios activos'
                        : 'No hay negocios no activos'}
                    </EmptyTitle>
                    <EmptyText>
                      {businessFilter === 'active'
                        ? 'Selecciona "No activos" para ver los demás negocios.'
                        : 'Todos tus negocios actuales están activos.'}
                    </EmptyText>
                  </EmptyState>
                ) : (
                  <BusinessGrid>
                    {visibleBusinessCards.map(
                      ({
                        business,
                        businessDevIdLabel,
                        displayName,
                        isCurrent,
                        isSelectingCard,
                        roleLabel,
                      }) => (
                        <BusinessCard
                          key={business.businessId}
                          type="button"
                          onClick={() => handleSelectBusiness(business)}
                          disabled={!business.isActive || isSelectingBusiness}
                          $active={isCurrent}
                          $disabled={!business.isActive || isSelectingBusiness}
                          $loading={isSelectingCard}
                        >
                          <CardHeader>
                            <BusinessTitle>
                              <BusinessName title={displayName}>{displayName}</BusinessName>
                              {businessDevIdLabel ? (
                                <BusinessId>{businessDevIdLabel}</BusinessId>
                              ) : null}
                            </BusinessTitle>
                            {!business.isActive ? (
                              <Chip size="sm" variant="outline">
                                <Chip.Label>No activo</Chip.Label>
                              </Chip>
                            ) : null}
                          </CardHeader>
                          <MetaRow>
                            <MetaLabel>Rol</MetaLabel>
                            <MetaValue>{roleLabel}</MetaValue>
                          </MetaRow>
                        </BusinessCard>
                      ),
                    )}
                  </BusinessGrid>
                )}
              </Body>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {SHOW_JOIN_BY_CODE ? (
        <Modal.Backdrop
          isOpen={inviteModalOpen}
          onOpenChange={(open) => !open && setInviteModalOpen(false)}
          className="z-[500]"
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Unirme con código</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body>
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
                    <Button
                      variant="primary"
                      type="submit"
                      isDisabled={redeemingInvite || !inviteCode.trim()}
                    >
                      {redeemingInvite ? 'Validando...' : 'Ingresar'}
                    </Button>
                  </JoinByCodeRow>
                  {inviteFeedback ? (
                    <JoinByCodeFeedback $type={inviteFeedback.type}>
                      {inviteFeedback.message}
                    </JoinByCodeFeedback>
                  ) : null}
                </JoinByCodeModalForm>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      ) : null}
    </>
  );
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ToolbarSpacer = styled.div`
  flex: 1;
  min-width: 280px;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-left: auto;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
`;

const BusinessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
`;

const BusinessCard = styled.button<{
  $active: boolean;
  $disabled: boolean;
  $loading: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  text-align: left;
  cursor: ${({ $disabled, $loading }) =>
    $disabled || $loading ? 'not-allowed' : 'pointer'};
  background: ${({ $active, $disabled }) => {
    if ($disabled) return '#f8fafc';
    return $active ? '#f0f9ff' : '#fff';
  }};
  border: 1px solid
    ${({ $active, $disabled }) => {
      if ($disabled) return '#e2e8f0';
      return $active ? '#bae6fd' : '#e2e8f0';
    }};
  border-radius: 12px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: all 0.2s ease;
  pointer-events: ${({ $loading }) => ($loading ? 'none' : 'auto')};

  &:hover:not(:disabled) {
    border-color: ${({ $active }) => ($active ? '#7dd3fc' : '#cbd5e1')};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
      0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transform: translateY(-1px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
`;

const BusinessTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const BusinessName = styled.h3`
  margin: 0;
  font-size: 1.02rem;
  font-weight: 600;
  color: #0f172a;
  white-space: normal;
  word-break: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
`;

const BusinessId = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const MetaLabel = styled.span`
  font-size: 0.875rem;
  color: #64748b;
`;

const MetaValue = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
`;

const JoinByCodeModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const JoinByCodeRow = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const JoinByCodeInput = styled.input`
  flex: 1;
  height: 2.75rem;
  padding: 0 1rem;
  font-size: 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #0f172a;
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const JoinByCodeFeedback = styled.p<{ $type: InviteFeedbackType }>`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ $type }) => {
    if ($type === 'success') return '#15803d';
    if ($type === 'info') return '#0369a1';
    return '#b91c1c';
  }};
`;
