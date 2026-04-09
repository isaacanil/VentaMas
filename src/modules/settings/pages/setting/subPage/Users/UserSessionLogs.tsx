import { Alert, Button } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { fbGetSessionLogs } from '@/firebase/Auth/fbAuthV2/fbGetSessionLogs';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { AdvancedTableProps } from '@/components/ui/AdvancedTable/AdvancedTable';

type SessionActor = {
  displayName?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
};

type SessionMetadata = {
  deviceLabel?: string;
  label?: string;
  platform?: string;
  timezone?: string;
  ipAddress?: string;
  [key: string]: unknown;
};

type SessionContext = {
  metadata?: SessionMetadata;
  actor?: SessionActor;
  deviceLabel?: string;
  platform?: string;
  label?: string;
  ipAddress?: string;
  [key: string]: unknown;
};

type SessionLog = {
  event?: string;
  createdAt?: number | null;
  context?: SessionContext | null;
  [key: string]: unknown;
};

type NormalizedContext = SessionContext & {
  metadata: SessionMetadata;
  actor: SessionActor;
};

type SessionLogRow = {
  index: number;
  userName: string;
  event: string;
  createdAtDisplay: string;
  deviceLabel: string;
  platform: string;
  ipAddress: string;
};

const columns: AdvancedTableProps<SessionLogRow>['columns'] = [
  {
    Header: '#',
    accessor: 'index',
    align: 'left',
    maxWidth: '0.2fr',
    minWidth: '60px',
  },
  {
    Header: 'Nombre',
    accessor: 'userName',
    align: 'left',
    minWidth: '200px',
  },
  {
    Header: 'Evento',
    accessor: 'event',
    align: 'left',
    minWidth: '160px',
  },
  {
    Header: 'Fecha',
    accessor: 'createdAtDisplay',
    align: 'left',
    minWidth: '200px',
  },
  {
    Header: 'Dispositivo',
    accessor: 'deviceLabel',
    align: 'left',
    minWidth: '200px',
  },
  {
    Header: 'Plataforma',
    accessor: 'platform',
    align: 'left',
    minWidth: '160px',
  },
  {
    Header: 'IP',
    accessor: 'ipAddress',
    align: 'left',
    minWidth: '140px',
  },
];

const normalizarContexto = (context: SessionContext | null | undefined) => {
  if (!context || typeof context !== 'object') {
    return { metadata: {}, actor: {} } as NormalizedContext;
  }
  const metadata =
    context.metadata && typeof context.metadata === 'object'
      ? context.metadata
      : {};
  const actor =
    context.actor && typeof context.actor === 'object' ? context.actor : {};
  return {
    ...context,
    metadata,
    actor,
  } as NormalizedContext;
};

export const UserSessionLogs = () => {
  const [state, setState] = useState<{
    logs: SessionLog[];
    loading: boolean;
    error: string | null;
  }>({
    logs: [],
    loading: true,
    error: null,
  });

  const cargarRegistros = useCallback(() => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));
    void fbGetSessionLogs({ limit: 100 })
      .then(
        (response) => {
          setState({
            logs: response,
            loading: false,
            error: null,
          });
        },
        (error) => {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo cargar el historial de sesiones.';
          setState({
            logs: [],
            loading: false,
            error: message,
          });
        },
      );
  }, []);

  useEffect(() => {
    let active = true;

    void fbGetSessionLogs({ limit: 100 }).then(
      (response) => {
        if (!active) return;
        setState({
          logs: response,
          loading: false,
          error: null,
        });
      },
      (error) => {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el historial de sesiones.';
        setState({
          logs: [],
          loading: false,
          error: message,
        });
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const data = useMemo<SessionLogRow[]>(() => {
    return state.logs.map((log, index) => {
      const context = normalizarContexto(log.context);
      const createdAtMillis =
        typeof log.createdAt === 'number' ? log.createdAt : null;
      const createdAtDisplay = createdAtMillis
        ? DateTime.fromMillis(createdAtMillis).toLocaleString(
            DateTime.DATETIME_MED_WITH_SECONDS,
          )
        : 'Sin registro';

      const metadata = context.metadata || {};
      const actor = context.actor || {};
      const deviceLabel =
        context.deviceLabel ||
        metadata.deviceLabel ||
        context.label ||
        metadata.label;
      const platform = context.platform || metadata.platform;
      const timezone = metadata.timezone ? ` (${metadata.timezone})` : '';
      const ipAddress = context.ipAddress || metadata.ipAddress;
      const userName =
        actor.displayName || actor.name || actor.username || 'Sin datos';

      return {
        index: index + 1,
        event: log.event || 'desconocido',
        userName,
        deviceLabel: deviceLabel || 'Sin etiqueta',
        platform: platform ? `${platform}${timezone}` : 'Sin datos',
        ipAddress: ipAddress || 'Sin datos',
        createdAtDisplay,
      };
    });
  }, [state.logs]);

  return (
    <Wrapper>
      <Header>
        <Title>Historial de sesiones recientes</Title>
        <Button
          type="primary"
          onClick={cargarRegistros}
          loading={state.loading}
        >
          Actualizar
        </Button>
      </Header>

      {state.error && (
        <AlertWrapper>
          <Alert
            type="error"
            message="Error al cargar registros"
            description={state.error}
            showIcon
          />
        </AlertWrapper>
      )}

      <AdvancedTable
        tableName={'user-session-logs'}
        data={data}
        columns={columns}
        loading={state.loading}
        emptyText={
          state.loading
            ? 'Cargando registros...'
            : 'No se encontraron registros de sesión.'
        }
        numberOfElementsPerPage={25}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  min-height: 0;
  padding: 1.5rem;
  background-color: ${({ theme }) =>
    theme?.palette?.background?.light || '#f8f8f8'};
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.palette?.text?.primary || '#1f1f1f'};
`;

const AlertWrapper = styled.div`
  width: 100%;
`;
