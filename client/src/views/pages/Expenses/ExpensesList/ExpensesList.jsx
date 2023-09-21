import React, { useState } from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../..'
import { ExpensesTable } from './components/ExpenseTable/ExpensesTable'

export const ExpensesList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  return (
    <Container>
      <MenuApp
        sectionName={'Gastos'}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <ExpensesTable searchTerm={searchTerm} />
    </Container>
  )
}
const Container = styled.div`
    
`