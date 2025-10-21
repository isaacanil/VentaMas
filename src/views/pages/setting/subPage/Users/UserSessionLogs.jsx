import { Alert, Button } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { fbGetSessionLogs } from '../../../../../firebase/Auth/fbAuthV2/fbGetSessionLogs';
import { AdvancedTable } from '../../../../templates/system/AdvancedTable/AdvancedTable';

const columns = [
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

const normalizarContexto = (context) => {
    if (!context || typeof context !== 'object') {
        return {};
    }
    const metadata = context.metadata && typeof context.metadata === 'object'
        ? context.metadata
        : {};
    const actor = context.actor && typeof context.actor === 'object'
        ? context.actor
        : {};
    return {
        ...context,
        metadata,
        actor,
    };
};

export const UserSessionLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initFetchRef = useRef(false);

    const cargarRegistros = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fbGetSessionLogs({ limit: 100 });
            setLogs(response);
        } catch (err) {
            setError(err?.message || 'No se pudo cargar el historial de sesiones.');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initFetchRef.current) {
            return;
        }
        initFetchRef.current = true;
        cargarRegistros();
    }, [cargarRegistros]);

    const data = useMemo(() => {
        return logs.map((log, index) => {
            const context = normalizarContexto(log.context);
            const createdAtMillis = typeof log.createdAt === 'number' ? log.createdAt : null;
            const createdAtDisplay = createdAtMillis
                ? DateTime.fromMillis(createdAtMillis).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)
                : 'Sin registro';

            const metadata = context.metadata || {};
            const actor = context.actor || {};
            const deviceLabel = context.deviceLabel || metadata.deviceLabel || context.label || metadata.label;
            const platform = context.platform || metadata.platform;
            const timezone = metadata.timezone ? ` (${metadata.timezone})` : '';
            const ipAddress = context.ipAddress || metadata.ipAddress;
            const userName = actor.displayName || actor.name || actor.username || 'Sin datos';

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
    }, [logs]);

    return (
        <Wrapper>
            <Header>
                <Title>Historial de sesiones recientes</Title>
                <Button type="primary" onClick={cargarRegistros} loading={loading}>
                    Actualizar
                </Button>
            </Header>

            {error && (
                <AlertWrapper>
                    <Alert
                        type="error"
                        message="Error al cargar registros"
                        description={error}
                        showIcon
                    />
                </AlertWrapper>
            )}

         
                <AdvancedTable
                    tableName={'user-session-logs'}
                    data={data}
                    columns={columns}
                    loading={loading}
                    emptyText={loading ? 'Cargando registros...' : 'No se encontraron registros de sesión.'}
                    numberOfElementsPerPage={25}
                />
       
        </Wrapper>
    );
};

const Wrapper = styled.div`
    padding: 1.5rem;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background-color: ${({ theme }) => theme?.palette?.background?.light || '#f8f8f8'};
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
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
