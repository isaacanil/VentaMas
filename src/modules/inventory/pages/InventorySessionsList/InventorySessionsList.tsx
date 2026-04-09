import { Button, Select, Space, Skeleton } from 'antd';
import { DateTime } from 'luxon';
import React, {
  useMemo,
  useState,
  Fragment,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { DatePicker as RangeDatePicker } from '@/components/common/DatePicker/DatePicker';
import { PageShell } from '@/components/layout/PageShell';
import { selectUser } from '@/features/auth/userSlice';
import { formatDate, toMillis } from '@/utils/date/dateUtils';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { AdvancedTableProps } from '@/components/ui/AdvancedTable/AdvancedTable';
import { useInventorySessionsList } from '@/hooks/inventory/useInventorySessionsList';
import type {
  InventoryEditorInfo,
  InventorySession,
  InventoryUser,
  TimestampLike,
} from '@/utils/inventory/types';

type EmbeddedUser = {
  realName?: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
};

type InventorySessionDoc = InventorySession & {
  id: string;
  status?: string;
  createdAt?: TimestampLike;
  createdBy?: string | null;
  createdByName?: string | null;
  user?: EmbeddedUser | null;
};

type SessionRow = InventorySessionDoc & {
  key: string;
  editorsList: InventoryEditorInfo[];
  createdByDisplay: string;
  createdByLoading: boolean;
  editorsLoading: boolean;
} & Record<string, unknown>;


type DateRangeValue = [DateTime | null, DateTime | null] | null;

type InventoryUserProfile = InventoryUser & {
  uid?: string;
  id?: string;
  realName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  userId?: string;
  user_id?: string;
};

export default function InventorySessionsList() {
  const user = useSelector(selectUser) as InventoryUserProfile | null;
  const navigate = useNavigate();

  const {
    sessions,
    loading,
    openSessionId,
    userNameCache,
    resolvingUIDs,
    editorListBySessionId,
    loadingEditorsBySession,
    ensureOpenOrCreateSession,
    formatUserDisplay,
    pickEmbeddedUserName,
  } = useInventorySessionsList(user);

  const [statusFilter, setStatusFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRangeValue>([
    DateTime.local().startOf('month'),
    DateTime.local().endOf('month'),
  ]);

  const handleCreate = async () => {
    if (!user?.businessID) return;
    if (openSessionId) {
      navigate(`/inventory/control/${openSessionId}`);
      return;
    }

    const id = await ensureOpenOrCreateSession();
    if (id) {
      navigate(`/inventory/control/${id}`);
    }
  };

  const handleRowClick = (row: SessionRow) => {
    const sessionId = typeof row.id === 'string' ? row.id : null;
    if (sessionId) {
      navigate(`/inventory/control/${sessionId}`);
    }
  };

  const columns: AdvancedTableProps<SessionRow>['columns'] = [
    {
      Header: 'Nombre',
      accessor: 'name',
      minWidth: '200px',
      maxWidth: '2fr',
    },
    {
      Header: 'Usuarios',
      accessor: 'editorsList',
      minWidth: '220px',
      maxWidth: '2fr',
      cell: ({ value, row }) => (
        <EditorsList
          editors={Array.isArray(value) ? (value as InventoryEditorInfo[]) : []}
          loading={Boolean(row?.editorsLoading)}
        />
      ),
    },
    {
      Header: 'Estado',
      accessor: 'status',
      minWidth: '120px',
      maxWidth: '1fr',
      cell: ({ value }) => {
        const status = typeof value === 'string' ? value : '';
        return (
          <StatusBadge status={status}>
            {status === 'open'
              ? 'Abierto'
              : status === 'closed'
                ? 'Cerrado'
                : status || 'Abierto'}
          </StatusBadge>
        );
      },
    },
    {
      Header: 'Fecha de Creación',
      accessor: 'createdAt',
      minWidth: '150px',
      maxWidth: '1fr',
      cell: ({ value }) => (value ? formatDate(value) : 'N/A'),
    },
    {
      Header: 'Creado por',
      accessor: 'createdByDisplay',
      minWidth: '160px',
      maxWidth: '1fr',
      cell: ({ value, row }) =>
        row?.createdByLoading ? (
          <Skeleton.Input active size="small" style={{ width: 140 }} />
        ) : (
          <span>{typeof value === 'string' && value ? value : '\u2014'}</span>
        ),
    },
  ];

  const creatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (!s.createdBy) return;
      if (!map.has(s.createdBy)) {
        const display = formatUserDisplay(
          s.createdByName || userNameCache[s.createdBy] || s.createdBy,
        );
        map.set(s.createdBy, display);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [sessions, userNameCache, formatUserDisplay]);

  const filteredSessions = useMemo<InventorySessionDoc[]>(() => {
    return sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (creatorFilter !== 'all' && s.createdBy !== creatorFilter)
        return false;
      if (
        dateRange &&
        Array.isArray(dateRange) &&
        dateRange[0] &&
        dateRange[1]
      ) {
        const ts = toMillis(s.createdAt);
        if (!ts) return false;
        const start = dateRange[0].startOf('day').toMillis();
        const end = dateRange[1].endOf('day').toMillis();
        if (ts < start || ts > end) return false;
      }
      return true;
    });
  }, [sessions, statusFilter, creatorFilter, dateRange]);

  const clearFilters = () => {
    setStatusFilter('all');
    setCreatorFilter('all');
    setDateRange(null);
  };

  const tableData: SessionRow[] = filteredSessions.map((session) => {
    const embedded = pickEmbeddedUserName(session.user, session.createdBy);
    const createdByDisplay = formatUserDisplay(
      embedded ||
        session.createdByName ||
        userNameCache[session.createdBy] ||
        session.createdBy ||
        '',
    );
    const createdByLoading = session.createdBy
      ? !!resolvingUIDs[session.createdBy]
      : false;
    const editorsLoading = !!loadingEditorsBySession[session.id];
    return {
      ...session,
      key: session.id,
      editorsList: editorListBySessionId[session.id] || [],
      createdByDisplay,
      createdByLoading,
      editorsLoading,
    };
  });

  return (
    <Fragment>
      <MenuApp sectionName={'Inventarios'} />
      <Container>
        <Component>
          <Header>
            <FiltersBar>
              <RangePickerWrapper>
                <RangeDatePicker
                  mode="range"
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Rango de fechas"
                  allowClear
                />
              </RangePickerWrapper>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'open', label: 'Abiertos' },
                  { value: 'closed', label: 'Cerrados' },
                ]}
                placeholder="Estado"
              />
              <Select
                value={creatorFilter}
                onChange={setCreatorFilter}
                style={{ minWidth: 180 }}
                options={[
                  { value: 'all', label: 'Todos los usuarios' },
                  ...creatorOptions,
                ]}
                placeholder="Creado por"
                showSearch
                optionFilterProp="label"
              />
              <Button
                onClick={clearFilters}
                disabled={
                  statusFilter === 'all' &&
                  creatorFilter === 'all' &&
                  !dateRange
                }
              >
                Limpiar
              </Button>
            </FiltersBar>
            <Space>
              <Button
                type={openSessionId ? 'default' : 'primary'}
                onClick={handleCreate}
                title={
                  openSessionId
                    ? 'Ya existe un inventario abierto. Haz clic para ir a él.'
                    : 'Crear un nuevo inventario'
                }
              >
                {openSessionId ? 'Ver inventario abierto' : 'Crear inventario'}
              </Button>
            </Space>
          </Header>

          <TableContainer>
            <AdvancedTable<SessionRow>
              columns={columns}
              data={tableData}
              loading={loading}
              numberOfElementsPerPage={10}
              emptyText="No hay inventarios aún"
              onRowClick={handleRowClick}
              elementName="inventario"
            />
          </TableContainer>
        </Component>
      </Container>
    </Fragment>
  );
}

const Container = styled(PageShell)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1rem;
`;

const Component = styled.div`
  flex: 1;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0.85rem;
  width: 100%;
  max-width: 1440px;
  min-height: 0;
  padding: 0.75rem 1rem 1rem;
  margin: 0 auto;
  overflow: hidden;
  box-sizing: border-box;
  background-color: #fff;
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.25rem;
`;

const FiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: center;
  flex: 1 1 540px;
`;

const RangePickerWrapper = styled.div`
  width: clamp(220px, 28vw, 340px);
`;

const TableContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;

  & > * {
    flex: 1 1 auto;
    min-height: 0;
  }
`;

const StatusBadge = styled.span<{ status?: string }>`
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ status }) =>
    status === 'open'
      ? '#2e7d32'
      : status === 'processing'
        ? '#d97706'
        : status === 'closed'
          ? '#666'
          : '#2e7d32'};
  background-color: ${({ status }) =>
    status === 'open'
      ? '#e7f5e7'
      : status === 'processing'
        ? '#fff7ed'
        : status === 'closed'
          ? '#f5f5f5'
          : '#e7f5e7'};
  border-radius: 4px;
`;

const EditorsInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
`;

const EditorPill = styled.span`
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.2;
  color: #111827;
  background: #f3f4f6;
  border-radius: 999px;
`;

const MorePill = styled(EditorPill)`
  background: #e5e7eb;
`;

const LoadingInline = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

type EditorsListProps = {
  editors?: InventoryEditorInfo[];
  loading?: boolean;
};

function EditorsList({ editors, loading }: EditorsListProps) {
  if (loading) return <LoadingInline>Cargando…</LoadingInline>;
  if (!editors || !editors.length)
    return <span style={{ color: '#6b7280' }}>— </span>;
  const shown = editors.slice(0, 3);
  const extra = editors.length - shown.length;
  return (
    <EditorsInline>
      {shown.map((e) => (
        <EditorPill key={e.uid}>{e.name}</EditorPill>
      ))}
      {extra > 0 && <MorePill>+{extra}</MorePill>}
    </EditorsInline>
  );
}
