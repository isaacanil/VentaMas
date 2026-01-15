import {
  faCalendarAlt,
  faExclamationTriangle,
  faFileInvoice,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { formatNumber } from '@/utils/formatNumber';
import {
  PanelRow,
  RowMain,
  RowMeta,
  RowStatus,
  ModuleIcon,
  ModuleInfo,
  ModuleTitle,
  ReferenceLabel,
  ReferenceValue,
  StatusPill,
  MetaLabel,
  MetaValue,
} from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

interface Installment {
  isActive?: boolean;
  installmentAmount?: number;
  installmentDate?: any;
}

interface Account {
  isOverdue?: boolean;
  type?: string;
  daysUntilNextDue?: number;
  installments?: Installment[];
  invoiceNumber?: string;
  invoiceId?: string;
  clientName?: string;
  arBalance?: number;
}

const resolveIcon = (account: Account) => {
  if (account?.isOverdue) return faExclamationTriangle;
  if (account?.type === 'insurance') return faShieldAlt;
  return faFileInvoice;
};

const resolveAccentColor = (account: Account) => {
  if (account?.isOverdue) return '#ef4444';
  const days = account?.daysUntilNextDue;
  if (typeof days === 'number' && days <= 3) return '#f59e0b';
  return '#2563eb';
};

const resolveStatus = (account: Account) => {
  const days = account?.daysUntilNextDue;
  if (account?.isOverdue || (typeof days === 'number' && days < 0)) {
    const overdueDays = Math.abs(Math.round(days ?? 0));
    return {
      label: 'Vencida',
      description:
        overdueDays > 0
          ? `Hace ${overdueDays} día${overdueDays > 1 ? 's' : ''}`
          : 'Vencida',
      color: '#ef4444',
    };
  }

  if (typeof days === 'number') {
    if (days === 0) {
      return { label: 'Hoy', description: 'Vence hoy', color: '#f59e0b' };
    }
    if (days === 1) {
      return { label: 'Mañana', description: 'Vence mañana', color: '#f59e0b' };
    }
    if (days <= 3) {
      return {
        label: `${days} días`,
        description: `Vence en ${days} días`,
        color: '#f59e0b',
      };
    }
    return {
      label: `${days} días`,
      description: `Vence en ${days} días`,
      color: '#2563eb',
    };
  }

  return {
    label: 'Al día',
    description: 'Sin fecha próxima registrada',
    color: '#10b981',
  };
};

const getNextInstallment = (account: Account) => {
  const installments = Array.isArray(account?.installments)
    ? account.installments
    : [];
  if (installments.length === 0) return null;
  const active = installments.filter(
    (installment) => installment?.isActive !== false,
  );
  if (active.length === 0) return null;
  return active[0];
};

const formatInstallmentDate = (value: any) => {
  if (!value) return '';
  if (typeof value.toFormat === 'function') {
    return value.toFormat('dd/MM/yyyy');
  }
  const date =
    typeof value.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);
  if (Number.isNaN(date?.getTime?.())) return '';
  return new Intl.DateTimeFormat('es-ES').format(date);
};

const AccountRow = ({ account }: { account: Account }) => {
  const icon = resolveIcon(account);
  const accentColor = resolveAccentColor(account);
  const status = resolveStatus(account);
  const reference = account?.invoiceNumber || account?.invoiceId || '-';
  const nextInstallment = getNextInstallment(account);
  const nextAmount =
    typeof nextInstallment?.installmentAmount === 'number'
      ? nextInstallment.installmentAmount
      : null;
  const nextDate = formatInstallmentDate(nextInstallment?.installmentDate);
  const nextSummary = nextAmount
    ? `${formatNumber(nextAmount)}${nextDate ? ` · ${nextDate}` : ''}`
    : nextDate || '-';

  return (
    <PanelRow>
      <RowMain>
        <ModuleIcon
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <FontAwesomeIcon icon={icon || faCalendarAlt} />
        </ModuleIcon>
        <ModuleInfo>
          <ModuleTitle>
            {account?.clientName || 'Cliente sin nombre'}
            {account?.type === 'insurance' && (
              <InsuranceBadge>
                <FontAwesomeIcon icon={faShieldAlt} />
                Seguro
              </InsuranceBadge>
            )}
          </ModuleTitle>
          <ReferenceLabel>
            Factura: <ReferenceValue>{reference}</ReferenceValue>
          </ReferenceLabel>
        </ModuleInfo>
      </RowMain>

      <RowMeta>
        <MetaLabel>Balance</MetaLabel>
        <MetaValue>{formatNumber(account?.arBalance ?? 0)}</MetaValue>
      </RowMeta>

      <RowMeta>
        <MetaLabel>Próxima cuota</MetaLabel>
        <MetaValue>{nextSummary || '-'}</MetaValue>
      </RowMeta>

      <RowStatus>
        <StatusPill $color={status.color}>{status.label}</StatusPill>
        <MetaValue style={{ color: '#64748b', fontWeight: 400 }}>
          {status.description}
        </MetaValue>
      </RowStatus>
    </PanelRow>
  );
};

const InsuranceBadge = styled.span`
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #0284c7;
  background: #e0f2fe;
  border-radius: 999px;
`;

export default AccountRow;

