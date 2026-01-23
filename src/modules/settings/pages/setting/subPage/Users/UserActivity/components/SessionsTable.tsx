import { MoreOutlined, StopOutlined } from '@/constants/icons/antd';
import { Button, Dropdown, Tag, type MenuProps } from 'antd';
import { useMemo, type ReactNode } from 'react';

import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { AdvancedTableProps } from '@/components/ui/AdvancedTable/AdvancedTable';

import { DateCell } from './DateCell';
import type { SessionSummary } from '../utils/activityUtils';

interface SessionsTableProps {
  sessions: SessionSummary[];
  loading: boolean;
  emptyText: ReactNode;
  onCloseSession?: (session: SessionSummary) => void;
  revokingSessionId?: string | null;
}

export const SessionsTable = ({
  sessions,
  loading,
  emptyText,
  onCloseSession,
  revokingSessionId,
}: SessionsTableProps) => {
  const columns = useMemo<AdvancedTableProps<SessionSummary>['columns']>(
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
        cell: ({ row }: { row?: SessionSummary }) => (
          <DateCell millis={row?.startAt ?? null} />
        ),
      },
      {
        Header: 'Cierre',
        accessor: 'endAt',
        align: 'left',
        minWidth: '130px',
        cell: ({ row }: { row?: SessionSummary }) => {
          if (row?.status === 'open') {
            return <Tag color="processing">En curso</Tag>;
          }
          return <DateCell millis={row?.endAt ?? null} />;
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
        cell: ({ row }: { row?: SessionSummary }) => {
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
        cell: ({ row }: { row?: SessionSummary }) => {
          if (row?.status === 'open') {
            const menu: MenuProps = {
              items: [
                {
                  key: 'close',
                  label: 'Cerrar sesión',
                  icon: <StopOutlined />,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'close' && row) onCloseSession?.(row);
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
