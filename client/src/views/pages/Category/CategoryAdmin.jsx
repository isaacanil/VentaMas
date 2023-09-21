import React, { Fragment, useState } from 'react'
import styled from 'styled-components'
import {
  MenuApp,
  Button,
} from '../../'
import {  CategoriesTable } from './components/CategoriesTable/CategoriesTable'

export const CategoryAdmin = () => {
  const [searchTerm, setSearchTerm] = useState('')
  return (
    <Fragment>
      <MenuApp
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <Container>
        <CategoriesTable searchTerm={searchTerm} />
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