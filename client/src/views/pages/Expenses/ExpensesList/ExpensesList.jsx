import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../..'
import { ExpensesTable } from './components/ExpenseTable/ExpensesTable'
import { useFbGetExpenses } from '../../../../firebase/expenses/Items/useFbGetExpenses'
import { useDispatch } from 'react-redux'
import { setExpenseList } from '../../../../features/expense/expensesListSlice'
import { getDateRange } from '../../../../utils/date/getDateRange'

export const ExpensesList = () => {
  const [datesSelected, setDatesSelected] = useState(getDateRange('thisMonth'));
  const [searchTerm, setSearchTerm] = useState('');
  const { expenses } = useFbGetExpenses(datesSelected);

  return (
    <Container>
      <MenuApp
        sectionName={'Gastos'}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <ExpensesTable
        searchTerm={searchTerm}
        expenses={expenses}
      />
    </Container>
  )
}
const Container = styled.div`
    
`