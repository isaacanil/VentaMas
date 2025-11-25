import React from 'react';
import {
    DollarOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, message } from 'antd';
import { ActionButtonsContainer } from '../styles';
import { generateARPDF } from '../generateARPDF';

const ActionButtons = ({ data, onPay }) => {
    const hasBalance = (data?.ar?.arBalance || 0) > 0;

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
