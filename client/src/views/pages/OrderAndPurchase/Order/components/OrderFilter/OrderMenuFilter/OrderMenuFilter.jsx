import React, { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { Item } from './Item'

export const OrderMenuFilter = ({ MenuIsOpen }) => {
 
 
  return (
    // <Container isOpen={MenuIsOpen ? true : false} >
    //   <Wrapper>
    //     <Head>
    //       <h3>Filtros</h3>
    //     </Head>
    //     <Body>
    //       {
    //         OrderFilterOptionsSelected.length > 0 ? (
    //           OrderFilterOptionsSelected.map((item, index) => (
    //             <Item data={item} index={index} key={index} />
    //           ))
    //         ) : null
    //       }
    //     </Body>
    //   </Wrapper>
<div></div>
    // </Container>
  )
}

const Container = styled.div`
  overflow: hidden;
  
  height: calc(100vh - 9em);
  max-width: 500px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.150);
  
  top: 5.2em;
  position: absolute;
  z-index: 1;
  background-color: #ffffff;
  transform: scale(1);
  transition: transform 400ms ease-in-out;
  box-shadow: 10px 10px 10px 2px rgba(0, 0, 0, 0.150);
  @media (max-width: 600px){
    left: 0;
    max-width: none;
    border-radius: 0;
    width: 100%;
    max-height: none;
    height: calc(100vh - 5.3em);
    margin: 0;
    border: 0;
  }
  ${props => {
    switch (props.isOpen) {
      case true:
        return `
        transform: scaleX(1) translateX(0px) translateY(0px);
        `

      case false:
        return `   
        transform: scale(0) translateX(-400px) translateY(-100px);
        `

      default:
        break;
    }
  }}
`
const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: scroll;
`
const Head = styled.div`
  background-color: var(--White);

  h3{
    margin: 0;
    padding: 0.4em 1em;
  }
`
const Body = styled.div`

`