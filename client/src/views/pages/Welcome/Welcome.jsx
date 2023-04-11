import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { Button, ButtonGroup } from '../..'
import { selectUser } from '../../../features/auth/userSlice'
import styled from 'styled-components'
import logo from './ventamax.svg'
import WelcomeData from './WelcomeData.json'
export const Welcome = () => {
  const user = useSelector(selectUser)
  const Navigate = useNavigate()

  useEffect(() => {
    if (user) {
      Navigate('/app/')
    }
  }, [user])

  return (
    <Container>
      <Head>
        <Group>
        <h2>
          <span>
            {WelcomeData.webName}
          </span>
        </h2>
        </Group>
        <Group>
        <ButtonGroup>
          <Button
            borderRadius='normal'
            title='Login'
            onClick={() => {
              Navigate('/login')
            }
            }
          />
          <Button
            borderRadius='normal'
            title='Register'
            onClick={() => {
              Navigate('/app/sign-up')
            }
            }
          />
        </ButtonGroup>
        </Group>
      </Head>
      <Body>
        <Section>
          <p>{WelcomeData.section.description}</p>
        </Section>
        <Section>
          <p>{WelcomeData.section1.description}</p>
        </Section>
       
      </Body>

    </Container>
  )
}
const Container = styled.div`

  height: 100vh;
  width: 100%;
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  justify-items: center;
  margin: 0;
  background-color: #000000;
  color: #fff;
  overflow: hidden;
 
  a {
    color: #fff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`
const Head = styled.div`
  display: flex;
  align-items: center;
  height: 2.2em;
  width: 100%;
  gap: 1em;
  font-size: 25px;
  padding: 0 1em;
  margin-bottom: 2em;
  justify-content: space-between;
  h2 {
    font-size: calc(0.9em + 1vw);
    font-weight: 700;
    margin: 0;
    color: var(--color)
  }
  img{
    height: 70px;
    width: 70px;
  }
`
const Section = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  p {
    font-size: 1.15rem;
    margin-bottom: 1rem;
    text-align: justify;
  }
  width: 90%;
  margin-bottom: 2em;

  color: #fff;
  
`
const Body = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  /* justify-content: center; */
  width: 90%;
  background-color: var(--Gray10);
  color: #fff;
  padding: 1em;
  border-radius: var(--border-radius);

`
const Group = styled.div`
  display: flex;
`