import React from 'react'
import styled from 'styled-components'
import { Body } from './Body'
import { Header } from './Header'

export const HomeScreenContent = () => {
  return (
    <Container>
      <Header />
      <Body />
      {/* <Footer /> */}
    </Container>
  )
}
const Container = styled.div`
display: flex;
background-color: #0084ff;
width: 100%;
`