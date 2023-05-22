import React from 'react'
import styled from 'styled-components'
import WelcomeData from '../../WelcomeData.json'
import Typography from '../../../../templates/system/Typografy/Typografy'

const Body = () => {
  return (
    <Container>
      <Description>
        <Section>
          <Typography variant={"body1"}  >
            {WelcomeData.section.description}
          </Typography>
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
 background: linear-gradient(to bottom, #000000 , #ffffff );

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
  border-radius: var(--border-radius);
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
