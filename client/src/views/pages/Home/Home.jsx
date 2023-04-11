import React, {Fragment} from 'react'
import { Link, useMatch } from 'react-router-dom'
import Style from './Home.module.scss'
import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { cardData } from './cardData'
import { ChatBox } from '../../component/ChatBox/ChatBox'

export const Home = () => {
  const user = useSelector(selectUser)
  const match = useMatch('/app/')
  match ? console.log('match') : console.log('no match')
  
  return (
    <Fragment>
      <div className={Style.App_container}>
        <MenuWebsite></MenuWebsite>
        <div className={Style.welcomeSection_container}>
          <div className={Style.welcomeSection_inner}>
            {/* <ChatBox/> */}
            {user === null ? null : <h2 className={Style.welcomeSection_title}>¡Bienvenido de nuevo <span>{user.displayName}</span>!</h2>}
            <ul className={Style.WelcomeSection_items}>
              {cardData.map(card => (
                <li className={Style.card} key={card.id}>
                  <Link className={Style.card_inner} to={card.path}>
                    <div className={Style.card_img_container}>
                      <img className={Style.card_img} src={card.img} alt={card.title} />
                    </div>
                    <h3 className={Style.card_title}>{card.title}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
