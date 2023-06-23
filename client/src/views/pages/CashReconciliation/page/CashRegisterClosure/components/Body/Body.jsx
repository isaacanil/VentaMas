import React, { useState } from 'react'
import { LeftSide } from './LeftSide/LeftSide'
import { RightSide } from './RightSide/RightSide'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { selectCashCount } from '../../../../../../../features/cashCount/cashCountSlide'
import { ConfirmCancelButtons } from '../../../../global/ConfirmCancelButtons/ConfirmCancelButtons'
import { DateTime } from 'luxon'

export const Body = ({closingDate}) => {
  const [calculationIsOpen, setCalculationIsOpen] = useState(true)
 
  return (
    <Container>
      <Group>
        <LeftSide
          calculationIsOpen={calculationIsOpen}
          setCalculationIsOpen={setCalculationIsOpen} />
        <RightSide
          calculationIsOpen={calculationIsOpen}
          setCalculationIsOpen={setCalculationIsOpen} 
          date={closingDate}
          />
      </Group>
     
    </Container>
  )
}
const Container = styled.div`

   
    display: grid;
    gap: 0.4em;
    
    `
const Group = styled.div`
 display: grid;
 gap: 3em;
 justify-content: space-between;
grid-template-columns: repeat(2, 1fr);
  
`