import { DollarOutlined, DownloadOutlined } from '@/constants/icons/antd';
import { ProfileOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';

import { generateARPDF } from '@/components/modals/ARInfoModal/generateARPDF';
import { ActionButtonsContainer } from '@/components/modals/ARInfoModal/styles';
import type { AccountsReceivableSummaryView } from '@/utils/accountsReceivable/types';
import { toNumber } from '@/utils/number/toNumber';

interface ActionButtonsProps {
  data?: AccountsReceivableSummaryView | null;
  onOpenAccountingEntry?: () => void;
  onPay?: () => void;
}

const ActionButtons = ({
  data,
  onOpenAccountingEntry,
  onPay,
}: ActionButtonsProps) => {
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

      {onOpenAccountingEntry ? (
        <Button
          size="large"
          icon={<ProfileOutlined />}
          onClick={onOpenAccountingEntry}
        >
          Contabilidad
        </Button>
      ) : null}

      <Tooltip title="Descargar PDF">
        <Button
          size="large"
          icon={<DownloadOutlined />}
          onClick={() => {
            if (!data) return;
            generateARPDF({
              client: data.client ?? null,
              invoice: data.invoice ?? null,
              ar: data.ar ?? null,
              installments: data.installments ?? [],
              payments: data.installmentPayments ?? [],
            });
          }}
        />
      </Tooltip>
    </ActionButtonsContainer>
  );
};

export default ActionButtons;
