import React from 'react'
import styled from 'styled-components'

export const ButtonGroup = ({children}) => {
  return (
    <Container>
        {children}
    </Container>
  )
}

const Container = styled.div`
    display: flex;
    gap: 0.4em;
`