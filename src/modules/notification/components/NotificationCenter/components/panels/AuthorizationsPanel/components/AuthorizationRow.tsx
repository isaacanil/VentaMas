import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@/constants/icons/antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import { resolveModuleMeta } from '@/modules/authorizations/public';
import { getAuthorizationTimestampMillis } from '@/modules/notification/components/NotificationCenter/components/panels/AuthorizationsPanel/utils/authorizationsPanel';
import {
  MetaLabel,
  MetaValue,
  ModuleIcon,
  ModuleInfo,
  ModuleTitle,
  PanelRow,
  ReferenceLabel,
  ReferenceValue,
  RowActions,
  RowMain,
  RowMeta,
  RowStatus,
  StatusPill,
} from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

interface StatusConfigItem {
  icon: React.ReactNode;
  color: string;
  text: string;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
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

const getStatusConfig = (status: string): StatusConfigItem =>
  STATUS_CONFIG[status] || STATUS_CONFIG.pending;

const formatTimeAgo = (timestamp: any): string => {
  const millis = getAuthorizationTimestampMillis(timestamp);
  if (!millis) return '';
  return DateTime.fromMillis(millis).setLocale('es').toRelative() || '';
};

const resolveReference = (auth: any): string => {
  if (!auth) return '-';
  const metadata =
    auth.metadata && typeof auth.metadata === 'object' ? auth.metadata : {};
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

const resolvePersonName = (person: any): string => {
  if (!person) return '';
  return person.displayName || person.name || person.email || '';
};

interface AuthorizationRowProps {
  auth: any;
  isAdmin: boolean;
  processingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const AuthorizationRow = ({
  auth,
  isAdmin,
  processingId,
  onApprove,
  onReject,
}: AuthorizationRowProps) => {
  const statusConfig = getStatusConfig(auth.status);
  const isPending = auth.status === 'pending';
  const isProcessing = processingId === auth.id;
  const moduleMeta = resolveModuleMeta(auth);
  const referenceValue = resolveReference(auth);
  const requestedByName = resolvePersonName(auth.requestedBy) || 'Usuario';
  const showActions = isAdmin && isPending;

  return (
    <PanelRow>
      <RowMain>
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
      </RowMain>

      <RowMeta>
        <MetaLabel>Solicitó</MetaLabel>
        <MetaValue title={requestedByName}>{requestedByName}</MetaValue>
      </RowMeta>

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
    </PanelRow>
  );
};

export default AuthorizationRow;

const StatusCell = styled(RowStatus)`
  flex-basis: 120px;
  gap: 4px;
  min-width: 110px;
`;

const TimeAgo = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const ActionsCell = styled(RowActions)`
  button {
    min-width: 72px;
  }
`;
