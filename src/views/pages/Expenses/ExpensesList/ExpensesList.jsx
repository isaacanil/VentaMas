import { useState } from 'react'
import styled from 'styled-components'
import { ExpensesTable } from './components/ExpenseTable/ExpensesTable'
import { useFbGetExpenses } from '../../../../firebase/expenses/Items/useFbGetExpenses'
import ExpensesForm from '../../Expenses/ExpensesForm/ExpensesForm'
import { MenuApp } from '../../../templates/MenuApp/MenuApp'

export const ExpensesList = () => {
  return (
    <Container>
      <MenuApp
        sectionName={'Gastos'}
      />
      <ExpensesTable />
      <ExpensesForm />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  height: 100%;
`