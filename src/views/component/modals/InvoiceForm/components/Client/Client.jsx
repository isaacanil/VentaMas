import { faUser, faPhone, faIdCard, faMapMarkerAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {Select, Modal, message} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import { changeClientInvoiceForm } from '../../../../../../features/invoice/invoiceFormSlice'
import { useFbGetClients } from '../../../../../../firebase/client/useFbGetClients'

export const Client = ({ invoice, isEditLocked = false }) => {
    const clientData = invoice?.client
    const dispatch = useDispatch()
    const { clients } = useFbGetClients();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const readOnly = isEditLocked;

    const genericNames = ['Generic Client', 'Cliente Genérico'];
    const genericIds = ['GC-0000'];
    const isClientObject = clientData && typeof clientData === 'object';
    const isClientEmpty = !isClientObject || Object.keys(clientData).length === 0;
    const normalizedName = typeof clientData?.name === 'string' ? clientData.name.trim() : '';
    const rawClientId = clientData?.id;
    const clientId = typeof rawClientId === 'string'
        ? rawClientId.trim()
        : typeof rawClientId === 'number'
            ? String(rawClientId)
            : '';
    const isGenericClient = isClientEmpty || genericNames.includes(normalizedName) || genericIds.includes(clientId) || !clientId;

    const normalizedClients = Array.isArray(clients) ? clients : [];

    const clientDictionary = useMemo(() => {
        return normalizedClients.reduce((acc, entry) => {
            const client = entry?.client;
            if (client?.id) {
                const key = typeof client.id === 'string' ? client.id : String(client.id);
                acc[key] = client;
            }
            return acc;
        }, {});
    }, [normalizedClients]);

    const options = useMemo(() => {
        return normalizedClients
            .map(({ client }) => ({
                label: client?.name || 'Sin nombre',
                value: client?.id ? (typeof client.id === 'string' ? client.id : String(client.id)) : undefined,
            }))
            .filter(option => Boolean(option.value));
    }, [normalizedClients]);

    const handleChangeClient = (value) => {
        if (readOnly) {
            message.warning('La factura está en modo de solo lectura.');
            return;
        }
        const key = typeof value === 'string' ? value : String(value);
        const selectedClient = clientDictionary[key];

        if (!selectedClient) {
            return;
        }

        dispatch(changeClientInvoiceForm({ client: selectedClient }))
        setIsModalOpen(false)
    }

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    useEffect(() => {
        if (readOnly && isModalOpen) {
            setIsModalOpen(false);
        }
    }, [readOnly, isModalOpen]);

    const openModal = () => {
        if (readOnly) {
            message.warning('No puedes cambiar el cliente después de 48 horas.');
            return;
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
    }

    const primaryDetails = [
        { icon: faUser, label: 'Nombre', value: clientData?.name },
        { icon: faPhone, label: 'Teléfono', value: clientData?.tel },
        { icon: faIdCard, label: 'ID Personal', value: clientData?.personalID }
    ]

    const secondaryDetails = [
        { icon: faMapMarkerAlt, label: 'Dirección', value: clientData?.address, fullWidth: true }
    ]

    const hasSecondaryDetails = secondaryDetails.some(detail => Boolean(detail.value))

    return (
        <Container>
            {isGenericClient ? (
                <GenericContainer>
                    <GenericTitle>Sin cliente asignado</GenericTitle>
                    <GenericDescription>
                        Agrega un cliente para personalizar la factura y mantener un historial preciso.
                    </GenericDescription>
                    <GenericButton onClick={openModal} disabled={readOnly}>Agregar cliente</GenericButton>
                </GenericContainer>
            ) : (
                <ClientDetailsCard>
                    <CardHeader>
                        <HeaderTitle>Información Cliente</HeaderTitle>
                        <ChangeClientButton onClick={openModal} disabled={readOnly}>
                            <span>Cambiar Cliente</span>
                        </ChangeClientButton>
                    </CardHeader>

                    <PrimaryDetailsGrid>
                        {primaryDetails.map((detail, index) => (
                            detail.value && (
                                <DetailItem key={index}>
                                    <DetailIcon>
                                        <FontAwesomeIcon icon={detail.icon} />
                                    </DetailIcon>
                                    <DetailContent>
                                        <DetailLabel>{detail.label}</DetailLabel>
                                        <DetailValue>{detail.value}</DetailValue>
                                    </DetailContent>
                                </DetailItem>
                            )
                        ))}
                    </PrimaryDetailsGrid>

                    {hasSecondaryDetails && (
                        <>
                            <CollapsibleContent isCollapsed={isCollapsed}>
                                <DetailsGrid>
                                    {secondaryDetails.map((detail, index) => (
                                        detail.value && (
                                            <DetailItem key={index} $fullWidth={detail.fullWidth}>
                                                <DetailIcon>
                                                    <FontAwesomeIcon icon={detail.icon} />
                                                </DetailIcon>
                                                <DetailContent>
                                                    <DetailLabel>{detail.label}</DetailLabel>
                                                    <DetailValue>{detail.value}</DetailValue>
                                                </DetailContent>
                                            </DetailItem>
                                        )
                                    ))}
                                </DetailsGrid>
                            </CollapsibleContent>

                            <FooterActions>
                                <ExpandButton onClick={toggleCollapse}>
                                    <span>{isCollapsed ? 'Ver más' : 'Ver menos'}</span>
                                    <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
                                </ExpandButton>
                            </FooterActions>
                        </>
                    )}
                </ClientDetailsCard>
            )}

            <Modal
                title="Seleccionar Cliente"
                open={isModalOpen}
                onCancel={closeModal}
                footer={null}
                width={500}
            >
                <ModalContent>
                    <Select
                        showSearch
                        placeholder="Buscar y seleccionar cliente"
                        filterOption={(input, option) => {
                            const optionLabel = typeof option?.label === 'string' ? option.label : '';
                            return optionLabel.toLowerCase().includes(input.toLowerCase());
                        }}
                        options={options}
                        style={{ width: '100%' }}
                        value={clientDictionary[clientId] ? clientId : undefined}
                        onChange={handleChangeClient}
                        size="large"
                        disabled={readOnly}
                    />
                </ModalContent>
            </Modal>
        </Container>
    )
}

const Container = styled.div`
    width: 100%;
`

const ClientDetailsCard = styled.div`
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    
`

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
`

const HeaderTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #262626;
`

const PrimaryDetailsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    padding: 12px;
    gap: 8px;
`

const DetailItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    grid-column: ${props => (props.$fullWidth ? '1 / -1' : 'auto')};
`

const DetailIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: #8c8c8c;
    font-size: 14px;
    flex-shrink: 0;
`

const DetailContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
`

const CollapsibleContent = styled.div`
    max-height: ${props => props.isCollapsed ? '0' : '500px'};
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
    padding: ${props => props.isCollapsed ? '0 12px' : '0 12px 12px 12px'};
`

const DetailsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`

const FooterActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-top: 1px solid #e8e8e8;
`

const ChangeClientButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    color: #262626;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    opacity: ${props => (props.disabled ? 0.6 : 1)};
    cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

    &:hover {
        ${props => props.disabled ? '' : `
        background: #1890ff;
        border-color: #1890ff;
        color: #ffffff;
        `}
    }
`

const ExpandButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #8c8c8c;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
        color: #1890ff;
    }

    span {
        font-size: 13px;
    }
`

const DetailLabel = styled.div`
    font-size: 12px;
    font-weight: 500;
    color: #6d6d6dff;
    text-transform: uppercase;
    letter-spacing: 0.3px;
`

const DetailValue = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: #262626;
    word-break: break-word;
`

const GenericContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border: 1px dashed #ffd591;
    border-radius: 12px;
    background: #fff7e6;
    margin-bottom: 16px;
`

const GenericTitle = styled.span`
    font-size: 14px;
    font-weight: 600;
    color: #ad6800;
`

const GenericDescription = styled.span`
    font-size: 12px;
    color: #8c8c8c;
    line-height: 1.4;
`

const GenericButton = styled.button`
    align-self: flex-start;
    padding: 8px 16px;
    border-radius: 6px;
    background: #1890ff;
    border: 1px solid #1890ff;
    color: #ffffff;
    cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s ease, border-color 0.2s ease;
    opacity: ${props => (props.disabled ? 0.6 : 1)};

    &:hover {
        ${props => props.disabled ? '' : `
        background: #40a9ff;
        border-color: #40a9ff;
        `}
    }
`

const ModalContent = styled.div`
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
`
