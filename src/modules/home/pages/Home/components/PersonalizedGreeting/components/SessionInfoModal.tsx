import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { getRoleLabelById } from '@/abilities/roles';
import ROUTES_PATH from '@/router/routes/routesName';
import { hasBillingAccountManageAccess } from '@/utils/access/accountLevelCapabilities';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import type { JSX } from 'react';

interface UserInfo {
  realName?: string | null;
  username?: string | null;
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  activeRole?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  activeBusinessId?: string | null;
  availableBusinesses?: unknown[];
  accessControl?: unknown[];
  hasMultipleBusinesses?: boolean;
  [key: string]: unknown;
}

interface BusinessInfo {
  name?: string | null;
  [key: string]: unknown;
}

interface SessionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserInfo | null;
  business?: BusinessInfo | null;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveDisplayName = (user?: UserInfo | null): string => {
  return (
    toCleanString(user?.realName) ||
    toCleanString(user?.displayName) ||
    toCleanString(user?.username) ||
    'Usuario'
  );
};

const resolveBusinessesCount = (user?: UserInfo | null): number => {
  if (Array.isArray(user?.availableBusinesses)) {
    return user.availableBusinesses.length;
  }
  if (Array.isArray(user?.accessControl)) {
    return user.accessControl.length;
  }
  return 0;
};

const resolveActiveBusinessId = (user?: UserInfo | null): string | null => {
  return (
    toCleanString(user?.activeBusinessId) ||
    toCleanString(user?.businessId) ||
    toCleanString(user?.businessID) ||
    null
  );
};

const resolveBusinessNameForUi = (
  rawBusinessName: string | null,
  activeBusinessId: string | null,
  isDeveloperUser: boolean,
): string => {
  if (!rawBusinessName) return isDeveloperUser && activeBusinessId ? `Negocio ${activeBusinessId}` : 'Sin negocio activo';

  if (!activeBusinessId) return rawBusinessName;

  const normalizedName = rawBusinessName.toLowerCase();
  const fallback = `negocio ${activeBusinessId.toLowerCase()}`;
  const isIdLike = normalizedName === fallback || normalizedName === activeBusinessId.toLowerCase();

  if (isIdLike && !isDeveloperUser) {
    return 'Mi negocio';
  }

  return rawBusinessName;
};

export const SessionInfoModal = ({
  isOpen,
  onClose,
  user,
  business,
}: SessionInfoModalProps): JSX.Element => {
  const navigate = useNavigate();
  const canAccessSubscriptionManagement = isFrontendFeatureEnabled(
    'subscriptionManagement',
  );
  const displayName = resolveDisplayName(user);
  const email = toCleanString(user?.email);
  const isDeveloperUser = hasDeveloperAccess(user);
  const activeBusinessId = resolveActiveBusinessId(user);
  const rawRole =
    toCleanString(user?.activeRole) ||
    toCleanString(user?.role) ||
    'No definido';
  const role = getRoleLabelById(rawRole);
  const businessName = resolveBusinessNameForUi(
    toCleanString(business?.name),
    activeBusinessId,
    isDeveloperUser,
  );
  const businessesCount = resolveBusinessesCount(user);
  const canSwitchBusiness = businessesCount > 1 || Boolean(user?.hasMultipleBusinesses);
  const scopeLabel =
    canSwitchBusiness
      ? `${businessesCount || 2} negocios`
      : '1 negocio';

  const handleSwitchBusiness = () => {
    onClose();
    navigate(ROUTES_PATH.AUTH_TERM.SELECT_BUSINESS);
  };

  const handleOpenSubscriptionCenter = () => {
    if (!canAccessSubscriptionManagement) return;
    onClose();
    navigate(ROUTES_PATH.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE);
  };

  const canManagePayments =
    canAccessSubscriptionManagement &&
    hasBillingAccountManageAccess({
    user,
    business,
  });

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      title={<Title>Detalles de sesión</Title>}
      width={440}
      styles={{
        body: {
          padding: '0',
        },
      }}
    >
      <ModalBody>
        <Hero>
          <Avatar aria-hidden="true">{displayName.charAt(0).toUpperCase()}</Avatar>
          <HeroInfo>
            <HeroName>{displayName}</HeroName>
            {email && <HeroSub>{email}</HeroSub>}
          </HeroInfo>
        </Hero>

        <InfoGrid>
          <InfoCard>
            <Label>Rol activo</Label>
            <Value>{role}</Value>
          </InfoCard>
          {canManagePayments && (
            <InfoCard>
              <Label>Suscripción</Label>
              <SubscriptionLink type="button" onClick={handleOpenSubscriptionCenter}>
                Gestionar suscripción →
              </SubscriptionLink>
            </InfoCard>
          )}
        </InfoGrid>
      </ModalBody>
    </Modal>
  );
};

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.1rem 1.25rem 1.25rem;
`;

const Hero = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.9rem;
  background: linear-gradient(135deg, rgb(37 99 235 / 10%), rgb(15 23 42 / 6%));
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 14px;
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 1rem;
  font-weight: 700;
  color: #eff6ff;
  background: #1e3a8a;
  border-radius: 999px;
`;

const HeroInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const HeroName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.98rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
`;

const HeroSub = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.82rem;
  color: #334155;
  white-space: nowrap;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const InfoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 12px;
`;

const Label = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Value = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  overflow-wrap: anywhere;
`;

const SecondaryValue = styled.span`
  margin-top: 0.1rem;
  font-size: 0.78rem;
  color: #64748b;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 0.35rem;
`;

const SwitchBusinessButton = styled.button`
  padding: 0.48rem 0.85rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: #1d4ed8;
  border: 1px solid #1e40af;
  border-radius: 10px;
  transition:
    transform 0.2s ease,
    filter 0.2s ease;

  &:hover {
    filter: brightness(1.06);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SubscriptionLink = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  margin-top: 0.2rem;
  
  &:hover {
    text-decoration: underline;
  }
`;
