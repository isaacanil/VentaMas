import React, { Fragment } from 'react'
import styled from 'styled-components'
import Style from './ErrorMassage.module.scss'
export const ErrorMessage = ({text}) => {
  return (
    <Fragment>
      <Container>
        <label htmlFor="">{text}</label>
      </Container>
    </Fragment>
  )
}
const Container = styled.div`
   width: 100%;
   display: flex;
   justify-content: center;
   padding: 0 1em;
   label{
    text-align: center;
    color: white;
    letter-spacing: 0.8pt;
    font-weight: 700;
    border-radius: 100px;
    max-width: 800px;
    width: 100%;
    min-width: 200px;
    padding: 0.4em 1em;
    background-color: rgb(227, 81, 81);

  }
`
