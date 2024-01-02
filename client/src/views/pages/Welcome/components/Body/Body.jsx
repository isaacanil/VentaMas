import React from 'react'
import styled from 'styled-components'
import welcomeData from '../../WelcomeData.json'
import Typography from '../../../../templates/system/Typografy/Typografy'
import { Logo } from '../../../../../assets/logo/Logo'
import { CardWelcome } from './CardWelcome/CardWelcome'


const Body = () => {
  return (
    <Container>
      <Description>
        <Section>
         <CardWelcome welcomeData={welcomeData}></CardWelcome>
        </Section>
        <Section>
        </Section>
      </Description>
    </Container>
  )
}

export default Body
const Container = styled.div`


`


const Description = styled.div`
  display: flex;
  flex-direction: column;

  height: auto;
  /* justify-content: center; */

  margin-bottom: 2em;

`
const Section = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
 
  justify-content: center;
  p {
    font-size: 1.15rem;
    text-align: justify;
  }
  

  margin-bottom: 1em;
  :last-child{
    margin-bottom: 0;
  }
  
`

const Group = styled.div`
  display: flex;
  align-items: start;
`