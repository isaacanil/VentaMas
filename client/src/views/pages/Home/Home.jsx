import React, { Fragment } from 'react'
import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { getDeveloperFeaturesData, getMenuCardData } from './CardData'
import styled from 'styled-components'
import { FeatureCardList } from './components/FeatureCardList/FeatureCardList'
import PersonalizedGreeting from './components/PersonalizedGreeting/PersonalizedGreeting'
import Footer from './Footer/Footer'
import { userAccess } from '../../../hooks/abilities/useAbilities'
import { selectBusinessData } from '../../../features/auth/businessSlice'

export const Home = () => {
  const user = useSelector(selectUser)
  const business = useSelector(selectBusinessData)
  const cardData = getMenuCardData()
  const developer = getDeveloperFeaturesData(user)
  const { abilities } = userAccess();

  return (
    <Container>
      <MenuWebsite />
      <WelcomeSection>
        <WelcomeSectionInner>
          {user && <PersonalizedGreeting name={user.displayName} business={business?.name} />}
          {
            abilities?.can('developerAccess', 'all') && (
              <FeatureCardList title={"Funciones de desarrollador"} cardData={developer} />
            )
          }
          <FeatureCardList
            title={"Atajos"}
            cardData={cardData}
          />
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
  overflow-y: auto;

`
const WelcomeSectionInner = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  margin: 0 auto;
  gap: 3em;
  max-width: 1200px;
  width: 100%;  
  padding: 2em 1em;
  border-radius: var(--border-radius1);
`
