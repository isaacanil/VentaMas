import { Spin } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { formatNumber } from '@/utils/format';

import { selectCashCount } from '@/features/cashCount/cashCountManagementSlice';
import { InputWithHorizontalLabel } from '@/views/templates/system/Inputs/InputWithHorizontalLabel';


export const TransactionSummary = ({ loading }) => {
  const cashCount = useSelector(selectCashCount);
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
