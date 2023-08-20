import React, { useState } from 'react'
import { BsFilter } from 'react-icons/bs'
import styled from 'styled-components'
import { Button } from '../../../../templates/system/Button/Button'
import { OrderMenuFilter } from './OrderMenuFilter/OrderMenuFilter'

export const OrderFilter = () => {
  const [MenuIsOpen, setMenuIsOpen] = useState(false)
  const handleOpenMenu = () => setMenuIsOpen(!MenuIsOpen)
  return (
    <Container>
      <Button
        borderRadius='normal'
        startIcon={<BsFilter />}
        title={`Filtros`}
        color='gray-dark'
        border='light'
        onClick={handleOpenMenu}
      />
      <OrderMenuFilter MenuIsOpen={MenuIsOpen}/>
    </Container>
  )
}
const Container = styled.div`
    
`
