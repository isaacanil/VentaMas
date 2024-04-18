import React from 'react'

import styled from 'styled-components'
import { InputWithHorizontalLabel } from '../../../../../../../../../templates/system/Inputs/InputWithHorizontalLabel'
import { useSelector } from 'react-redux'
import { selectCashCount } from '../../../../../../../../../../features/cashCount/cashCountManagementSlice'
import { CashReconciliation } from '../../../../../../../CashReconciliation'
import { CashCountMetaData } from '../../CashCountMetaData'
import { useFormatPrice } from '../../../../../../../../../../hooks/useFormatPrice'

export const CashBoxClosureDetails = ({invoices}) => {
  const cashCount = useSelector(selectCashCount)
  const {totalSystem, totalCharged, totalDiscrepancy} = CashCountMetaData(cashCount, invoices)

 
  return (
    <Container>
      <InputWithHorizontalLabel
        label={'Total Facturado'}
        disabled
        value={useFormatPrice(totalCharged)}
        />
      <InputWithHorizontalLabel
        label={'Total sistema'}
        disabled
        value={useFormatPrice(totalSystem)}
      />
      {
        totalDiscrepancy !== 0 && (
          <InputWithHorizontalLabel
            themeColor={totalDiscrepancy > 0 ? 'success' : 'danger'}
            label={totalDiscrepancy > 0 ? 'Sobrante' : 'Faltante'}
            value={useFormatPrice(totalDiscrepancy)}
          />
        )
      }

    </Container>
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