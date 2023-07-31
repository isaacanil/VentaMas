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
      <MenuApp  />
      <Head>
        <h1>Gestionar Negocio</h1>
      </Head>
      <Body>
        {businesses.map(({ business }) => <BusinessCard business={business} />)}
      </Body>
    </Container>
  )
}
const Container = styled.div``
const Head = styled.div``
const Body = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`