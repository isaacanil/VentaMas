import {
    PhoneOutlined,
    WhatsAppOutlined,
    CopyOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
} from '@/constants/icons/antd';
import { Tooltip, Button } from 'antd';
import React from 'react';

import { ContextContainer, ContextPanel, StyledTag } from '@/components/modals/ARInfoModal/styles';
import {
    formatDate,
    translateFrequency,
    getNextPaymentInfo,
    openWhatsApp,
    copyToClipboard,
} from '@/components/modals/ARInfoModal/utils';
import type { AccountsReceivableSummaryView } from '@/utils/accountsReceivable/types';

interface ContextPanelsProps {
    data?: AccountsReceivableSummaryView | null;
}

const ContextPanels = ({ data }: ContextPanelsProps) => {
    const nextPayment = getNextPaymentInfo(data);
    const emissionDate =
        data?.invoice?.emissionDate ??
        data?.invoice?.date ??
        data?.ar?.createdAt ??
        data?.ar?.updatedAt;
    const rawTotalShoppingItems = data?.invoice?.totalShoppingItems;
    const totalShoppingItems =
        typeof rawTotalShoppingItems === 'number'
            ? rawTotalShoppingItems
            : rawTotalShoppingItems?.value;
    const itemCount =
        totalShoppingItems ??
        data?.invoice?.itemsCount ??
        (Array.isArray(data?.invoice?.items) ? data.invoice.items.length : undefined) ??
        (Array.isArray(data?.invoice?.products)
            ? data.invoice.products.length
            : undefined) ??
        (Array.isArray(data?.ar?.items) ? data.ar.items.length : undefined) ??
        (Array.isArray(data?.installments) ? data.installments.length : undefined);

    return (
        <ContextContainer>
            {/* Panel Cliente */}
            <ContextPanel>
                <div className="panel-title">
                    <PhoneOutlined />
                    Información del Cliente
                </div>

                <div className="info-row">
                    <span className="info-label">Nombre:</span>
                    <span className="info-value">{data?.client?.name || 'N/A'}</span>
                </div>

                <div className="info-row">
                    <span className="info-label">Teléfono:</span>
                    <span className="info-value">
                        {data?.client?.tel || 'N/A'}
                        {data?.client?.tel2 && ` / ${data?.client?.tel2}`}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">RNC/Cédula:</span>
                    <span className="info-value">
                        {data?.client?.personalID || 'N/A'}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">Dirección:</span>
                    <span className="info-value">
                        {data?.client?.address || 'N/A'}
                        {data?.client?.sector && `, ${data?.client?.sector}`}
                    </span>
                </div>

                {/* Acciones Rápidas */}
                <div className="quick-actions">
                    <Tooltip title="Enviar WhatsApp">
                        <Button
                            icon={<WhatsAppOutlined />}
                            type="primary"
                            style={{ background: '#25D366' }}
                            onClick={() =>
                                openWhatsApp(data?.client?.tel, data?.client?.name)
                            }
                            disabled={!data?.client?.tel}
                        >
                            WhatsApp
                        </Button>
                    </Tooltip>

                    <Tooltip title="Llamar">
                        <Button
                            icon={<PhoneOutlined />}
                            href={`tel:${data?.client?.tel}`}
                            disabled={!data?.client?.tel}
                        >
                            Llamar
                        </Button>
                    </Tooltip>

                    <Tooltip title="Copiar dirección">
                        <Button
                            icon={<CopyOutlined />}
                            onClick={() =>
                                copyToClipboard(data?.client?.address, 'Dirección')
                            }
                            disabled={!data?.client?.address}
                        >
                            Copiar
                        </Button>
                    </Tooltip>

                    {data?.client?.address && (
                        <Tooltip title="Ver en Google Maps">
                            <Button
                                icon={<EnvironmentOutlined />}
                                onClick={() =>
                                    window.open(
                                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data?.client?.address)}`,
                                        '_blank',
                                    )
                                }
                            >
                                Mapa
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </ContextPanel>

            {/* Panel Factura */}
            <ContextPanel background="#f0f5ff">
                <div className="panel-title">
                    <FileTextOutlined />
                    Detalle de Factura
                </div>

                <div className="info-row">
                    <span className="info-label">Número:</span>
                    <span className="info-value">
                        #
                        {data?.invoice?.numberID ||
                            data?.invoice?.number ||
                            data?.ar?.numberId ||
                            'N/A'}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">NCF:</span>
                    <span className="info-value">{data?.invoice?.NCF || 'N/A'}</span>
                </div>

                <div className="info-row">
                    <span className="info-label">Emisión:</span>
                    <span className="info-value">
                        {formatDate(emissionDate)}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">Vencimiento:</span>
                    <span className="info-value">
                        {nextPayment.date ? formatDate(nextPayment.date) : 'N/A'}
                        {nextPayment.installmentNumber && (
                            <StyledTag
                                color={nextPayment.isLate ? 'error' : 'info'}
                            >
                                Cuota {nextPayment.installmentNumber}
                            </StyledTag>
                        )}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">Frecuencia:</span>
                    <span className="info-value">
                        {translateFrequency(data?.ar?.paymentFrequency)}
                    </span>
                </div>

                <div className="info-row">
                    <span className="info-label">Ítems:</span>
                    <span className="info-value">
                        {itemCount ?? 0}
                    </span>
                </div>
            </ContextPanel>
        </ContextContainer>
    );
};

export default ContextPanels;
