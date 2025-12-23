import { CheckCircleOutlined } from '@ant-design/icons';
import { Spin, Tag } from 'antd';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCashCount } from '@/features/cashCount/cashCountManagementSlice';
import { formatNumber } from '@/utils/format';
import { FormattedValue } from '@/views/templates/system/FormattedValue/FormattedValue';
import { InputWithHorizontalLabel } from '@/views/templates/system/Inputs/InputWithHorizontalLabel';


export const CashBoxClosureDetails = ({ loading }) => {
  const cashCount = useSelector(selectCashCount);
  const totalSystem = cashCount?.totalSystem ?? 0;
  const totalCharged = cashCount?.totalCharged ?? 0;
  const totalDiscrepancy = cashCount?.totalDiscrepancy ?? 0;
  const totalExpenses = cashCount?.totalExpenses ?? 0;
  const totalReceivables = cashCount?.totalReceivables ?? 0;

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
        {totalDiscrepancy !== 0 ? (
          <InputWithHorizontalLabel
            themeColor={totalDiscrepancy > 0 ? 'success' : 'danger'}
            readOnly
            label={totalDiscrepancy > 0 ? 'Sobrante' : 'Faltante'}
            value={formatNumber(totalDiscrepancy)}
          />
        ) : (
          <BalancedContainer>
            <FormattedValue
              size={'small'}
              type={'title'}
              value={'Estado'}
            />
            <Tag icon={<CheckCircleOutlined />} color="success">
              Cuadre Correcto
            </Tag>
          </BalancedContainer>
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

const BalancedContainer = styled.div`
  display: grid;
  align-items: center;
  align-content: center;
  padding: 0 0.4em;
  gap: 1em;
  grid-template-columns: 10em 1fr;
`;
