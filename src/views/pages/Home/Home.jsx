import styled from 'styled-components'

import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'

import { DashboardShortcuts } from './components/DashboardShortcuts/DashboardShortcuts'
import PersonalizedGreeting from './components/PersonalizedGreeting/PersonalizedGreeting'
import Footer from './Footer/Footer'

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
  height: 100%;
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
  gap: 1em;
  max-width: 1200px;
  width: 100%;  
  padding: 1em 1em;
  border-radius: var(--border-radius1);
`
