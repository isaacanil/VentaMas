import {
  faReceipt,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Empty } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';

import { formatNumber } from '../../../../../../utils/formatNumber';
import {
  PanelCard,
  ScrollArea,
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
} from '../shared/PanelPrimitives';
import SimplePanelHeader from '../shared/SimplePanelHeader';

const STATUS_MAP = {
  critical: {
    label: 'Crítico',
    color: '#ef4444',
    description: 'Agotarse pronto',
    icon: faExclamationTriangle,
  },
  warning: {
    label: 'Advertencia',
    color: '#f59e0b',
    description: 'Bajo en existencia',
    icon: faExclamationTriangle,
  },
  success: {
    label: 'Disponible',
    color: '#10b981',
    description: 'Con números disponibles',
    icon: faCheckCircle,
  },
  info: {
    label: 'Activo',
    color: '#2563eb',
    description: 'Sin alertas',
    icon: faReceipt,
  },
};

const PRIORITY = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const FiscalReceiptsPanel = ({ data = {} }) => {
  const {
    title = 'Comprobantes Fiscales',
    receipts = [],
    summary = {},
  } = data;

  const sortedReceipts = useMemo(() => {
    if (!Array.isArray(receipts)) return [];
    return receipts.slice().sort((a, b) => {
      const priorityA = PRIORITY[a?.alertLevel] ?? 4;
      const priorityB = PRIORITY[b?.alertLevel] ?? 4;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const remainingA = typeof a?.remainingNumbers === 'number' ? a.remainingNumbers : 0;
      const remainingB = typeof b?.remainingNumbers === 'number' ? b.remainingNumbers : 0;
      return remainingA - remainingB;
    });
  }, [receipts]);

  const criticalCount = summary?.criticalReceipts ?? sortedReceipts.filter((item) => item?.alertLevel === 'critical').length;

  if (sortedReceipts.length === 0) {
    return (
      <PanelCard>
        <SimplePanelHeader
          icon={faReceipt}
          title={title}
          badgeCount={0}
          showMeta={false}
        />
        <StateContainer>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay comprobantes configurados"
          />
        </StateContainer>
      </PanelCard>
    );
  }

  return (
    <PanelCard>
      <SimplePanelHeader
        title={title}
        badgeCount={criticalCount}
        showMeta
      />
      <ScrollArea>
        {sortedReceipts.map((receipt) => (
          <ReceiptRow key={`${receipt.series}-${receipt.name}`} receipt={receipt} />
        ))}
      </ScrollArea>
    </PanelCard>
  );
};

const ReceiptRow = ({ receipt }) => {
  const status = STATUS_MAP[receipt?.alertLevel] || {
    label: 'Activo',
    color: '#2563eb',
    description: 'Sin alertas',
    icon: faReceipt,
  };

  const remaining = typeof receipt?.remainingNumbers === 'number' ? receipt.remainingNumbers : null;
  const total = typeof receipt?.totalNumbers === 'number' ? receipt.totalNumbers : null;
  const used = total !== null && remaining !== null ? Math.max(total - remaining, 0) : null;
  const percentage = typeof receipt?.percentageRemaining === 'number' ? `${receipt.percentageRemaining}%` : null;

  return (
    <PanelRow>
      <RowMain>
        <ModuleIcon style={{ background: `${status.color}15`, color: status.color }}>
          <FontAwesomeIcon icon={status.icon} />
        </ModuleIcon>
        <ModuleInfo>
          <ModuleTitle>{receipt?.name || 'Serie sin nombre'}</ModuleTitle>
          <ReferenceLabel>
            Serie: <ReferenceValue>{receipt?.series || '-'}</ReferenceValue>
          </ReferenceLabel>
        </ModuleInfo>
      </RowMain>

      <RowMeta>
        <MetaLabel>Disponibles</MetaLabel>
        <MetaValue>{remaining !== null ? formatNumber(remaining) : '-'}</MetaValue>
      </RowMeta>

      <RowMeta>
        <MetaLabel>Usados</MetaLabel>
        <MetaValue>{used !== null ? formatNumber(used) : '-'}</MetaValue>
      </RowMeta>

      <RowStatus>
        <StatusPill $color={status.color}>{status.label}</StatusPill>
        <MetaValue style={{ color: '#64748b', fontWeight: 400 }}>
          {percentage || status.description}
        </MetaValue>
      </RowStatus>
    </PanelRow>
  );
};

const StateContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

export default FiscalReceiptsPanel;
