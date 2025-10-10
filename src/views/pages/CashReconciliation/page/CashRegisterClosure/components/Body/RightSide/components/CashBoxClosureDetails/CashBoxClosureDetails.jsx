import { Spin } from 'antd'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { selectCashCount } from '../../../../../../../../../../features/cashCount/cashCountManagementSlice'
import { useFormatNumber } from '../../../../../../../../../../hooks/useFormatNumber'
import { InputWithHorizontalLabel } from '../../../../../../../../../templates/system/Inputs/InputWithHorizontalLabel'
import { CashCountMetaData } from '../../CashCountMetaData'

export const CashBoxClosureDetails = ({ invoices, loading, expenses = [], expensesLoading = false }) => {
  const cashCount = useSelector(selectCashCount)
  const { totalSystem, totalCharged, totalDiscrepancy, totalExpenses } = CashCountMetaData(cashCount, invoices, expenses)
  
  return (
    <Spin spinning={loading}>
      <Container>
        <InputWithHorizontalLabel
          label={'Total Facturado'}
          readOnly
          value={useFormatNumber(totalCharged)}
        />
        {totalExpenses > 0 && (
          <InputWithHorizontalLabel
            label={'Total Gastos'}
            readOnly
            themeColor="warning"
            value={useFormatNumber(totalExpenses)}
          />
        )}
        <InputWithHorizontalLabel
          label={'Total sistema'}
          readOnly
          value={useFormatNumber(totalSystem)}
        />
        {
          totalDiscrepancy !== 0 && (
            <InputWithHorizontalLabel
              themeColor={totalDiscrepancy > 0 ? 'success' : 'danger'}
              readOnly
              label={totalDiscrepancy > 0 ? 'Sobrante' : 'Faltante'}
              value={useFormatNumber(totalDiscrepancy)}
            />
          )
        }
      </Container>
    </Spin>
  )
}
const Container = styled.div`
    display: grid;
    gap: 0.4em;
    padding: 0.4em;
    border-radius: var(--border-radius);
    border: var(--border1);
    background-color: white;
`