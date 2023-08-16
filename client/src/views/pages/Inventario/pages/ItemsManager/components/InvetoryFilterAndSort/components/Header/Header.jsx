import React from 'react'
import styled from 'styled-components'
import { Button } from '../../../../../../../../templates/system/Button/Button'
import { icons } from '../../../../../../../../../constants/icons/icons'
import { FormattedValue } from '../../../../../../../../templates/system/FormattedValue/FormattedValue'

export const Header = ({onClose}) => {
  return (
    <Container >
        <FormattedValue value={'Filtrar y Ordenar Productos'} type={'title'} size={'medium'}/>
        <Button title={icons.operationModes.close} onClick={onClose} />
    </Container>

  )
}
const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding:  0.4em;
`
const Title = styled.div``