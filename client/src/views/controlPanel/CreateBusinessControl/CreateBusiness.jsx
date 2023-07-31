import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { fbGetBusinesses } from '../../../firebase/dev/businesses/fbGetBusinesses'

export const CreateBusiness = () => {
  const [businesses, setBusinesses] = useState([])
  useEffect(() => {
    fbGetBusinesses(setBusinesses)
  }, [])
  return (
    <Container>
      <Head>
        <h1>Create Business</h1>
      </Head>
      <Body>

        {businesses.map(({ business }) => <div>{business.name}</div>)}
      </Body>
    </Container>
  )
}
const Container = styled.div``
const Head = styled.div``
const Body = styled.div``