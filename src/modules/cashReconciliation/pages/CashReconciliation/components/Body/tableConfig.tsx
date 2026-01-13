import { faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tag } from 'antd';
import styled, { keyframes } from 'styled-components';
import { formatDateTime } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import { CashCountStateIndicator } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/CashCountStatusIndicator/CashCountStateIndicator';
import type { CashCountRecord } from '@/utils/cashCount/types';

const breathe = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const PendingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  animation: ${breathe} 3s infinite ease-in-out;
`;

interface ColumnCellProps<T> {
  value: T;
}

export const tableConfig = () => {
  const columns = [
    {
      accessor: 'incrementNumber',
      Header: '#',
      align: 'left',
      maxWidth: '0.1fr',
      minWidth: '60px',
    },
    {
      accessor: 'status',
      Header: 'Estado',
      align: 'left',
      maxWidth: '0.3fr',
      minWidth: '120px',
      cell: ({ value }: ColumnCellProps<CashCountRecord['state']>) => (
        <CashCountStateIndicator state={value} />
      ),
    },
    {
      accessor: 'date',
      Header: 'Fecha Estado',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '160px',
      cell: ({ value }: ColumnCellProps<number | null>) =>
        formatDateTime(value),
    },
    {
      accessor: 'user',
      Header: 'Usuario',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '120px',
    },
    {
      accessor: 'total',
      Header: 'Total',
      align: 'right',
      maxWidth: '0.4fr',
      minWidth: '150px',
      cell: ({ value }: ColumnCellProps<CashCountRecord>) => {
        const isOpen = value?.state === 'open' || value?.state === 'closing';
        if (isOpen) {
          return (
            <PendingBadge>
              <FontAwesomeIcon icon={faClock} style={{ fontSize: '12px' }} />
              Pendiente
            </PendingBadge>
          );
        }
        return value.totalSystem ? formatPrice(value.totalSystem) : '0';
      },
    },
    {
      accessor: 'discrepancy',
      Header: 'Resultado',
      align: 'right',
      maxWidth: '0.4fr',
      minWidth: '100px',
      cell: ({ value }: ColumnCellProps<CashCountRecord>) => {
        const isOpen = value?.state === 'open' || value?.state === 'closing';
        if (isOpen) {
          return (
            <PendingBadge>
              <FontAwesomeIcon icon={faClock} style={{ fontSize: '12px' }} />
              Pendiente
            </PendingBadge>
          );
        }

        let color: 'success' | 'error' | 'warning' = 'success';
        switch (true) {
          case (value.totalDiscrepancy ?? 0) < 0:
            color = 'error';
            break;
          case (value.totalDiscrepancy ?? 0) > 0:
            color = 'warning';
            break;
          default:
            color = 'success';
            break;
        }
        return (
          <Tag
            color={color}
            style={{ fontSize: '16px', padding: '5px 10px', borderRadius: '6px' }}
          >
            {formatPrice(value.totalDiscrepancy ?? 0)}
          </Tag>
        );
      },
    },
  ];
  return columns;
};
