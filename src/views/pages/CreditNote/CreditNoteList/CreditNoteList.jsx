import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Space, Tooltip, Tag, Alert, Result, Empty, Spin } from 'antd';
import { EyeOutlined, EditOutlined, LockOutlined, SettingOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { openCreditNoteModal } from '../../../../features/creditNote/creditNoteModalSlice';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';
import { useFbGetCreditNotes } from '../../../../firebase/creditNotes/useFbGetCreditNotes';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable';
import { CreditNoteFilters } from './components/CreditNoteFilters';
import { useBusinessDataConfig } from '../../../../features/auth/useBusinessDataConfig';
import { fbGetTaxReceipt } from '../../../../firebase/taxReceipt/fbGetTaxReceipt';
import { selectTaxReceiptEnabled } from '../../../../features/taxReceipt/taxReceiptSlice';
import ROUTES_NAME from '../../../../routes/routesName';
import { CREDIT_NOTE_STATUS, CREDIT_NOTE_STATUS_LABEL, CREDIT_NOTE_STATUS_COLOR } from '../../../../constants/creditNoteStatus';

export const CreditNoteList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para los filtros
    const [filters, setFilters] = useState({
        startDate: dayjs().startOf('day'),
        endDate: dayjs().endOf('day'),
        clientId: null,
        status: null
    });

    const { creditNotes, loading: creditNotesLoading } = useFbGetCreditNotes(filters);
    const { taxReceipt, isLoading: taxReceiptLoading } = fbGetTaxReceipt();
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

    const isOverallLoading = creditNotesLoading || taxReceiptLoading;

    const ALLOWED_EDIT_MS = 2 * 24 * 60 * 60 * 1000; // 2 días


    const creditNoteReceipt = useMemo(() => {
        if (taxReceiptLoading) return null;      // aún no llega la data
        return taxReceipt?.find(r => {
            const name = (r.data?.name || '').toLowerCase();
            return (name.includes('nota') && name.includes('crédito')) || r.data?.serie === '04';
        });
    }, [taxReceiptLoading, taxReceipt]);

    const isCreditNoteReceiptConfigured =
        !!creditNoteReceipt && !creditNoteReceipt.data?.disabled;

    const showConfigWarning = useMemo(() => {
        // No mostrar warning si aún están cargando
        if (creditNotesLoading || taxReceiptLoading) return false;
        
        // Mostrar warning si:
        // 1. Los comprobantes fiscales están deshabilitados completamente, O
        // 2. Los comprobantes están habilitados pero no existe o está deshabilitado el de serie 04
        return !taxReceiptEnabled || (taxReceiptEnabled && !isCreditNoteReceiptConfigured);
    }, [creditNotesLoading, taxReceiptLoading, taxReceiptEnabled, isCreditNoteReceiptConfigured]);


    const handleGoToTaxReceiptConfig = () => {
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT);
    };

    const canEditRecord = (record) => {
        const created = record.createdAt?.seconds ? new Date(record.createdAt.seconds * 1000) : new Date(record.createdAt);
        const isTimeAllowed = Date.now() - created.getTime() <= ALLOWED_EDIT_MS;
        // Verificar si tiene aplicaciones basándose en el estado o saldo disponible
        const hasApplications = record.status === CREDIT_NOTE_STATUS.APPLIED || record.status === CREDIT_NOTE_STATUS.FULLY_USED || 
                               (record.availableAmount !== undefined && record.availableAmount < record.totalAmount);
        return isTimeAllowed && !hasApplications; // No se puede editar si ya se aplicó
    };

    const columns = [
        {
            Header: 'Fecha',
            accessor: 'createdAt',
            minWidth: '120px',
            maxWidth: '150px',
            sortable: true,
            cell: ({ value }) => {
                if (!value) return '-';
                const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
                return (
                    <div>
                        <div>{date.toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                );
            }
        },
        {
            Header: 'Número',
            accessor: 'ncf',
            minWidth: '120px',
            maxWidth: '150px',
            sortable: true,
            cell: ({ value }) => {
                const record = creditNotes.find(cn => cn.ncf === value);
                return (
                    <div>
                        <div style={{ fontWeight: 600 }}>{value || 'N/A'}</div>
                        {record?.number && (
                            <div style={{ fontSize: '0.8em', color: '#666' }}>
                                Ref: {record.number}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            Header: 'Cliente',
            accessor: 'client',
            minWidth: '200px',
            sortable: true,
            cell: ({ value }) => (
                <div>
                    <div>{value?.name || '-'}</div>
                    {value?.rnc && (
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                            RNC: {value.rnc}
                        </div>
                    )}
                </div>
            )
        },
        {
            Header: 'NCF Afectado',
            accessor: 'invoiceNcf',
            minWidth: '150px',
            maxWidth: '180px',
            sortable: true,
            cell: ({ value }) => (
                <div style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                    {value || 'N/A'}
                </div>
            )
        },

        {
            Header: 'Items',
            accessor: 'items',
            minWidth: '80px',
            maxWidth: '100px',
            align: 'center',
            cell: ({ value }) => (
                <Tag color="blue">
                    {value?.length || 0} items
                </Tag>
            )
        },
        {
            Header: 'Estado de Uso',
            accessor: 'status',
            minWidth: '100px',
            maxWidth: '120px',
            align: 'center',
            cell: ({ value }) => {
                const record = creditNotes.find(cn => cn.status === value);
                const hasApplications = value === CREDIT_NOTE_STATUS.APPLIED || value === CREDIT_NOTE_STATUS.FULLY_USED || 
                                       (record?.availableAmount !== undefined && record.availableAmount < record.totalAmount);
                
                return hasApplications ? (
                    <Tag color="green">
                        {value === CREDIT_NOTE_STATUS.FULLY_USED ? 'Totalmente Usada' : 'Parcialmente Usada'}
                    </Tag>
                ) : (
                    <Tag color="default">
                        Sin Aplicar
                    </Tag>
                );
            }
        },
        {
            Header: 'Monto',
            accessor: 'totalAmount',
            minWidth: '120px',
            maxWidth: '150px',
            align: 'right',
            sortable: true,
            cell: ({ value }) => {
                const record = creditNotes.find(cn => cn.totalAmount === value);
                const availableAmount = record?.availableAmount ?? value;
                return (
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        <div>{useFormatPrice(value || 0)}</div>
                        {availableAmount !== value && (
                            <div style={{ fontSize: '0.8em', color: '#666' }}>
                                Disponible: {useFormatPrice(availableAmount)}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            Header: 'Acciones',
            accessor: 'actions',
            minWidth: '150px',
            maxWidth: '180px',
            align: 'right',
            keepWidth: true,
            clickable: false,
            cell: ({ value }) => {
                // El value aquí será toda la fila (record completo)
                const record = creditNotes.find(cn => cn.id === value?.id) || value;
                return (
                    <Space size="small">
                        <Tooltip title="Ver">
                            <Button
                                icon={<EyeOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(record);
                                }}
                            />
                        </Tooltip>
                        {canEditRecord(record) ? (
                            <Tooltip title="Editar">
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(record);
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip title={
                                (record.status === CREDIT_NOTE_STATUS.APPLIED || record.status === CREDIT_NOTE_STATUS.FULLY_USED || 
                                 (record.availableAmount !== undefined && record.availableAmount < record.totalAmount))
                                    ? "No se puede editar: nota ya aplicada" 
                                    : "Edición deshabilitada (fuera de plazo)"
                            }>
                                <Button
                                    icon={<LockOutlined />}
                                    disabled
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            }
        },
    ];

    // Transformar los datos para incluir el record completo en la columna de acciones
    const transformedData = creditNotes.map(record => ({
        ...record,
        actions: record // Pasamos el record completo para las acciones
    }));

    const handleView = (record) => {
        dispatch(openCreditNoteModal({
            mode: 'view',
            creditNoteData: record
        }));
    };

    const handleEdit = (record) => {
        dispatch(openCreditNoteModal({
            mode: 'edit',
            creditNoteData: record
        }));
    };

    const handleRowClick = (record) => {
        handleView(record);
    };

    const HeaderComponent = () => (
        <HeaderContainer>
            <HeaderTitle>Notas de Crédito</HeaderTitle>
        </HeaderContainer>
    );

    // Asegurar que los datos del negocio estén suscritos
    useBusinessDataConfig();


    if (showConfigWarning) {
        // Determinar el mensaje específico según el caso
        const getWarningContent = () => {
            if (!taxReceiptEnabled) {
                return {
                    title: "Comprobantes Fiscales Deshabilitados",
                    subDescription: "Los comprobantes fiscales están deshabilitados en la configuración.",
                    description: "Para gestionar notas de crédito necesitas habilitar los comprobantes fiscales y configurar el comprobante correspondiente (serie 04)."
                };
            } else {
                return {
                    title: "Configuración Requerida",
                    subDescription: "Por favor, completa la configuración necesaria para continuar.",
                    description: "Para gestionar notas de crédito necesitas configurar el comprobante fiscal correspondiente (serie 04)."
                };
            }
        };

        const warningContent = getWarningContent();

        return (
            <Container>
                <MenuApp sectionName={"Notas de Crédito"}  data={[]} />
                <CreditNoteConfigWarning>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <WarningOutlined />
                        </EmptyStateIcon>
                        <EmptyStateTitle>
                            {warningContent.title}
                        </EmptyStateTitle>
                        <EmptyStateSubDescription>
                            {warningContent.subDescription}
                        </EmptyStateSubDescription>
                        <EmptyStateDescription>
                            {warningContent.description}
                        </EmptyStateDescription>
                        <ConfigButton
                            onClick={handleGoToTaxReceiptConfig}
                        >
                            Configurar ahora
                        </ConfigButton>
                    </EmptyStateContainer>
                </CreditNoteConfigWarning>
            </Container>
        );
    }

    return (
        <Container>
            <MenuApp
                searchData={searchTerm}
                setSearchData={setSearchTerm}
                data={creditNotes}
            />
            <TableContainer>
                <CreditNoteFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                />
                <AdvancedTable
                    data={transformedData}
                    columns={columns}
                    loading={isOverallLoading}
                    searchTerm={searchTerm}
                    headerComponent={<HeaderComponent />}
                    tableName="creditNotes"
                    elementName="nota de crédito"
                    onRowClick={handleRowClick}
                    numberOfElementsPerPage={15}

                    emptyText="No hay notas de crédito para mostrar"
                />
            </TableContainer>
        </Container>
    );
};

const Container = styled.div`
    height: 100%;
    display: grid;
    grid-template-rows: min-content 1fr;
    flex-direction: column;
`;

const TableContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    
    overflow: hidden;
`;

const CreditNoteConfigWarning = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1em 2em;
    background-color: #f8f9fa;
    min-height: 60vh;
`;

const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: white;
    border-bottom: 1px solid #f0f0f0;
`;

const HeaderTitle = styled.h2`
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    color: #262626;
`;

const EmptyStateContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5em;
    text-align: center;
    max-width: 480px;
    margin: 0 auto;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const EmptyStateIcon = styled.div`
    font-size: 24px;
    color: #f5a623;
    background-color: #fffbe6;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5em;
`;

const EmptyStateTitle = styled.h3`
    margin: 0;
    font-size: 1.4em;
    font-weight: 600;
    color: #262626;
    margin-bottom: 0.6em;
`;

const EmptyStateSubDescription = styled.p`
    margin: 0 0 1.5em 0;
    font-size: 1em;
    color: #8c8c8c;
    line-height: 1.5;
    max-width: 380px;
`;

const EmptyStateDescription = styled.p`
    margin: 0 0 2.5em 0;
    font-size: 1em;
    color: #8c8c8c;
    line-height: 1.5;
    max-width: 380px;
`;

const ConfigButton = styled.button`
    height: 48px;
    border-radius: 8px;
    font-weight: 600;
    padding: 0 2.5em;
    background-color: #1a1a1a;
    color: white;
    border: none;
    &:hover {
        background-color: #333;
        color: white !important;
    }
`;

const CenteredContainer = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;
