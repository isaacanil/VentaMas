import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faExclamationTriangle,
  faFileInvoice,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { formatNumber } from '../../../../../../../utils/formatNumber';
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
} from '../../shared/PanelPrimitives';

const resolveIcon = (account) => {
  if (account?.isOverdue) return faExclamationTriangle;
  if (account?.type === 'insurance') return faShieldAlt;
  return faFileInvoice;
};

const resolveAccentColor = (account) => {
  if (account?.isOverdue) return '#ef4444';
  const days = account?.daysUntilNextDue;
  if (typeof days === 'number' && days <= 3) return '#f59e0b';
  return '#2563eb';
};

const resolveStatus = (account) => {
  const days = account?.daysUntilNextDue;
  if (account?.isOverdue || (typeof days === 'number' && days < 0)) {
    const overdueDays = Math.abs(Math.round(days ?? 0));
    return {
      label: 'Vencida',
      description: overdueDays > 0 ? `Hace ${overdueDays} día${overdueDays > 1 ? 's' : ''}` : 'Vencida',
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
      return { label: `${days} días`, description: `Vence en ${days} días`, color: '#f59e0b' };
    }
    return { label: `${days} días`, description: `Vence en ${days} días`, color: '#2563eb' };
  }

  return { label: 'Al día', description: 'Sin fecha próxima registrada', color: '#10b981' };
};

const getNextInstallment = (account) => {
  const installments = Array.isArray(account?.installments) ? account.installments : [];
  if (installments.length === 0) return null;
  const active = installments.filter((installment) => installment?.isActive !== false);
  if (active.length === 0) return null;
  return active[0];
};

const formatInstallmentDate = (value) => {
  if (!value) return '';
  if (typeof value.toFormat === 'function') {
    return value.toFormat('dd/MM/yyyy');
  }
  const date = typeof value.toDate === 'function' ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date?.getTime?.())) return '';
  return new Intl.DateTimeFormat('es-ES').format(date);
};

const AccountRow = ({ account }) => {
  const icon = resolveIcon(account);
  const accentColor = resolveAccentColor(account);
  const status = resolveStatus(account);
  const reference = account?.invoiceNumber || account?.invoiceId || '-';
  const nextInstallment = getNextInstallment(account);
  const nextAmount = typeof nextInstallment?.installmentAmount === 'number' ? nextInstallment.installmentAmount : null;
  const nextDate = formatInstallmentDate(nextInstallment?.installmentDate);
  const nextSummary = nextAmount ? `${formatNumber(nextAmount)}${nextDate ? ` · ${nextDate}` : ''}` : nextDate || '-';

  return (
    <PanelRow>
      <RowMain>
        <ModuleIcon style={{ background: `${accentColor}15`, color: accentColor }}>
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
        <MetaValue style={{ color: '#64748b', fontWeight: 400 }}>{status.description}</MetaValue>
      </RowStatus>
    </PanelRow>
  );
};

const InsuranceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0284c7;
  font-size: 11px;
  font-weight: 600;
`;

export default AccountRow;
