import React from 'react'
import styled from 'styled-components'
import { Header } from './components/Header'
import { Body } from './components/Body/Body'

export const ConfigModal = ({config}) => {
  return (
    <Backdrop>
      <Container>
        <Header 
        config = {config}
        />
        <Body 
        config = {config}
        />
      </Container>
    </Backdrop>
  )
}
const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  height: 100%;
  max-height: 520px;
  background-color: white;
  border-radius: var(--border-radius);
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
`
const Backdrop = styled.div`
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,.5);
    z-index: 100;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
`

