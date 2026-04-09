import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ROUTES_PATH } from '@/router/routes/routesName';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import { normalizeRoleId } from '@/utils/roles/normalizeRole';

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

const Banner = styled.section<{ $tone: 'info' | 'warning' | 'danger' }>`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.1rem;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'linear-gradient(135deg, #fff1f2, #ffe4e6)'
      : $tone === 'warning'
        ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
        : 'linear-gradient(135deg, #ecfeff, #cffafe)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'danger'
        ? 'rgb(244 63 94 / 24%)'
        : $tone === 'warning'
          ? 'rgb(245 158 11 / 26%)'
          : 'rgb(6 182 212 / 22%)'};
  border-radius: 18px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 5%);
`;

const Content = styled.div`
  display: flex;
  flex: 1 1 460px;
  gap: 0.9rem;
  align-items: flex-start;
  min-width: 0;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  height: 34px;
  padding: 0 0.85rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgb(255 255 255 / 72%);
  border-radius: 999px;
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
`;

const Description = styled.p`
  margin: 0;
  color: #334155;
  line-height: 1.45;
`;

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 0.75rem;
  align-items: center;
`;

const PrimaryAction = styled.button`
  min-height: 44px;
  padding: 0.8rem 1rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: #0f766e;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgb(15 118 110 / 24%);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgb(15 118 110 / 28%);
  }
`;
