import React, { Fragment } from 'react'
import { Link, useMatch } from 'react-router-dom'
import Style from './Home.module.scss'
import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { getCardData } from './CardData'
import { ChatBox } from '../../component/ChatBox/ChatBox'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
import { FeatureCardList } from './components/FeatureCardList/FeatureCardList'
import PersonalizedGreeting from './components/PersonalizedGreeting/PersonalizedGreeting'

export const Home = () => {
  const user = useSelector(selectUser)
  const cardData = getCardData(user)
  return (
    <Fragment>
      <Container>
        <MenuWebsite></MenuWebsite>
        <div className={Style.welcomeSection_container}>
          <div className={Style.welcomeSection_inner}>
            {/* <ChatBox/> */}
            {user && <PersonalizedGreeting name={user.displayName} />}
            <FeatureCardList  cardData={cardData} />
          </div>
        </div>
      </Container>
    </Fragment>
  )
}

const Container = styled.div`
   min-height: 100vh;
  background-color: var(--color2);
`
const UserName = styled.span`
  color:var(--color1);
  font-weight: 600;
  
  div{
    ::first-letter {
      text-transform: capitalize;
    }
  }


`