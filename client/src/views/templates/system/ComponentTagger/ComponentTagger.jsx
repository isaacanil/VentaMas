import React from 'react'
import styled from 'styled-components'

export const ComponentTagger = ({children, text}) => {
  return (
    <Container>
        <Label>{text}</Label>
        {children}
    </Container>
  )
}
const Container = styled.div`
    position: relative;
    width: min-content;
    height: min-content;
`
const Label = styled.div`
    position: absolute;
    top: -1.3em;
    left: 4px;
    font-size: 0.8em;
    line-height: 1em;
`