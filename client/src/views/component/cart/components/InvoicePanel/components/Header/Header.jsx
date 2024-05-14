import React from 'react'
import Typography from '../../../../../../templates/system/Typografy/Typografy'
import styled from 'styled-components'
import { icons } from '../../../../../../../constants/icons/icons'
import { Button } from '../../../../../../templates/system/Button/Button'

export const Header = () => {
  return (
    <Container>
        <Typography
            variant='h3'
            disableMargins
        >
            Pago de Factura
        </Typography>
        <Button
            startIcon={icons.operationModes.close}
        >
    
        </Button>
    </Container>
  )
}
const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4em 0.8em;

`