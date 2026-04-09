import { Spin } from 'antd';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCashCount } from '@/features/cashCount/cashCountManagementSlice';
import type { CashCountRecord } from '@/utils/cashCount/types';
import { formatNumber } from '@/utils/format';
import { InputWithHorizontalLabel } from '@/components/ui/Inputs/InputWithHorizontalLabel';

interface TransactionSummaryProps {
  loading?: boolean;
}

export const TransactionSummary = ({
  loading = false,
}: TransactionSummaryProps) => {
  const cashCount = useSelector(selectCashCount) as CashCountRecord | null;
  const totalCard = cashCount?.totalCard ?? 0;
  const totalTransfer = cashCount?.totalTransfer ?? 0;
  const totalRegister = cashCount?.totalRegister ?? 0;

  return (
    <Spin spinning={loading}>
      <Container>
        <InputWithHorizontalLabel
          label={'Total Tarjeta'}
          readOnly
          type="subtitle"
          value={formatNumber(totalCard)}
        />
        <InputWithHorizontalLabel
          label={'Total Transferencia'}
          readOnly
          type="subtitle"
          value={formatNumber(totalTransfer)}
        />
        <InputWithHorizontalLabel
          label={'Total en caja'}
          type="subtitle"
          readOnly
          value={formatNumber(totalRegister)}
        />
      </Container>
    </Spin>
  );
};

const Container = styled.div`
  display: grid;
  gap: 0.4em;
  padding: 0.4em;
  background-color: white;
  border: var(--border1);
  border-radius: var(--border-radius);
`;
