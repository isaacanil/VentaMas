import {
  faArrowUpRightFromSquare,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { getStatusLabel } from '../subscription.utils';
import type { StatusTone, SubscriptionViewModel } from '../subscription.types';

const CARD_TONE_STYLES: Record<
  StatusTone,
  {
    border: string;
    glow: string;
    badgeBackground: string;
    badgeColor: string;
    accentBackground: string;
    accentColor: string;
  }
> = {
  green: {
    border: 'rgb(13 148 136 / 30%)',
    glow: 'transparent',
    badgeBackground: 'rgb(13 148 136 / 10%)',
    badgeColor: '#0f766e',
    accentBackground: '#0d9488',
    accentColor: '#ffffff',
  },
  orange: {
    border: 'rgb(217 119 6 / 30%)',
    glow: 'transparent',
    badgeBackground: 'rgb(217 119 6 / 10%)',
    badgeColor: '#92400e',
    accentBackground: '#d97706',
    accentColor: '#ffffff',
  },
  red: {
    border: 'rgb(220 38 38 / 25%)',
    glow: 'transparent',
    badgeBackground: 'rgb(220 38 38 / 10%)',
    badgeColor: '#991b1b',
    accentBackground: '#dc2626',
    accentColor: '#ffffff',
  },
};

interface SubscriptionCurrentPlanCardProps {
  subscription: SubscriptionViewModel;
  statusTone: StatusTone;
  statusLabel?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionIcon?: ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionIcon?: ReactNode;
  secondaryActionDisabled?: boolean;
  primaryActionDisabled?: boolean;
  primaryActionLoading?: boolean;
  secondaryActionLoading?: boolean;
  helperText?: string;
}

const resolveBillingCycleSuffix = (billingCycle: string | null) => {
  const normalized = billingCycle?.trim().toLowerCase();

  if (
    normalized === 'monthly' ||
    normalized === 'month' ||
    normalized === 'mensual'
  ) {
    return '/mes';
  }

  if (
    normalized === 'yearly' ||
    normalized === 'annual' ||
    normalized === 'year' ||
    normalized === 'anual'
  ) {
    return '/ano';
  }

  if (normalized === 'weekly' || normalized === 'week' || normalized === 'semanal') {
    return '/semana';
  }

  if (normalized === 'daily' || normalized === 'day' || normalized === 'diario') {
    return '/dia';
  }

  return normalized ? `/${normalized}` : '';
};

const formatPlanPrice = (amount: number | null, currency: string) => {
  if (amount == null) return 'No definido';

  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency || 'DOP',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortDate = (value: number | null) => {
  if (!value) return 'No disponible';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const SubscriptionCurrentPlanCard = ({
  subscription,
  statusTone,
  statusLabel,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon,
  secondaryActionDisabled = false,
  primaryActionDisabled = false,
  primaryActionLoading = false,
  secondaryActionLoading = false,
  helperText,
}: SubscriptionCurrentPlanCardProps) => {
  const toneStyles = CARD_TONE_STYLES[statusTone];
  const planName =
    subscription.displayName || subscription.planId || 'Sin plan activo';
  const resolvedStatusLabel =
    statusLabel || getStatusLabel(subscription.status) || 'Sin estado';
  const priceLabel = formatPlanPrice(
    subscription.priceMonthly,
    subscription.currency || 'DOP',
  );
  const billingCycleSuffix = resolveBillingCycleSuffix(subscription.billingCycle);
  const nextReference = formatShortDate(
    subscription.trialEndsAt ||
      subscription.periodEnd ||
      subscription.periodStart,
  );

  return (
    <Card $border={toneStyles.border} $glow={toneStyles.glow}>
      <CardGlow aria-hidden="true" />

      <HeroGrid>
        <HeroContent>
          <PlanHeader>
            <PlanName>{planName}</PlanName>
            <StatusBadge
              $background={toneStyles.badgeBackground}
              $color={toneStyles.badgeColor}
            >
              {resolvedStatusLabel}
            </StatusBadge>
          </PlanHeader>

          <HelperText>
            {helperText ||
              'Ideal para negocios en crecimiento con multiples puntos de venta.'}
          </HelperText>

          <PriceRow>
            <PriceValue>{priceLabel}</PriceValue>
            {billingCycleSuffix ? (
              <PriceCycle>{billingCycleSuffix}</PriceCycle>
            ) : null}
          </PriceRow>
        </HeroContent>

        <HeroAside>
          <Actions>
            <PrimaryActionButton
              type="primary"
              icon={
                primaryActionIcon || (
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                )
              }
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled}
              loading={primaryActionLoading}
              $background={toneStyles.accentBackground}
              $color={toneStyles.accentColor}
            >
              {primaryActionLabel}
            </PrimaryActionButton>

            {secondaryActionLabel && onSecondaryAction ? (
              <SecondaryActionButton
                icon={
                  secondaryActionIcon || (
                    <FontAwesomeIcon icon={faCreditCard} />
                  )
                }
                onClick={onSecondaryAction}
                disabled={secondaryActionDisabled}
                loading={secondaryActionLoading}
              >
                {secondaryActionLabel}
              </SecondaryActionButton>
            ) : null}
          </Actions>

          <NextBillingText>
            Proxima facturacion: <strong>{nextReference}</strong>
          </NextBillingText>
        </HeroAside>
      </HeroGrid>
    </Card>
  );
};

export default SubscriptionCurrentPlanCard;

const Card = styled.section<{ $border: string; $glow: string }>`
  position: relative;
  display: grid;
  gap: 18px;
  overflow: hidden;
  padding: 20px 24px;
  border: 1px solid ${(p) => p.$border};
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);

  @media (max-width: 720px) {
    padding: 16px;
    border-radius: 10px;
  }
`;

const CardGlow = styled.div`
  display: none;
`;

const HeroGrid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
  gap: 24px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeroContent = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const PlanName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  line-height: 1.3;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $background: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  background: ${(p) => p.$background};
  color: ${(p) => p.$color};
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
`;

const HelperText = styled.p`
  margin: 0;
  max-width: 44ch;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const PriceValue = styled.strong`
  color: #0f172a;
  font-size: clamp(1.9rem, 4vw, 2.4rem);
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 700;
`;

const PriceCycle = styled.span`
  padding-bottom: 5px;
  color: #94a3b8;
  font-size: 1.05rem;
  line-height: 1;
`;

const HeroAside = styled.div`
  display: grid;
  gap: 10px;
  justify-items: end;
  align-self: center;

  @media (max-width: 900px) {
    justify-items: start;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: min(100%, 280px);
`;

const PrimaryActionButton = styled(Button)<{
  $background: string;
  $color: string;
}>`
  &.ant-btn {
    height: 40px;
    padding-inline: 16px;
    border: none;
    border-radius: 8px;
    background: ${(p) => p.$background};
    color: ${(p) => p.$color};
    font-weight: 700;
    box-shadow: none;
  }

  &.ant-btn:hover,
  &.ant-btn:focus {
    background: ${(p) => p.$background} !important;
    color: ${(p) => p.$color} !important;
    opacity: 0.94;
  }
`;

const SecondaryActionButton = styled(Button)`
  &.ant-btn {
    height: 40px;
    border-radius: 8px;
    border-color: #e2e8f0;
    background: #f8fafc;
    color: #334155;
    font-weight: 600;
    box-shadow: none;
  }

  &.ant-btn:hover,
  &.ant-btn:focus {
    border-color: #cbd5e1 !important;
    background: #f1f5f9 !important;
    color: #0f172a !important;
  }
`;

const NextBillingText = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: #0f172a;
    font-weight: 600;
  }
`;
