import {
    ScheduleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
} from '@/constants/icons/antd';
import React from 'react';

import {
    TimelineContainer,
    StyledProgress,
    StyledProgressBar,
    StyledAlert,
} from '@/components/modals/ARInfoModal/styles';
import {
    formatCurrency,
    formatDate,
    calculateProgress,
    getNextPaymentInfo,
} from '@/components/modals/ARInfoModal/utils';
import type { AccountsReceivableSummaryView } from '@/utils/accountsReceivable/types';

interface TimelineProps {
    data?: AccountsReceivableSummaryView | null;
}

const Timeline = ({ data }: TimelineProps) => {
    const progress = calculateProgress(data);
    const nextPayment = getNextPaymentInfo(data);
    const totalPaid = data?.payments?.length || 0;

    return (
        <TimelineContainer>
            <div className="timeline-header">
                <span className="timeline-title">
                    <ScheduleOutlined style={{ marginRight: 8 }} />
                    Progreso de Pagos
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="timeline-info">
                        {totalPaid} pago{totalPaid !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontWeight: 700, color: '#262626' }}>
                        {progress.toFixed(0)}%
                    </span>
                </div>
            </div>

            <StyledProgress>
                <StyledProgressBar percent={progress} />
            </StyledProgress>

            {progress < 100 && nextPayment.date && (
                <StyledAlert type={nextPayment.isLate ? 'error' : 'info'}>
                    <div className="alert-icon">
                        {nextPayment.isLate ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />}
                    </div>
                    <div className="alert-content">
                        <div className="alert-message">
                            {nextPayment.isLate
                                ? `Pago vencido desde ${formatDate(nextPayment.date)}`
                                : `Próximo pago: ${formatDate(nextPayment.date)}`}
                        </div>
                        {nextPayment.amount && (
                            <div className="alert-description">
                                Monto de cuota: {formatCurrency(nextPayment.amount)}
                            </div>
                        )}
                    </div>
                </StyledAlert>
            )}
        </TimelineContainer>
    );
};

export default Timeline;
