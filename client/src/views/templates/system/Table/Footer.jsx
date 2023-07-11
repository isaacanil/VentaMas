import React from 'react'
import styled from 'styled-components'

export const Footer = ({ children }) => {
  return (
    children && (
      <Container>
        {children}
      </Container>
    )
  )
}
const Container = styled.div`
    position: sticky;
    bottom: 0; 
    width: 100%;
    background-color: #910303;
`
