import React, { Fragment } from 'react'
import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'
import styled from 'styled-components'
import PersonalizedGreeting from './components/PersonalizedGreeting/PersonalizedGreeting'
import Footer from './Footer/Footer'
import { DashboardShortcuts } from './components/DashboardShortcuts/DashboardShortcuts'
import { Helmet } from 'react-helmet-async'

export const Home = () => {
  return (
    <>
      <Container>
        <MenuWebsite />
        <WelcomeSection>
          <WelcomeSectionInner>
            <PersonalizedGreeting />
            <DashboardShortcuts />
          </WelcomeSectionInner>
        </WelcomeSection>
        <Footer />
      </Container>
    </>
  )
}

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  background-color: var(--color2);
`

const WelcomeSection = styled.div`
  display: grid;
  width: 100%;
  overflow-y: auto;

`
const WelcomeSectionInner = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  margin: 0 auto;
  gap: 2em;
  max-width: 1200px;
  width: 100%;  
  padding: 1em 1em;
  border-radius: var(--border-radius1);
`
