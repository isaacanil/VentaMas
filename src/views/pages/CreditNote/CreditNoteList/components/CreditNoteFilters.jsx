import React, { useState, useEffect } from 'react';
import { Select, Space, Button, Drawer } from 'antd';
import { ClearOutlined, FilterOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { DatePicker } from '../../../../../components/common/DatePicker';
import { useFbGetClientsOnOpen } from '../../../../../firebase/client/useFbGetClientsOnOpen';
import { CREDIT_NOTE_STATUS, CREDIT_NOTE_STATUS_LABEL } from '../../../../../constants/creditNoteStatus';
import dayjs from 'dayjs';

const { Option } = Select;

export const CreditNoteFilters = ({ filters, onFiltersChange }) => {
    const { clients: fetchedClients, loading: clientsLoading } = useFbGetClientsOnOpen({ isOpen: true });
    const clients = fetchedClients.map(c => c.client);

    // Responsive
    const [isMobile, setIsMobile] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [draftRange, setDraftRange] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDateRangeChange = (dates) => {
        // 1) El usuario limpió el selector -> volver a "Hoy"
        if (!dates || !dates[0]) {
            setDraftRange(null);
            onFiltersChange({
                ...filters,
                startDate: dayjs().startOf('day'),
                endDate: dayjs().endOf('day')
            });
            return;
        }

        // 2) Sólo eligió la primera fecha
        if (dates[0] && !dates[1]) {
            setDraftRange(dates[0]);
            return; // no aplicamos filtro aún
        }

        // 3) Ya hay start & end -> aplicamos filtro y limpiamos draft
        setDraftRange(null);
        onFiltersChange({
            ...filters,
            startDate: dates[0].startOf('day'),
            endDate: dates[1].endOf('day')
        });
    };

    const handleClientChange = (clientId) => {
        onFiltersChange({
            ...filters,
            clientId: clientId || null
        });
    };

    const handleStatusChange = (status) => {
        onFiltersChange({
            ...filters,
            status: status || null
        });
    };

    const handleClearFilters = () => {
        onFiltersChange({
            startDate: dayjs().startOf('day'),
            endDate: dayjs().endOf('day'),
            clientId: null,
            status: null
        });
    };

    // Si draftRange existe significa que el usuario ha seleccionado solo la primera fecha
    const dateRange = draftRange
        ? [draftRange, null]
        : filters.startDate
            ? [filters.startDate, filters.endDate]
            : null;

    const FiltersContent = (
        <Container>
            {isMobile ? (
                <MobileFiltersContainer>
                    <MobileFilterGroup>
                        <MobileFilterLabel>Rango de fechas:</MobileFilterLabel>
                        <DatePicker
                            mode="range"
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            format="DD/MM/YYYY"
                            placeholder="Seleccionar fechas"
                            allowClear
                            presets={[
                                {
                                    label: 'Hoy',
                                    value: [dayjs().startOf('day'), dayjs().endOf('day')]
                                },
                                {
                                    label: 'Ayer',
                                    value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')]
                                },
                                {
                                    label: 'Esta semana',
                                    value: [dayjs().startOf('week'), dayjs().endOf('week')]
                                },
                                {
                                    label: 'Este mes',
                                    value: [dayjs().startOf('month'), dayjs().endOf('month')]
                                },
                                {
                                    label: 'Este año',
                                    value: [dayjs().startOf('year'), dayjs().endOf('year')]
                                },
                                {
                                    label: 'Últimos 7 días',
                                    value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]
                                },
                                {
                                    label: 'Últimos 30 días',
                                    value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')]
                                }
                            ]}
                        />
                    </MobileFilterGroup>

                    <MobileFilterGroup>
                        <MobileFilterLabel>Cliente:</MobileFilterLabel>
                        <Select
                            value={filters.clientId || ''}
                            onChange={handleClientChange}
                            placeholder="Seleccionar cliente"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            loading={clientsLoading}
                            style={{ width: '100%' }}
                            size="middle"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            <Option value="">Todos los clientes</Option>
                            {clients.map(client => (
                                <Option key={client.id} value={client.id}>
                                    {client.name}
                                    {client.rnc && ` (${client.rnc})`}
                                </Option>
                            ))}
                        </Select>
                    </MobileFilterGroup>

                    <MobileFilterGroup>
                        <MobileFilterLabel>Estado:</MobileFilterLabel>
                        <Select
                            value={filters.status || ''}
                            onChange={handleStatusChange}
                            placeholder="Todos los estados"
                            allowClear
                            style={{ width: '100%' }}
                            size="middle"
                        >
                            <Option value="">Todos</Option>
                            {Object.entries(CREDIT_NOTE_STATUS).map(([key, value]) => (
                                <Option key={value} value={value}>
                                    {CREDIT_NOTE_STATUS_LABEL[value]}
                                </Option>
                            ))}
                        </Select>
                    </MobileFilterGroup>

                    <MobileFilterGroup>
                        <Button
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                            title="Limpiar filtros"
                            style={{ width: '100%' }}
                        >
                            Limpiar filtros
                        </Button>
                    </MobileFilterGroup>
                </MobileFiltersContainer>
            ) : (
                <FiltersRow>
                    <FilterGroup>
                        <FilterLabel>Rango de fechas:</FilterLabel>
                        <DatePicker
                            mode="range"
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            format="DD/MM/YYYY"
                            placeholder="Seleccionar fechas"
                            allowClear
                            presets={[
                                {
                                    label: 'Hoy',
                                    value: [dayjs().startOf('day'), dayjs().endOf('day')]
                                },
                                {
                                    label: 'Ayer',
                                    value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')]
                                },
                                {
                                    label: 'Esta semana',
                                    value: [dayjs().startOf('week'), dayjs().endOf('week')]
                                },
                                {
                                    label: 'Este mes',
                                    value: [dayjs().startOf('month'), dayjs().endOf('month')]
                                },
                                {
                                    label: 'Este año',
                                    value: [dayjs().startOf('year'), dayjs().endOf('year')]
                                },
                                {
                                    label: 'Últimos 7 días',
                                    value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')]
                                },
                                {
                                    label: 'Últimos 30 días',
                                    value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')]
                                }
                            ]}
                        />
                    </FilterGroup>

                    <FilterGroup>
                        <FilterLabel>Cliente:</FilterLabel>
                        <Select
                            value={filters.clientId || ''}
                            onChange={handleClientChange}
                            placeholder="Todos"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            loading={clientsLoading}
                            style={{ width: '100%', minWidth: 150, maxWidth: 250 }}
                            size="middle"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            <Option value="">Todos</Option>
                            {clients.map(client => (
                                <Option key={client.id} value={client.id}>
                                    {client.name}
                                    {client.rnc && ` (${client.rnc})`}
                                </Option>
                            ))}
                        </Select>
                    </FilterGroup>

                    <FilterGroup>
                        <FilterLabel>Estado:</FilterLabel>
                        <Select
                            value={filters.status || ''}
                            onChange={handleStatusChange}
                            placeholder="Todos"
                            allowClear
                            style={{ width: '100%', minWidth: 120, maxWidth: 180 }}
                            size="middle"
                        >
                            <Option value="">Todos</Option>
                            {Object.entries(CREDIT_NOTE_STATUS).map(([key, value]) => (
                                <Option key={value} value={value}>
                                    {CREDIT_NOTE_STATUS_LABEL[value]}
                                </Option>
                            ))}
                        </Select>
                    </FilterGroup>

                    <FilterGroup>
                        <Button
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                            title="Limpiar filtros"
                        >
                            Limpiar
                        </Button>
                    </FilterGroup>
                </FiltersRow>
            )}
        </Container>
    );

    if (isMobile) {
        return (
            <MobileContainer>
                <Button icon={<FilterOutlined />} onClick={() => setDrawerVisible(true)}>
                    Filtros
                </Button>
                <Drawer
                    title="Filtros"
                    placement="bottom"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    height="70%"
                >
                    {FiltersContent}
                </Drawer>
            </MobileContainer>
        );
    }

    return FiltersContent;
};

const Container = styled.div`
    background: white;
    padding: 0em 1em 0em;
    margin-bottom: 1rem;

    @media (max-width: 768px) {
        padding: 0.5rem;
        overflow-x: auto;
    }
`;

const MobileContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.8em 1em;
    width: 100%;
    background-color: var(--White);
    border-bottom: 1px solid var(--Gray);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const MobileFiltersContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    min-height: 300px;
`;

const MobileFilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const MobileFilterLabel = styled.label`
    font-size: 0.875rem;
    font-weight: 600;
    color: #262626;
    margin-bottom: 0.25rem;
`;

const ClearButtonContainer = styled.div`
    margin-top: 1rem;
`;

const FiltersRow = styled.div`
    display: flex;
    gap: 1.5rem;
    align-items: flex-end;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    @media (max-width: 768px) {
        width: 100%;

        /* Asegura que los controles ocupen todo el ancho */
        & > * {
            width: 100% !important;
        }
    }
`;

const FilterLabel = styled.label`
    font-size: 0.875rem;
    font-weight: 500;
    color: #262626;
`;

 