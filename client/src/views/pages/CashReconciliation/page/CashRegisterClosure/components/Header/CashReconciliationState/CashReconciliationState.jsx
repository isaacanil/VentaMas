import React from 'react'
import styled from 'styled-components'
import { FormattedValue } from '../../../../../../../templates/system/FormattedValue/FormattedValue'

export const CashReconciliationState = () => {
  return (
    <Container>
        <Label>Estado: </Label>
        <State>
          <FormattedValue type={'subtitle'} size={'small'} value={'En proceso de cierre'} />
        </State>
    </Container>
  )
}

const Container = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
    
`
const Label = styled.span`
  font-size: 13px;
 color: var(--Gray5);


  margin-bottom: 0px;
`
const State = styled.div`
    border-radius: var(--border-radius);
    padding: 0.2em 0.6em;
    background-color: #eee094;
`