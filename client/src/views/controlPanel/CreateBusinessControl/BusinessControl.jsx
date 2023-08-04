import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { fbGetBusinesses } from '../../../firebase/dev/businesses/fbGetBusinesses'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { BusinessCard } from './components/BusinessCard/BusinessCard'

export const BusinessControl = () => {
  const [businesses, setBusinesses] = useState([])

  useEffect(() => {
    fbGetBusinesses(setBusinesses)
  }, [])

  return (
    <Container>
      <Head>
        <MenuApp />
        <h1>Gestionar Negocios</h1>
      </Head>
      <Body>
        {businesses.map(({ business }) => <BusinessCard business={business} />)}
      </Body>
    </Container>
  )
}
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100vh;
`
const Head = styled.div``
const Body = styled.div`
  display: grid;
  padding: 10px;
  gap: 10px;
  background-color: var(--color2);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  align-content: start;
`