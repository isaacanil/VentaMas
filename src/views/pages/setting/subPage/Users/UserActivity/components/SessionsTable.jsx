import { MoreOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tag } from 'antd';
import { useMemo } from 'react';

import { AdvancedTable } from '../../../../../../templates/system/AdvancedTable/AdvancedTable';
import { DateCell } from './DateCell';

export const SessionsTable = ({
  sessions,
  loading,
  emptyText,
  onCloseSession,
  revokingSessionId,
}) => {
  const columns = useMemo(
    () => [
      {
        Header: '#',
        accessor: 'index',
        align: 'left',
        maxWidth: '0.2fr',
        minWidth: '50px',
      },
      {
        Header: 'Inicio de sesión',
        accessor: 'startAt',
        align: 'left',
        minWidth: '130px',
        cell: ({ row }) => <DateCell millis={row.startAt} />,
      },
      {
        Header: 'Cierre',
        accessor: 'endAt',
        align: 'left',
        minWidth: '130px',
        cell: ({ row }) => {
          if (row.status === 'open') {
            return <Tag color="processing">En curso</Tag>;
          }
          return <DateCell millis={row.endAt} />;
        },
      },
      {
        Header: 'Duración',
        accessor: 'durationDisplay',
        align: 'left',
        minWidth: '100px',
      },
      {
        Header: 'Dispositivo',
        accessor: 'deviceLabel',
        align: 'left',
        minWidth: '220px',
      },
      {
        Header: 'IP',
        accessor: 'ipAddress',
        align: 'left',
        minWidth: '130px',
        status: 'deleted',
      },
      {
        Header: 'Estado',
        accessor: 'status',
        align: 'left',
        minWidth: '120px',
        cell: ({ row }) => {
          const value = row?.status;
          const label = row?.statusLabel;
          let color = 'default';
          if (value === 'open') color = 'blue';
          else if (row?.endEvent && row.endEvent !== 'logout') color = 'red';
          return <Tag color={color}>{label}</Tag>;
        },
      },
      {
        Header: 'Acción',
        align: 'center',
        width: '80px',
        minWidth: '80px',
        cell: ({ row }) => {
          if (row?.status === 'open') {
            const menu = {
              items: [
                {
                  key: 'close',
                  label: 'Cerrar sesión',
                  icon: <StopOutlined />,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'close') onCloseSession?.(row);
              },
            };
            const isRevoking = revokingSessionId === row.sessionId;

            return (
              <Dropdown menu={menu} trigger={['click']} disabled={isRevoking}>
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  loading={isRevoking}
                />
              </Dropdown>
            );
          }
          return null;
        },
      },
    ],
    [onCloseSession, revokingSessionId],
  );

  return (
    <AdvancedTable
      tableName="user-activity"
      data={sessions}
      columns={columns}
      loading={loading}
      emptyText={emptyText}
      numberOfElementsPerPage={15}
    />
  );
};
