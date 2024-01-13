import React, { Fragment } from 'react'
import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { getCardData } from './CardData'
import { ChatBox } from '../../component/ChatBox/ChatBox'
import styled from 'styled-components'
import { FeatureCardList } from './components/FeatureCardList/FeatureCardList'
import PersonalizedGreeting from './components/PersonalizedGreeting/PersonalizedGreeting'
import Footer from './Footer/Footer'

export const Home = () => {
  const user = useSelector(selectUser)
  const cardData = getCardData(user)
  return (
    <Container>
      <MenuWebsite />
      <WelcomeSection>
        <WelcomeSectionInner>
        
          {user && <PersonalizedGreeting name={user.displayName} />}
          <FeatureCardList cardData={cardData} />
        </WelcomeSectionInner>
      </WelcomeSection>
      <Footer />
    </Container>
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
  justify-content: center;

`
const WelcomeSectionInner = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  gap: 1em;
  max-width: 1200px;
  width: 100vw;  
  padding: 2em 1em;
  border-radius: var(--border-radius1);
`
