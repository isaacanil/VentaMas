import React from 'react'
import styled from 'styled-components'

export const Collection = () => {
    const handleClick = () => {
        console.log('click')
    }
  return (
    <Container>
        <button onClick={handleClick}>Click</button>
    </Container>
  )
}
const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
`
const Button = styled.button`
    padding: 1em;
    height: 2em;
`
