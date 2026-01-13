import {
    DollarOutlined,
    DownloadOutlined,
} from '@/constants/icons/antd';
import { Button, Tooltip } from 'antd';
import React from 'react';

import { generateARPDF } from '@/components/modals/ARInfoModal/generateARPDF';
import { ActionButtonsContainer } from '@/components/modals/ARInfoModal/styles';
import type { AccountsReceivableSummaryView } from '@/utils/accountsReceivable/types';
import { toNumber } from '@/utils/number/toNumber';

interface ActionButtonsProps {
    data?: AccountsReceivableSummaryView | null;
    onPay?: () => void;
}

const ActionButtons = ({ data, onPay }: ActionButtonsProps) => {
    const hasBalance = toNumber(data?.ar?.arBalance) > 0;

    return (
        <ActionButtonsContainer>
            {hasBalance && (
                <Button
                    type="primary"
                    size="large"
                    icon={<DollarOutlined />}
                    onClick={onPay}
                >
                    Pagar
                </Button>
            )}

            <Tooltip title="Descargar PDF">
                <Button
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={() => generateARPDF(data)}
                />
            </Tooltip>
        </ActionButtonsContainer>
    );
};

export default ActionButtons;
