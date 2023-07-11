import React from 'react'
import styled from 'styled-components'
import WelcomeData from '../../WelcomeData.json'
import Typography from '../../../../templates/system/Typografy/Typografy'
import { Logo } from '../../../../../assets/logo/Logo'

const Body = () => {
  return (
    <Container>
      <Description>
        <Section>
          <Group>
            <Typography variant={"body1"}  >
              {WelcomeData.section.description}
            </Typography>
            <LogoContainer>
            <Logo size='xlarge' src={WelcomeData.logo} alt="" />

            </LogoContainer>
          </Group>
        </Section>
        <Section>
          <Typography>


          </Typography>
        </Section>
      </Description>
    </Container>
  )
}

export default Body
const Container = styled.div`
 padding: 1em 2em;

`
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  width: 600px;
  padding: 2em;
  background-image: radial-gradient(circle, #0a53b3 0%, #ffffff 50%,  white 100%);
  
 `

const Description = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  /* justify-content: center; */
  width: 90%;
  background-color: var(--White);
 
  color: #fff;
  padding: 1em 2em;
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
  
  color: #fff;
  margin-bottom: 1em;
  :last-child{
    margin-bottom: 0;
  }
  
`

const Group = styled.div`
  display: flex;
  align-items: start;
`