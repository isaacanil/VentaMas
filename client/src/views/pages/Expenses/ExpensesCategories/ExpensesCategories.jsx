import React, { Fragment, useState } from 'react'
import styled from 'styled-components'

import {  ExpensesCategoriesTable } from './components/ExpensesCategoriesTable/ExpensesCategoriesTable'
import { MenuApp } from '../../../templates/MenuApp/MenuApp'

export const ExpensesCategories = () => {
  const [searchTerm, setSearchTerm] = useState('')
  return (
    <Fragment>
      <MenuApp
      sectionName={'Cat. Gastos'}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
        <ExpensesCategoriesTable searchTerm={searchTerm} />
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
    width: 100vw;
    height: calc(100vh - 2.75em);
    background-color: var(--color2);
    display: grid;
    grid-template-rows: 1fr;
    overflow: hidden;
   
    
`