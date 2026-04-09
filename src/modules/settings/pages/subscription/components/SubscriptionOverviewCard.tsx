import {
  faArrowRight,
  faBox,
  faBuilding,
  faCalendarDays,
  faCartShopping,
  faChartLine,
  faCircleCheck,
  faCircleXmark,
  faCreditCard,
  faDesktop,
  faFileLines,
  faTruck,
  faUserCheck,
  faUsers,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import type {
  LimitRow,
  PaymentRow,
  SubscriptionViewModel,
} from '../subscription.types';
import {
  formatDate,
  formatMoney,
  getProviderLabel,
  getStatusLabel,
  isSuccessfulPaymentStatus,
  normalizePaymentStatus,
  resolveSubscriptionProviderLabel,
} from '../subscription.utils';
import ROUTES_NAME from '@/router/routes/routesName';

const LIMIT_ICON_MAP: Record<string, typeof faBuilding> = {
  maxBusinesses: faBuilding,
  maxUsers: faUsers,
  maxProducts: faBox,
  maxMonthlyInvoices: faFileLines,
  maxClients: faUserCheck,
  maxSuppliers: faTruck,
  maxWarehouses: faWarehouse,
  maxOpenCashRegisters: faCartShopping,
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('es-DO').format(value);

const resolveStatusTone = (
  status: string | null,
): 'active' | 'warning' | 'danger' => {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'scheduled' || status === 'past_due' || status === 'none') {
    return 'warning';
  }
  return 'danger';
};

const resolveDaysRemaining = (periodEnd: number | null) => {
  if (!periodEnd) return null;
  return Math.max(0, Math.ceil((periodEnd - Date.now()) / 86_400_000));
};

const UsageItem = ({
  icon,
  label,
  used,
  limit,
}: {
  icon: ReactNode;
  label: string;
  used: number;
  limit: number;
}) => {
  const isUnlimited = limit < 0;
  const safeLimit = isUnlimited ? Math.max(used, 1) : Math.max(limit, 1);
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / safeLimit) * 100));
  const isCritical = !isUnlimited && pct >= 95;
  const isHigh = !isUnlimited && pct >= 80;

  return (
    <UsageBox>
      <UsageBoxHeader>
        <UsageIconWrap $critical={isCritical} $high={isHigh}>
          {icon}
        </UsageIconWrap>
        <UsageLabel>{label}</UsageLabel>
      </UsageBoxHeader>
      <UsageNumbers>
        <UsageUsed>{formatNumber(used)}</UsageUsed>
        <UsageLimit>
          / {isUnlimited ? 'Ilimitado' : formatNumber(limit)}
        </UsageLimit>
      </UsageNumbers>
      <ProgressBar>
        <ProgressFill $pct={pct} $critical={isCritical} $high={isHigh} />
      </ProgressBar>
      <UsagePct $critical={isCritical} $high={isHigh}>
        {isUnlimited ? 'Sin tope definido' : `${pct}% utilizado`}
      </UsagePct>
    </UsageBox>
  );
};

const ActivityItem = ({
  icon,
  title,
  description,
  time,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  time: string;
}) => (
  <ActivityRow>
    <ActivityIconWrap>{icon}</ActivityIconWrap>
    <ActivityContent>
      <ActivityTitle>{title}</ActivityTitle>
      <ActivityDesc>{description}</ActivityDesc>
    </ActivityContent>
    <ActivityTime>{time}</ActivityTime>
  </ActivityRow>
);

const QuickAction = ({
  label,
  description,
  onClick,
  danger,
}: {
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <QuickActionButton onClick={onClick} $danger={danger}>
    <div>
      <QuickActionLabel $danger={danger}>{label}</QuickActionLabel>
      <QuickActionDesc>{description}</QuickActionDesc>
    </div>
    <FontAwesomeIcon icon={faArrowRight} />
  </QuickActionButton>
);

interface SubscriptionOverviewCardProps {
  subscription: SubscriptionViewModel;
  limitRows: LimitRow[];
  paymentRows: PaymentRow[];
  canManagePayments: boolean;
  loading?: boolean;
  portalLoading?: boolean;
  onRefresh: () => void;
  onOpenPortal: () => void | Promise<boolean>;
}

export const SubscriptionOverviewCard = ({
  subscription,
  limitRows,
  paymentRows,
  canManagePayments,
  loading = false,
  portalLoading = false,
  onRefresh,
  onOpenPortal,
}: SubscriptionOverviewCardProps) => {
  const navigate = useNavigate();
  const {
    ACCOUNT_SUBSCRIPTION_PLANS,
    ACCOUNT_SUBSCRIPTION_BILLING,
    ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS,
    ACCOUNT_SUBSCRIPTION_SETTINGS,
  } = ROUTES_NAME.SETTING_TERM;
  const providerLabel = resolveSubscriptionProviderLabel(subscription.provider);
  const statusLabel = getStatusLabel(subscription.status);
  const statusTone = resolveStatusTone(subscription.status);
  const daysRemaining = resolveDaysRemaining(subscription.periodEnd);
  const nextChargeLabel = formatDate(subscription.periodEnd);
  const usageRows = limitRows.slice(0, 8);
  const recentActivity = paymentRows.slice(0, 4);
  const priceLabel = formatMoney(
    subscription.priceMonthly,
    subscription.currency || 'DOP',
  );

  return (
    <Wrapper>
      <Header>
        <HeaderTitle>Resumen de Suscripción</HeaderTitle>
        <HeaderDesc>Gestiona tu plan, facturación y métodos de pago</HeaderDesc>
      </Header>

      <PlanCard>
        <PlanInfo>
          <PlanTitleRow>
            <PlanName>{subscription.displayName || 'Sin plan asignado'}</PlanName>
            <ActiveBadge $tone={statusTone}>{statusLabel}</ActiveBadge>
          </PlanTitleRow>
          <PlanDesc>
            {`Proveedor ${providerLabel} · ciclo ${subscription.billingCycle || 'mensual'}`}
          </PlanDesc>
          <PlanPrice>
            <PlanAmount>{priceLabel}</PlanAmount>
            <PlanPeriod>/mes</PlanPeriod>
          </PlanPrice>
        </PlanInfo>
        <PlanActions>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faArrowRight} />}
            iconPosition="end"
            disabled={!canManagePayments}
            onClick={() => navigate(ACCOUNT_SUBSCRIPTION_PLANS)}
          >
            Cambiar Plan
          </Button>
          <BillingNote>Próxima facturación: {nextChargeLabel}</BillingNote>
        </PlanActions>
      </PlanCard>

      <Section>
        <SectionHeader>
          <div>
            <SectionTitle>Uso del Plan</SectionTitle>
            <SectionDesc>
              Consumo actual de recursos en el negocio activo
            </SectionDesc>
          </div>
          <Button size="small" loading={loading} onClick={onRefresh}>
            Actualizar uso
          </Button>
        </SectionHeader>
        <UsageGrid>
          {usageRows.length > 0 ? (
            usageRows.map((row) => (
              <UsageItem
                key={row.key}
                icon={<FontAwesomeIcon icon={LIMIT_ICON_MAP[row.key] || faDesktop} />}
                label={row.label}
                used={Math.max(0, row.usage || 0)}
                limit={row.limit ?? 0}
              />
            ))
          ) : (
            <EmptyUsage>
              No hay métricas de uso registradas todavía para este negocio.
            </EmptyUsage>
          )}
        </UsageGrid>
      </Section>

      <StatsRow>
        <StatCard>
          <StatCardHeader>
            <StatLabel>Días Restantes</StatLabel>
            <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#0d9488' }} />
          </StatCardHeader>
          <StatValue>{daysRemaining == null ? '--' : daysRemaining}</StatValue>
          <StatMeta>
            {daysRemaining == null
              ? 'Sin ciclo de cobro activo'
              : `Hasta ${nextChargeLabel}`}
          </StatMeta>
          <ProgressBar style={{ marginTop: 12 }}>
            <ProgressFill
              $pct={
                daysRemaining == null || !subscription.noticeWindowDays
                  ? 0
                  : Math.min(
                      100,
                      Math.round(
                        (daysRemaining /
                          Math.max(subscription.noticeWindowDays, daysRemaining, 1)) *
                          100,
                      ),
                    )
              }
              $critical={false}
              $high={false}
            />
          </ProgressBar>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <StatLabel>Método de Pago</StatLabel>
            <FontAwesomeIcon icon={faCreditCard} style={{ color: '#0d9488' }} />
          </StatCardHeader>
          <StatValue>{providerLabel}</StatValue>
          <StatMeta>Gestionado desde el portal seguro del proveedor</StatMeta>
          <Button
            type="link"
            size="small"
            loading={portalLoading}
            disabled={!canManagePayments}
            style={{ padding: 0, height: 'auto', marginTop: 4, fontSize: '0.78rem' }}
            onClick={() => {
              onOpenPortal();
            }}
          >
            Gestionar
          </Button>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <StatLabel>Próximo Cobro</StatLabel>
            <FontAwesomeIcon icon={faDesktop} style={{ color: '#0d9488' }} />
          </StatCardHeader>
          <StatValue>{priceLabel}</StatValue>
          <StatMeta>{nextChargeLabel}</StatMeta>
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', marginTop: 4, fontSize: '0.78rem' }}
            onClick={() => navigate(ACCOUNT_SUBSCRIPTION_BILLING)}
          >
            Ver historial
          </Button>
        </StatCard>
      </StatsRow>

      <TwoColGrid>
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', fontSize: '0.78rem' }}
              onClick={() => navigate(ACCOUNT_SUBSCRIPTION_BILLING)}
            >
              Ver todo
            </Button>
          </CardHeader>
          <CardBody>
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => {
                const normalizedStatus = normalizePaymentStatus(item.status);
                const itemIcon =
                  normalizedStatus === 'pagado'
                    ? faCircleCheck
                    : normalizedStatus === 'pendiente'
                      ? faChartLine
                      : faCircleXmark;
                const itemColor =
                  normalizedStatus === 'pagado'
                    ? '#16a34a'
                    : normalizedStatus === 'pendiente'
                      ? '#d97706'
                      : '#dc2626';
                const title = isSuccessfulPaymentStatus(item.status)
                  ? 'Pago procesado exitosamente'
                  : normalizedStatus === 'pendiente'
                    ? 'Cobro en seguimiento'
                    : 'Intento de cobro con incidencia';

                return (
                  <ActivityItem
                    key={item.key}
                    icon={
                      <FontAwesomeIcon
                        icon={itemIcon}
                        style={{ color: itemColor, fontSize: '1rem' }}
                      />
                    }
                    title={title}
                    description={
                      item.description !== '-'
                        ? item.description
                        : `${formatMoney(item.amount, item.currency)} · ${getProviderLabel(item.provider)}`
                    }
                    time={formatDate(item.createdAt)}
                  />
                );
              })
            ) : (
              <ActivityEmpty>
                Aún no hay movimientos de pago registrados en el historial.
              </ActivityEmpty>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardBody>
            <QuickAction
              label="Actualizar plan"
              description="Accede a más terminales y funcionalidades"
              onClick={() => navigate(ACCOUNT_SUBSCRIPTION_PLANS)}
            />
            <QuickAction
              label="Cambiar tarjeta"
              description="Abre la administración del método de pago"
              onClick={() => navigate(ACCOUNT_SUBSCRIPTION_PAYMENT_METHODS)}
            />
            <QuickAction
              label="Ver facturación"
              description="Consulta movimientos y detalle del historial"
              onClick={() => navigate(ACCOUNT_SUBSCRIPTION_BILLING)}
            />
            <QuickAction
              label="Configuración"
              description="Ajusta notificaciones y preferencias visibles"
              onClick={() => navigate(ACCOUNT_SUBSCRIPTION_SETTINGS)}
            />
            <QuickAction
              label="Cancelar suscripción"
              description="Gestiona la cancelación desde el portal seguro"
              onClick={() => navigate(ACCOUNT_SUBSCRIPTION_SETTINGS)}
              danger
            />
          </CardBody>
        </Card>
      </TwoColGrid>
    </Wrapper>
  );
};

export default SubscriptionOverviewCard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div``;

const HeaderTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 600;
`;

const HeaderDesc = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.85rem;
`;

const PlanCard = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border: 1px solid rgb(13 148 136 / 25%);
  border-radius: 14px;
  background: #ffffff;
`;

const PlanInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PlanTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PlanName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 600;
`;

const ActiveBadge = styled.span<{ $tone: 'active' | 'warning' | 'danger' }>`
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid
    ${(p) =>
      p.$tone === 'active'
        ? 'rgb(13 148 136 / 30%)'
        : p.$tone === 'warning'
          ? 'rgb(217 119 6 / 25%)'
          : 'rgb(220 38 38 / 25%)'};
  background: ${(p) =>
    p.$tone === 'active'
      ? 'rgb(13 148 136 / 10%)'
      : p.$tone === 'warning'
        ? 'rgb(245 158 11 / 10%)'
        : 'rgb(220 38 38 / 10%)'};
  color: ${(p) =>
    p.$tone === 'active'
      ? '#0f766e'
      : p.$tone === 'warning'
        ? '#92400e'
        : '#991b1b'};
  font-size: 0.75rem;
  font-weight: 600;
`;

const PlanDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
`;

const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const PlanAmount = styled.span`
  color: #0f172a;
  font-size: 1.75rem;
  font-weight: 700;
`;

const PlanPeriod = styled.span`
  color: #64748b;
  font-size: 0.85rem;
`;

const PlanActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const BillingNote = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  text-align: center;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

const SectionDesc = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.78rem;
`;

const UsageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const UsageBox = styled.div`
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

const UsageBoxHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UsageIconWrap = styled.div<{ $critical: boolean; $high: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 0.75rem;

  ${(p) =>
    p.$critical
      ? 'background: rgb(220 38 38 / 12%); color: #dc2626;'
      : p.$high
        ? 'background: rgb(217 119 6 / 12%); color: #d97706;'
        : 'background: rgb(13 148 136 / 12%); color: #0d9488;'}
`;

const UsageLabel = styled.span`
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UsageNumbers = styled.div`
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-top: 10px;
`;

const UsageUsed = styled.span`
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
`;

const UsageLimit = styled.span`
  color: #94a3b8;
  font-size: 0.78rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div<{
  $pct: number;
  $critical: boolean;
  $high: boolean;
}>`
  width: ${(p) => p.$pct}%;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
  background: ${(p) =>
    p.$critical ? '#dc2626' : p.$high ? '#d97706' : '#0d9488'};
`;

const UsagePct = styled.p<{ $critical: boolean; $high: boolean }>`
  margin: 5px 0 0;
  font-size: 0.72rem;
  font-weight: ${(p) => (p.$critical ? 600 : 400)};
  color: ${(p) =>
    p.$critical ? '#dc2626' : p.$high ? '#d97706' : '#94a3b8'};
`;

const EmptyUsage = styled.div`
  grid-column: 1 / -1;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.82rem;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

const StatCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StatLabel = styled.span`
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 500;
`;

const StatValue = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 700;
`;

const StatMeta = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.75rem;
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ActivityRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const ActivityIconWrap = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  margin-top: 1px;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 500;
`;

const ActivityDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.78rem;
`;

const ActivityTime = styled.span`
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 0.72rem;
  padding-top: 2px;
`;

const ActivityEmpty = styled.div`
  padding: 12px 0;
  color: #64748b;
  font-size: 0.82rem;
`;

const QuickActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px;
  border: 1px solid ${(p) => (p.$danger ? 'rgb(220 38 38 / 20%)' : '#e2e8f0')};
  border-radius: 10px;
  background: ${(p) => (p.$danger ? 'rgb(254 242 242)' : '#f8fafc')};
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
  color: #64748b;
  font-size: 0.8rem;

  &:hover {
    background: ${(p) => (p.$danger ? 'rgb(254 226 226)' : '#f1f5f9')};
    border-color: ${(p) => (p.$danger ? 'rgb(220 38 38 / 35%)' : '#cbd5e1')};
  }
`;

const QuickActionLabel = styled.p<{ $danger?: boolean }>`
  margin: 0;
  color: ${(p) => (p.$danger ? '#dc2626' : '#0f172a')};
  font-size: 0.88rem;
  font-weight: 500;
`;

const QuickActionDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.75rem;
`;
