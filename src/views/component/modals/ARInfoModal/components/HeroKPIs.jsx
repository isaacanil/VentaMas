import React from 'react';
import {
    FileTextOutlined,
    DollarOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { HeroKPIContainer, KPICard } from '../styles';
import { formatCurrency, getNextPaymentInfo, getDaysLate } from '../utils';

const HeroKPIs = ({ data }) => {
    const totalInvoice = data?.invoice?.totalPurchase?.value || 0;
    const totalReceivable = data?.ar?.totalReceivable || 0;
    const balance = data?.ar?.arBalance || 0;
    const paidAmount = totalReceivable - balance;
    const initialPaid = totalInvoice - totalReceivable;

    const nextPayment = getNextPaymentInfo(data);
    const daysLate = getDaysLate(nextPayment.date);

    // Configuración de estado para Balance Pendiente
    // Por defecto Amarillo (Pendiente/Advertencia)
    let statusConfig = {
        text: 'PENDIENTE',
        icon: <ClockCircleOutlined />,
        color: '#faad14',
        bg: '#fffbe6',
        borderColor: '#ffe58f',
    };

    if (balance <= 0) {
        statusConfig = {
            text: 'PAGADO',
            icon: <CheckCircleOutlined />,
            color: '#52c41a',
            bg: '#f6ffed',
            borderColor: '#b7eb8f',
        };
    } else if (nextPayment.isLate) {
        statusConfig = {
            text: `VENCIDO ${daysLate > 0 ? `POR ${daysLate} DÍAS` : ''}`,
            icon: <ExclamationCircleOutlined />,
            color: '#ff4d4f',
            bg: '#fff1f0',
            borderColor: '#ffa39e',
        };
    }

    // Configuración para Total Pagado
    const paidConfig = paidAmount > 0 ? {
        color: '#52c41a',
        bg: '#f6ffed',
        borderColor: '#b7eb8f'
    } : {
        color: '#595959',
        bg: '#fafafa',
        borderColor: '#d9d9d9'
    };

    return (
        <HeroKPIContainer>
            {/* Total Facturado */}
            <KPICard background="#fafafa" borderColor="#d9d9d9">
                <div className="kpi-label">
                    <FileTextOutlined />
                    Total Facturado
                </div>
                <div className="kpi-amount">{formatCurrency(totalInvoice)}</div>
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    Inicial: {formatCurrency(initialPaid)}
                </span>
            </KPICard>

            {/* Total Pagado */}
            <KPICard
                background={paidConfig.bg}
                borderColor={paidConfig.borderColor}
                color={paidConfig.color}
            >
                <div className="kpi-label">
                    <DollarOutlined />
                    Total Pagado
                </div>
                <div className="kpi-amount">{formatCurrency(paidAmount)}</div>
                <span style={{ fontSize: '12px', color: paidConfig.color }}>
                    {totalReceivable > 0
                        ? `${((paidAmount / totalReceivable) * 100).toFixed(0)}% del crédito`
                        : ''}
                </span>
            </KPICard>

            {/* Balance Pendiente */}
            <KPICard
                isPrimary
                background={statusConfig.bg}
                borderColor={statusConfig.borderColor}
                color={statusConfig.color}
                statusBg={statusConfig.bg}
                statusColor={statusConfig.color}
            >
                <div className="kpi-label">
                    <CalendarOutlined />
                    Balance Pendiente
                </div>
                <div className="kpi-amount">{formatCurrency(balance)}</div>
                <div className="kpi-status">
                    {statusConfig.icon}
                    {statusConfig.text}
                </div>
            </KPICard>
        </HeroKPIContainer>
    );
};

export default HeroKPIs;
