import {
  faEdit,
  faMapMarkerAlt,
  faPhone,
  faIdCard,
  faCalendarAlt,
  faFileInvoiceDollar,
  faReceipt,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import styled from 'styled-components';

import type { BusinessCreatedAt, BusinessInfo, OwnerSource } from '../../types';
import type { FC, SyntheticEvent } from 'react';

type StatusTone = 'ok' | 'warn' | 'danger' | 'neutral';

interface BusinessCardProps {
  business: BusinessInfo;
  onEditBusiness: (business: BusinessInfo) => void;
  onOpenAccessActions?: (business: BusinessInfo) => void;
  onOpenFiscalActions?: (business: BusinessInfo) => void;
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  unpaid: 'Sin pago',
};

const ACCESS_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  read_only: 'Solo lectura',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
  offboarded: 'Offboarding',
  closed: 'Cerrado',
  disabled: 'Deshabilitado',
  blocked: 'Bloqueado',
};

const getSubscriptionTone = (status: string | null): StatusTone => {
  if (!status) return 'neutral';
  if (status === 'active') return 'ok';
  if (status === 'trialing') return 'warn';
  if (status === 'past_due' || status === 'unpaid') return 'warn';
  if (status === 'canceled') return 'danger';
  return 'neutral';
};

const getSubscriptionLabel = (status: string | null): string => {
  if (!status) return 'Sin suscripción';
  return SUBSCRIPTION_LABELS[status] || status;
};

const getAccessStatusTone = (status: string | null): StatusTone => {
  if (!status || status === 'active') return 'ok';
  if (status === 'read_only') return 'warn';
  if (
    status === 'suspended' ||
    status === 'inactive' ||
    status === 'offboarded' ||
    status === 'closed' ||
    status === 'disabled' ||
    status === 'blocked'
  ) {
    return 'danger';
  }
  return 'neutral';
};

const getAccessStatusLabel = (status: string | null): string => {
  if (!status) return ACCESS_STATUS_LABELS.active;
  return ACCESS_STATUS_LABELS[status] || status;
};

const getOwnerSourceLabel = (source: OwnerSource): string => {
  if (source === 'ownerUid') return 'ownerUid';
  if (source === 'legacyOwners') return 'owners[] legacy';
  return 'sin source';
};

export const BusinessCard: FC<BusinessCardProps> = ({
  business,
  onEditBusiness,
  onOpenAccessActions,
  onOpenFiscalActions,
}) => {
  const formatTimeAgo = (createdAt?: BusinessCreatedAt) => {
    if (!createdAt) return 'Fecha no disponible';

    const now = DateTime.now();
    const created =
      typeof createdAt === 'string'
        ? DateTime.fromISO(createdAt)
        : createdAt instanceof Date
          ? DateTime.fromJSDate(createdAt)
          : createdAt.seconds
            ? DateTime.fromSeconds(createdAt.seconds)
            : DateTime.invalid('invalid date');

    if (!created.isValid) return 'Fecha no válida';

    const diff = now
      .diff(created, ['years', 'months', 'days', 'hours', 'minutes', 'seconds'])
      .toObject();

    if (diff.years > 0) {
      return `Desde hace ${diff.years} ${diff.years === 1 ? 'año' : 'años'}${
        diff.months > 0
          ? ` y ${diff.months} ${diff.months === 1 ? 'mes' : 'meses'}`
          : ''
      }`;
    } else if (diff.months > 0) {
      return `Desde hace ${diff.months} ${diff.months === 1 ? 'mes' : 'meses'}${
        diff.days > 0
          ? ` y ${Math.floor(diff.days)} ${Math.floor(diff.days) === 1 ? 'día' : 'días'}`
          : ''
      }`;
    } else if (diff.days > 6) {
      return `Desde hace ${Math.floor(diff.days / 7)} semanas`;
    } else if (diff.days > 0) {
      return `Desde hace ${Math.floor(diff.days)} ${Math.floor(diff.days) === 1 ? 'día' : 'días'}`;
    } else if (diff.hours > 0) {
      return `Desde hace ${Math.floor(diff.hours)} ${Math.floor(diff.hours) === 1 ? 'hora' : 'horas'}${
        diff.minutes > 0
          ? ` y ${Math.floor(diff.minutes)} ${Math.floor(diff.minutes) === 1 ? 'minuto' : 'minutos'}`
          : ''
      }`;
    } else if (diff.minutes > 0) {
      return `Desde hace ${Math.floor(diff.minutes)} ${Math.floor(diff.minutes) === 1 ? 'minuto' : 'minutos'}${
        diff.seconds > 0
          ? ` y ${Math.floor(diff.seconds)} ${Math.floor(diff.seconds) === 1 ? 'segundo' : 'segundos'}`
          : ''
      }`;
    } else if (diff.seconds > 0) {
      return `Desde hace ${Math.floor(diff.seconds)} ${Math.floor(diff.seconds) === 1 ? 'segundo' : 'segundos'}`;
    }

    return 'Creado justo ahora';
  };

  const businessData = useMemo(() => {
    const hasOwner = business.hasOwner === true;
    const ownerSource = business.ownerSource || 'none';
    const subscriptionStatus =
      typeof business.subscriptionStatus === 'string'
        ? business.subscriptionStatus.toLowerCase()
        : null;
    const accessStatus =
      typeof business.accessStatus === 'string'
        ? business.accessStatus.toLowerCase()
        : typeof business.status === 'string'
          ? business.status.toLowerCase()
          : 'active';
    const fiscalRollout = business.fiscalRollout;
    const monthlyComplianceReady =
      fiscalRollout.reportingEnabled &&
      fiscalRollout.monthlyComplianceEnabled;
    const fiscalPartiallyEnabled =
      fiscalRollout.reportingEnabled ||
      fiscalRollout.monthlyComplianceEnabled;

    return {
      address: business.address || 'Sin dirección proporcionada',
      tel: business.tel || 'Sin teléfono registrado',
      name: business.name || 'Negocio sin nombre',
      id: business.id || 'ID no disponible',
      createdAt: business.createdAt,
      timeAgo: formatTimeAgo(business.createdAt),
      hasOwner,
      ownerUid: business.ownerUid || null,
      ownerSource,
      subscriptionStatus,
      subscriptionPlanId: business.subscriptionPlanId || null,
      ownerTone: (hasOwner ? 'ok' : 'danger') as StatusTone,
      ownerLabel: hasOwner ? 'Con dueño' : 'Sin dueño',
      ownerSourceLabel: getOwnerSourceLabel(ownerSource),
      accessStatus,
      accessTone: getAccessStatusTone(accessStatus),
      accessLabel: getAccessStatusLabel(accessStatus),
      subscriptionTone: getSubscriptionTone(subscriptionStatus),
      subscriptionLabel: getSubscriptionLabel(subscriptionStatus),
      fiscalTone: monthlyComplianceReady
        ? ('ok' as StatusTone)
        : fiscalPartiallyEnabled
          ? ('warn' as StatusTone)
          : ('neutral' as StatusTone),
      fiscalLabel: monthlyComplianceReady
        ? 'DGII mensual'
        : fiscalPartiallyEnabled
          ? 'Fiscal parcial'
          : 'Fiscal apagado',
    };
  }, [business]);

  const openModal = (event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    onEditBusiness(business);
  };

  const openAccessActions = (event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    onOpenAccessActions?.(business);
  };

  const openFiscalActions = (event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    onOpenFiscalActions?.(business);
  };

  return (
    <StyledCard>
      <Head>
        <Tooltip title={businessData.name} placement="top">
          <BusinessName>{businessData.name}</BusinessName>
        </Tooltip>
        <ActionGroup>
          <Tooltip title="Editar negocio">
            <IconActionButton
              aria-label="Editar negocio"
              icon={<FontAwesomeIcon icon={faEdit} />}
              onClick={openModal}
              size="small"
              type="text"
            />
          </Tooltip>
          {onOpenAccessActions ? (
            <Tooltip title="Acciones de acceso">
              <IconActionButton
                aria-label="Acciones de acceso"
                icon={<FontAwesomeIcon icon={faUserShield} />}
                onClick={openAccessActions}
                size="small"
                type="text"
              />
            </Tooltip>
          ) : null}
          {onOpenFiscalActions ? (
            <Tooltip title="Configurar DGII mensual">
              <IconActionButton
                aria-label="Configurar DGII mensual"
                icon={<FontAwesomeIcon icon={faReceipt} />}
                onClick={openFiscalActions}
                size="small"
                type="text"
              />
            </Tooltip>
          ) : null}
        </ActionGroup>
      </Head>
      <Body>
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faIdCard} />
          </IconWrapper>
          <span>{businessData.id}</span>
        </InfoItem>
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </IconWrapper>
          <span>{businessData.address}</span>
        </InfoItem>
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faPhone} />
          </IconWrapper>
          <span>{businessData.tel}</span>
        </InfoItem>
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faUserShield} />
          </IconWrapper>
          <StatusPill $tone={businessData.ownerTone}>
            {businessData.ownerLabel}
          </StatusPill>
          <InlineMeta>{businessData.ownerSourceLabel}</InlineMeta>
        </InfoItem>
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faUserShield} />
          </IconWrapper>
          <StatusPill $tone={businessData.accessTone}>
            {businessData.accessLabel}
          </StatusPill>
          <InlineMeta>Acceso</InlineMeta>
        </InfoItem>
        {businessData.ownerUid ? (
          <InfoItem>
            <IconWrapper>
              <FontAwesomeIcon icon={faIdCard} />
            </IconWrapper>
            <span>Owner UID: {businessData.ownerUid}</span>
          </InfoItem>
        ) : null}
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </IconWrapper>
          <StatusPill $tone={businessData.subscriptionTone}>
            {businessData.subscriptionLabel}
          </StatusPill>
          <InlineMeta>
            {businessData.subscriptionPlanId
              ? `Plan ${businessData.subscriptionPlanId}`
              : 'Sin plan'}
          </InlineMeta>
        </InfoItem>
        <InfoItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faReceipt} />
          </IconWrapper>
          <StatusPill $tone={businessData.fiscalTone}>
            {businessData.fiscalLabel}
          </StatusPill>
          <InlineMeta>Compliance</InlineMeta>
        </InfoItem>
        <InfoItem className="time-ago-item">
          <IconWrapper>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </IconWrapper>
          <span>{businessData.timeAgo}</span>
        </InfoItem>
      </Body>
    </StyledCard>
  );
};

const StyledCard = styled.div`
  padding: 0.75rem;
  background-color: #fff;
  border: 1px solid var(--color-border, #e8e8e8);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 2%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
    transform: translateY(-1px);
  }
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
`;

const BusinessName = styled.div`
  position: relative;
  flex: 1;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1rem;
  font-weight: 600;
  line-height: normal;
  color: var(--color-text-primary, #262626);
  white-space: nowrap;

  &:hover::before {
    position: absolute;
    top: -30px;
    left: 50%;
    z-index: 100;
    padding: 4px 8px;
    font-size: 0.85rem;
    color: #fff;
    white-space: nowrap;
    content: attr(data-tooltip);
    background: rgb(0 0 0 / 80%);
    border-radius: 4px;
    transform: translateX(-50%);
  }
`;

const ActionGroup = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  gap: 2px;
  align-items: center;
`;

const IconActionButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary, #1890ff);

  &:hover {
    color: var(--color-primary, #1890ff) !important;
    background: rgb(24 144 255 / 10%) !important;
  }
`;

const Body = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const IconWrapper = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.4em;
  height: 1.4em;
`;

const InfoItem = styled.div`
  display: flex;
  gap: 0.375rem;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  font-size: 0.85rem;
  color: var(--color-text-secondary, #595959);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
    font-size: 0.9rem;
    color: var(--color-text-secondary, #8c8c8c);
  }
`;

const StatusPill = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  height: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 999px;
  color: ${({ $tone }) =>
    $tone === 'ok'
      ? '#166534'
      : $tone === 'warn'
        ? '#92400e'
        : $tone === 'danger'
          ? '#9f1239'
          : '#334155'};
  background: ${({ $tone }) =>
    $tone === 'ok'
      ? '#dcfce7'
      : $tone === 'warn'
        ? '#fef3c7'
        : $tone === 'danger'
          ? '#ffe4e6'
          : '#e2e8f0'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'ok'
        ? 'rgb(22 163 74 / 35%)'
        : $tone === 'warn'
          ? 'rgb(217 119 6 / 35%)'
          : $tone === 'danger'
            ? 'rgb(225 29 72 / 35%)'
            : 'rgb(100 116 139 / 35%)'};
`;

const InlineMeta = styled.span`
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
`;
