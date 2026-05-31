import {
  faArrowUpRightFromSquare,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';
import {
  Card,
  CardGlow,
  HeroGrid,
  HeroContent,
  PlanHeader,
  PlanName,
  StatusBadge,
  HelperText,
  PriceRow,
  PriceValue,
  PriceCycle,
  HeroAside,
  Actions,
  PrimaryActionButton,
  SecondaryActionButton,
  NextBillingText,
} from './SubscriptionCurrentPlanCard.styles';
import {
  CARD_TONE_STYLES,
  formatPlanPrice,
  formatShortDate,
  resolveBillingCycleSuffix,
} from './SubscriptionCurrentPlanCard.helpers';

import { getStatusLabel } from '../subscription.utils';
import type { StatusTone, SubscriptionViewModel } from '../subscription.types';

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
  const billingCycleSuffix = resolveBillingCycleSuffix(
    subscription.billingCycle,
  );
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
                  secondaryActionIcon || <FontAwesomeIcon icon={faCreditCard} />
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
