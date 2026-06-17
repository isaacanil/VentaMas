import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES_PATH } from '@/router/routes/routesName';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

import {
  Actions,
  Badge,
  Banner,
  Content,
  Description,
  PrimaryAction,
  TextBlock,
  Title,
} from './SubscriptionStatusBanner.styles';

import type { JSX } from 'react';

type UnknownRecord = Record<string, unknown>;

const BLOCKED_STATUSES = new Set([
  'past_due',
  'unpaid',
  'canceled',
  'paused',
  'deprecated',
]);

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const NOW_TICK_MS = 60 * 1000;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toMillis = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === 'object') {
    const timestampLike = value as { toMillis?: () => number; seconds?: unknown };
    if (typeof timestampLike.toMillis === 'function') {
      return timestampLike.toMillis();
    }
    if (
      typeof timestampLike.seconds === 'number' &&
      Number.isFinite(timestampLike.seconds)
    ) {
      return timestampLike.seconds * 1000;
    }
  }
  return null;
};

const readBusinessSubscription = (business: unknown): UnknownRecord => {
  const root = asRecord(business);
  const businessNode = asRecord(root.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(businessNode.subscription);

  return Object.keys(rootSubscription).length > 0 ? rootSubscription : nestedSubscription;
};

interface SubscriptionStatusBannerProps {
  business: unknown;
  user: unknown;
}

export const SubscriptionStatusBanner = ({
  business,
  user,
}: SubscriptionStatusBannerProps): JSX.Element | null => {
  const navigate = useNavigate();
  const [nowMs, setNowMs] = useState<number | null>(null);
  const canManageSubscriptions = isFrontendFeatureEnabled(
    'subscriptionManagement',
  );

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, NOW_TICK_MS);

    return () => window.clearInterval(timerId);
  }, []);

  const bannerState = useMemo(() => {
    const userRecord = asRecord(user);
    const role =
      normalizeRoleId(userRecord.activeBusinessRole || userRecord.activeRole || userRecord.role) ||
      null;
    const canManagePayments = hasDeveloperAccess(userRecord) || role === 'owner';
    if (!canManagePayments) return null;

    const subscription = readBusinessSubscription(business);
    const status = toCleanString(subscription.status)?.toLowerCase() || null;
    const planId = toCleanString(subscription.planId)?.toLowerCase() || null;
    const trialEndsAt = toMillis(subscription.trialEndsAt);
    const daysRemaining =
      trialEndsAt != null && nowMs != null
        ? Math.max(0, Math.ceil((trialEndsAt - nowMs) / DAY_IN_MS))
        : null;

    if (!status || status === 'none') {
      return {
        tone: 'warning',
        badge: 'Sin plan',
        title: 'Completa tu onboarding de suscripción',
        description:
          'Tu negocio ya fue creado, pero todavía no tiene un plan activo para esta cuenta.',
        actionLabel: 'Ver planes',
      } as const;
    }

    if (BLOCKED_STATUSES.has(status)) {
      return {
        tone: 'danger',
        badge: 'Acceso limitado',
        title: 'Tu suscripción necesita atención',
        description:
          'Regulariza tu suscripción o cambia de plan para recuperar acceso completo.',
        actionLabel: 'Ver planes / Upgrade',
      } as const;
    }

    if (planId === 'demo' || status === 'trialing') {
      const description =
        daysRemaining == null
          ? 'Estás usando el plan Demo. Revisa los planes disponibles antes de pasar a producción.'
          : daysRemaining <= 0
            ? 'Tu demo vence hoy. Elige un plan para evitar bloqueos al crecer.'
            : `Te quedan ${daysRemaining} día${daysRemaining === 1 ? '' : 's'} de Demo.`;
      return {
        tone: daysRemaining != null && daysRemaining <= 3 ? 'warning' : 'info',
        badge: 'Demo',
        title: 'Tu negocio está en periodo de prueba',
        description,
        actionLabel: 'Ver planes / Upgrade',
      } as const;
    }

    return null;
  }, [business, nowMs, user]);

  if (!canManageSubscriptions || !bannerState) return null;

  return (
    <Banner $tone={bannerState.tone}>
      <Content>
        <Badge>{bannerState.badge}</Badge>
        <TextBlock>
          <Title>{bannerState.title}</Title>
          <Description>{bannerState.description}</Description>
        </TextBlock>
      </Content>
      <Actions>
        <PrimaryAction
          type="button"
          onClick={() =>
            navigate(ROUTES_PATH.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE)
          }
        >
          {bannerState.actionLabel}
        </PrimaryAction>
      </Actions>
    </Banner>
  );
};

export default SubscriptionStatusBanner;
