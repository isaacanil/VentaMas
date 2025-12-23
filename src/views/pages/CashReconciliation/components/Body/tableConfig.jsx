import { faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tag } from 'antd';
import styled, { keyframes } from 'styled-components';

import DateUtils from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import { CashCountStateIndicator } from '@/views/pages/CashReconciliation/resource/CashCountStatusIndicator/CashCountStateIndicator';

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

export const tableConfig = () => {
  let columns = [
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
      cell: ({ value }) => <CashCountStateIndicator state={value} />,
    },
    {
      accessor: 'date',
      Header: 'Fecha Estado',
      align: 'left',
      maxWidth: '0.4fr',
      minWidth: '160px',
      //cell: ({value}) => convertMillisToDate(value)
      cell: ({ value }) => DateUtils.convertMillisToFriendlyDate(value),
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
      cell: ({ value }) => {
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
      cell: ({ value }) => {
        const isOpen = value?.state === 'open' || value?.state === 'closing';
        if (isOpen) {
          return (
            <PendingBadge>
              <FontAwesomeIcon icon={faClock} style={{ fontSize: '12px' }} />
              Pendiente
            </PendingBadge>
          );
        }

        let color = 'success';
        switch (true) {
          case value.totalDiscrepancy < 0:
            color = 'error';
            break;
          case value.totalDiscrepancy > 0:
            color = 'warning';
            break;
          default:
            color = 'success';
            break;
        }
        return (
          <Tag color={color} style={{ fontSize: '16px', padding: '5px 10px', borderRadius: '6px' }}>
            {formatPrice(value.totalDiscrepancy)}
          </Tag>
        );
      },
    },
    // {
    //   accessor: 'action',
    //   Header: 'Acción',
    //   align: 'right',
    //   maxWidth: '0.4fr',
    //   minWidth: '100px',
    //   clickable: false,
    //   cell: ({ value }) => <ActionButtons data={value} />
    // }
  ];
  return columns;
};
