import { Spin } from 'antd';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCashCount } from '../../../../../../../../../../features/cashCount/cashCountManagementSlice';
import { InputWithHorizontalLabel } from '../../../../../../../../../templates/system/Inputs/InputWithHorizontalLabel';
import { CashCountMetaData } from '../../CashCountMetaData';

import { formatNumber } from '@/utils/format';

export const CashBoxClosureDetails = ({ invoices, loading, expenses = [] }) => {
  const cashCount = useSelector(selectCashCount);
  const {
    totalSystem,
    totalCharged,
    totalDiscrepancy,
    totalExpenses,
    totalReceivables,
  } = CashCountMetaData(cashCount, invoices, expenses);

  return (
    <Spin spinning={loading}>
      <Container>
        <InputWithHorizontalLabel
          label={'Total Facturado'}
          readOnly
          value={formatNumber(totalCharged)}
        />
        {totalReceivables > 0 && (
          <InputWithHorizontalLabel
            label={'Total Cobrado CxC'}
            readOnly
            value={formatNumber(totalReceivables)}
          />
        )}
        {totalExpenses > 0 && (
          <InputWithHorizontalLabel
            label={'Total Gastos'}
            readOnly
            themeColor="warning"
            value={formatNumber(totalExpenses)}
          />
        )}
        <InputWithHorizontalLabel
          label={'Total sistema'}
          readOnly
          value={formatNumber(totalSystem)}
        />
        {totalDiscrepancy !== 0 && (
          <InputWithHorizontalLabel
            themeColor={totalDiscrepancy > 0 ? 'success' : 'danger'}
            readOnly
            label={totalDiscrepancy > 0 ? 'Sobrante' : 'Faltante'}
            value={formatNumber(totalDiscrepancy)}
          />
        )}
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
