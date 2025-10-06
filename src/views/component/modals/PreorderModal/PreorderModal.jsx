import { useState } from 'react';
import styled from 'styled-components';
import {
    UserOutlined,
    ShoppingOutlined,
    CreditCardOutlined,
    CloseOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons';
import { icons } from '../../../../constants/icons/icons';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';

const IconLabel = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
`;

// Styled Components
const IconButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid #d9d9d9;
    background: #fff;
    color: #1f1f1f;
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
    opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
    transition: all 0.2s ease;

    &:hover {
        border-color: ${({ disabled }) => (disabled ? '#d9d9d9' : '#1f1f1f')};
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    z-index: 900;
`;

const ModalCard = styled.article`
    width: min(720px, 92vw);
    max-height: 90vh;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
    padding: 20px;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 16px;
    overflow: hidden;
`;

const ModalHeader = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

const ModalTitle = styled.h3`
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: #0f172a;
`;

const CloseButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
        color: #0f172a;
    }
`;

const ModalBody = styled.div`
    max-height: calc(90vh - 110px);
    overflow-y: auto;
    padding-right: 8px;
    display: grid;
    gap: 14px;
    align-content: flex-start;
`;

const Section = styled.section`
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
    display: grid;
    gap: 12px;
    background: #f8fafc;
    text-align: left;
`;

const SectionTitle = styled.h4`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
`;

const ToggleButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #cbd5f5;
    background: #fff;
    color: #1d4ed8;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #eff6ff;
        border-color: #93c5fd;
    }
`;

const StatusBadge = styled.span`
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: ${({ $tone }) => `${$tone}1f`};
    color: ${({ $tone }) => $tone};
`;

const InfoGrid = styled.div`
    display: grid;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #334155;
    text-align: left;
`;

const InfoLabel = styled.span`
    font-weight: 500;
    color: #0f172a;
`;

const ProductsTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;

    thead th {
        text-align: left;
        font-weight: 600;
        padding: 6px 10px;
        color: #475569;
    }

    tbody tr {
        border-top: 1px solid #e2e8f0;
    }

    tbody td {
        padding: 8px 10px;
        color: #1f2937;
        text-align: left;
        vertical-align: top;
    }

    tbody td:last-child,
    thead th:last-child {
        text-align: right;
    }
`;

const PaymentRow = styled.div`
    display: flex;
    justify-content: space-between;
    color: #1f2937;
    font-size: 0.9rem;
`;

const PaymentTotal = styled(PaymentRow)`
    font-weight: 600;
    font-size: 1rem;
    margin-top: 6px;
`;

const Separator = styled.hr`
    border: none;
    border-top: 1px dashed #cbd5f5;
    margin: 4px 0;
`;

export default function PreorderModal({ preorder }) {
    const [visible, setVisible] = useState(false);
    const [isClientExpanded, setIsClientExpanded] = useState(false);
    const isReady = Boolean(preorder);
    const status = preorder?.status ?? '';
    const products = preorder?.products ?? [];
    const totalPurchaseValue = Number(preorder?.totalPurchase?.value ?? 0);
    const deliveryStatus = Boolean(preorder?.delivery?.status);
    const deliveryValue = Number(preorder?.delivery?.value ?? 0);
    const subtotalValue = deliveryStatus ? Math.max(totalPurchaseValue - deliveryValue, 0) : totalPurchaseValue;
    const createdAtSeconds = preorder?.preorderDetails?.date?.seconds;
    const createdAtLabel = createdAtSeconds
        ? new Date(createdAtSeconds * 1000).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })
        : 'Fecha no disponible';
    const hasCreatedAt = Boolean(createdAtSeconds);
    const orderNumber = preorder?.preorderDetails?.numberID ?? '—';
    const customerName = preorder?.client?.name ?? 'Cliente sin nombre';
    const customerPhone = preorder?.client?.tel || 'N/A';
    const customerAddress = preorder?.client?.address || 'Sin dirección';
    const hasClientExtra = customerAddress && customerAddress !== 'Sin dirección';

    const getStatusColor = (value) => {
        switch ((value || '').toLowerCase()) {
            case 'pending':
                return '#ea580c';
            case 'completed':
                return '#15803d';
            case 'cancelled':
                return '#dc2626';
            default:
                return '#475569';
        }
    };

    const getStatusName = (value) => {
        switch ((value || '').toLowerCase()) {
            case 'pending':
                return 'Pendiente';
            case 'completed':
                return 'Completado';
            case 'cancelled':
                return 'Cancelado';
            default:
                return 'Desconocido';
        }
    };

    const statusTone = getStatusColor(status);

    const openModal = () => {
        if (!isReady) return;
        setIsClientExpanded(false);
        setVisible(true);
    };

    const closeModal = () => {
        setVisible(false);
        setIsClientExpanded(false);
    };

    return (
        <>
            <IconButton onClick={openModal} disabled={!isReady} aria-label="Ver preventa">
                {icons.editingActions.show}
            </IconButton>
            {isReady && visible && (
                <ModalOverlay onClick={closeModal}>
                    <ModalCard onClick={(event) => event.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                <IconLabel>
                                    <ShoppingOutlined />
                                    Pedido #{orderNumber}
                                </IconLabel>
                            </ModalTitle>
                            <CloseButton onClick={closeModal} aria-label="Cerrar">
                                <CloseOutlined />
                            </CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            <StatusBadge $tone={statusTone}>
                                <span>{getStatusName(status)}</span>
                                {hasCreatedAt && <span>•</span>}
                                <span>{hasCreatedAt ? createdAtLabel : 'Fecha no disponible'}</span>
                            </StatusBadge>

                            <Section>
                                <SectionHeader>
                                    <SectionTitle>
                                        <UserOutlined /> Cliente
                                    </SectionTitle>
                                    {hasClientExtra && (
                                        <ToggleButton
                                            type="button"
                                            onClick={() => setIsClientExpanded((prev) => !prev)}
                                            aria-expanded={isClientExpanded}
                                            aria-label={isClientExpanded ? 'Ocultar detalles del cliente' : 'Ver detalles del cliente'}
                                        >
                                            {isClientExpanded ? <UpOutlined /> : <DownOutlined />}
                                            {isClientExpanded ? 'Ocultar' : 'Ver detalles'}
                                        </ToggleButton>
                                    )}
                                </SectionHeader>
                                <InfoGrid>
                                    <InfoLabel>{customerName}</InfoLabel>
                                    <span><InfoLabel>Teléfono:</InfoLabel> {customerPhone}</span>
                                    {isClientExpanded && hasClientExtra && (
                                        <span><InfoLabel>Dirección:</InfoLabel> {customerAddress}</span>
                                    )}
                                </InfoGrid>
                            </Section>

                            <Section>
                                <SectionTitle>
                                    <ShoppingOutlined /> Productos ({products.length})
                                </SectionTitle>
                                <ProductsTable>
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Cant.</th>
                                            <th>Tamaño</th>
                                            <th>Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((item, index) => (
                                            <tr key={`${item?.name || 'producto'}-${index}`}>
                                                <td>{item?.name || 'Sin nombre'}</td>
                                                <td>{item?.amountToBuy ?? 0}</td>
                                                <td>{item?.size || 'N/A'}</td>
                                                <td>{useFormatPrice(Number(item?.pricing?.price ?? 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </ProductsTable>
                            </Section>

                            <Section>
                                <SectionTitle>
                                    <CreditCardOutlined /> Resumen
                                </SectionTitle>
                                <PaymentRow>
                                    <span>Subtotal</span>
                                    <span>{useFormatPrice(subtotalValue)}</span>
                                </PaymentRow>
                                {deliveryStatus && (
                                    <PaymentRow>
                                        <span>Entrega</span>
                                        <span>{useFormatPrice(deliveryValue)}</span>
                                    </PaymentRow>
                                )}
                                <Separator />
                                <PaymentTotal>
                                    <span>Total</span>
                                    <span>{useFormatPrice(totalPurchaseValue)}</span>
                                </PaymentTotal>
                            </Section>
                        </ModalBody>
                    </ModalCard>
                </ModalOverlay>
            )}
        </>
    );
}
