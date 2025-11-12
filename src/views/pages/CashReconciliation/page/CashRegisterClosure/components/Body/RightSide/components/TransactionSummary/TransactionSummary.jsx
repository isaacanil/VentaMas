import { Spin } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { selectCashCount } from '../../../../../../../../../../features/cashCount/cashCountManagementSlice'
import { useFormatNumber } from '../../../../../../../../../../hooks/useFormatNumber'
import { InputWithHorizontalLabel } from '../../../../../../../../../templates/system/Inputs/InputWithHorizontalLabel'
import { CashCountMetaData } from '../../CashCountMetaData'


export const TransactionSummary = ({invoices, loading}) => {
  const cashCount = useSelector(selectCashCount)
  const { totalCard, totalRegister, totalTransfer } = CashCountMetaData(cashCount, invoices)
 
  return (
  <Spin spinning={loading}>
    <Container>
      <InputWithHorizontalLabel
        label={'Total Tarjeta'}
        readOnly
        type='subtitle'
        value={useFormatNumber(totalCard)}
      />
      <InputWithHorizontalLabel
        label={'Total Transferencia'}
       readOnly
        type='subtitle'
        value={useFormatNumber(totalTransfer)}
      />
      <InputWithHorizontalLabel
        label={'Total en caja'}
        type='subtitle'
        readOnly
        value={useFormatNumber(totalRegister)}
      />
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