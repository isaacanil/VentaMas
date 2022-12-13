import React from 'react'
import styled from "styled-components"
//import {styled} from '@stitches/react'
import logo from './ventamax.svg'



export const GenericLoader = () => {
  const ventamaxLogo = logo;

  return (
    <Wrapper>
      <img src={ventamaxLogo} alt="" />
    </Wrapper>
  )
}

const Wrapper = styled.div`
     @keyframes back {
      0% {
       
        clip-path: circle(2.9% at 50% 50%);
      }
      80% {clip-path: circle(100% at 50% 50%);}
      100%{clip-path: circle(100% at 50% 50%);}
    }
    background-color: #000000;
    
    width: 100%;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    animation-name: back;
    animation-duration: 2s;
  
    img{
      animation-name: example;
      animation-duration: 1.2s;
      transform: scale(2)
    }
    @keyframes example {
      0% {transform: scale(1);}
      80% {transform: scale(4);}
      100%{transform: scale(2)}
    }
   

    
`
