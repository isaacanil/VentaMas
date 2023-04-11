import React from 'react'
import { MdClose } from 'react-icons/md'
import styled from 'styled-components'
import { Button } from '../../../templates/system/Button/Button'

export const Header = () => {
  return (
  <Container>
    <Title>Detalle de la orden</Title>
    <Button title={<MdClose/>} />
  </Container>
  )
}

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    
   

    border-radius: 0.5em 0.5em 0 0;
`

const Title = styled.p`
    font-weight: 600;
    
`

const CloseButton = styled.button`
    background-color: transparent;
    border: none;
    color: white;
    font-size: 1.5em;
    cursor: pointer;
`