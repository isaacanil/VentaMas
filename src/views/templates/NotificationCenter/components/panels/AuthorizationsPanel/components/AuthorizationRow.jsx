import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styled from 'styled-components';

import 'dayjs/locale/es';
import { resolveModuleMeta } from '../../../../../../pages/Authorizations/components/AuthorizationRequests/utils/utils';

dayjs.extend(relativeTime);
dayjs.locale('es');

const STATUS_CONFIG = {
  pending: {
    icon: <ClockCircleOutlined />,
    color: '#f59e0b',
    text: 'Pendiente',
  },
  approved: {
    icon: <CheckCircleOutlined />,
    color: '#22c55e',
    text: 'Aprobada',
  },
  rejected: {
    icon: <CloseCircleOutlined />,
    color: '#ef4444',
    text: 'Rechazada',
  },
  used: {
    icon: <CheckCircleOutlined />,
    color: '#2563eb',
    text: 'Usada',
  },
  expired: {
    icon: <ExclamationCircleOutlined />,
    color: '#64748b',
    text: 'Expirada',
  },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || STATUS_CONFIG.pending;

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
};

const formatTimeAgo = (timestamp) => {
  const millis = toMillis(timestamp);
  if (!millis) return '';
  return dayjs(millis).fromNow();
};

const resolveReference = (auth) => {
  if (!auth) return '-';
  const metadata =
    typeof auth.metadata === 'object' && auth.metadata !== null
      ? auth.metadata
      : {};
  return (
    auth.reference ||
    metadata.reference ||
    metadata.invoiceNumber ||
    metadata.invoiceId ||
    auth.invoiceNumber ||
    auth.invoiceId ||
    '-'
  );
};

const resolvePersonName = (person) => {
  if (!person) return '';
  return person.displayName || person.name || person.email || '';
};

const AuthorizationRow = ({
  auth,
  isAdmin,
  processingId,
  onApprove,
  onReject,
}) => {
  const statusConfig = getStatusConfig(auth.status);
  const isPending = auth.status === 'pending';
  const isProcessing = processingId === auth.id;
  const moduleMeta = resolveModuleMeta(auth);
  const referenceValue = resolveReference(auth);
  const requestedByName = resolvePersonName(auth.requestedBy) || 'Usuario';
  const showActions = isAdmin && isPending;

  return (
    <AuthorizationRowContainer>
      <ModuleCell>
        <ModuleIcon>
          <FontAwesomeIcon icon={moduleMeta.icon} />
        </ModuleIcon>
        <ModuleInfo>
          <ModuleTitle title={moduleMeta.title}>{moduleMeta.title}</ModuleTitle>
          <ReferenceLabel title={referenceValue}>
            {moduleMeta.referenceLabel}:{' '}
            <ReferenceValue>{referenceValue}</ReferenceValue>
          </ReferenceLabel>
        </ModuleInfo>
      </ModuleCell>

      <RequesterCell>
        <MetaLabel>Solicitó</MetaLabel>
        <MetaValue title={requestedByName}>{requestedByName}</MetaValue>
      </RequesterCell>

      <StatusCell>
        <StatusPill $color={statusConfig.color}>{statusConfig.text}</StatusPill>
        <TimeAgo>{formatTimeAgo(auth.createdAt)}</TimeAgo>
      </StatusCell>

      {showActions && (
        <ActionsCell>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => onApprove(auth.id)}
            loading={isProcessing}
            disabled={isProcessing}
          >
            Aprobar
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => onReject(auth.id)}
            loading={isProcessing}
            disabled={isProcessing}
          >
            Rechazar
          </Button>
        </ActionsCell>
      )}
    </AuthorizationRowContainer>
  );
};

export default AuthorizationRow;

const AuthorizationRowContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

    &:hover {
    background: #fff;
    border-color: #cbd5e1;
    box-shadow: 0 8px 20px rgb(15 23 42 / 12%);
  }

  @media (width <= 960px) {
    flex-wrap: wrap;
    row-gap: 10px;
    align-items: flex-start;
  }
`;

const ModuleCell = styled.div`
  display: flex;
  flex: 1 1 240px;
  gap: 12px;
  align-items: center;
  min-width: 0;
`;

const ModuleIcon = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 16px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 10px;
`;

const ModuleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const ModuleTitle = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
`;

const ReferenceLabel = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;

  strong {
    font-weight: 600;
    color: #0f172a;
  }
`;

const ReferenceValue = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const RequesterCell = styled.div`
  display: flex;
  flex: 0 0 160px;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`;

const StatusCell = styled.div`
  display: flex;
  flex: 0 0 120px;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  min-width: 110px;
`;

const StatusPill = styled.span`
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color || '#2563eb'};
  text-transform: capitalize;
  background: ${({ $color }) => `${$color || '#2563eb'}1a`};
  border-radius: 999px;
`;

const TimeAgo = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const MetaLabel = styled.span`
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const MetaValue = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
`;

const ActionsCell = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;

  button {
    min-width: 72px;
  }
`;
