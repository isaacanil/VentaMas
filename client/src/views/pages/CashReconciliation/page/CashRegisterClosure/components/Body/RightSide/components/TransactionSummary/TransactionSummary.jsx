import React from 'react'
import styled from 'styled-components'
import { InputWithHorizontalLabel } from '../../../../../../../../../templates/system/Inputs/InputWithHorizontalLabel'
import { useSelector } from 'react-redux'
import { selectCashCount } from '../../../../../../../../../../features/cashCount/cashCountSlide'
import { CashCountMetaData } from '../../CashCountMetaData'
import { useFormatPrice } from '../../../../../../../../../../hooks/useFormatPrice'

export const TransactionSummary = () => {
  const cashCount = useSelector(selectCashCount)
  const { totalCard, totalRegister, totalTransfer } = CashCountMetaData(cashCount)
  
 
  return (
    <Container>
      <InputWithHorizontalLabel
        label={'Total Tarjeta'}
        disabled
        type='subtitle'
        value={useFormatPrice(totalCard)}
      />
      <InputWithHorizontalLabel
        label={'Total Transf..'}
        disabled
        type='subtitle'
        value={useFormatPrice(totalTransfer)}
      />
      <InputWithHorizontalLabel
        label={'Total en caja'}
        disabled
        type='subtitle'
        value={useFormatPrice(totalRegister)}
      />
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