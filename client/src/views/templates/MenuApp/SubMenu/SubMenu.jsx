import React from 'react'
import styled from 'styled-components'
import { Button } from '../../system/Button/Button'
import { IoIosArrowBack } from 'react-icons/io'
import { MenuLink } from '../MenuLink'

export const SubMenu = ({ isOpen, item, Items, showSubMenu }) => {
    return (
        <Container isOpen={isOpen}>        
            <Header>
                <Button
                    startIcon={<IoIosArrowBack />}
                    title='atrás'
                    variant='contained'
                    onClick={showSubMenu}
                />
                <span>{item.title}</span>
            </Header>
            {
                isOpen ? (item.submenu.map((submenu, index) => (
                    <MenuLink item={submenu} key={index}></MenuLink>

                ))) : null
            }
        </Container>
    )
}

const Container = styled.div`
      padding: 1em 0;
   background-color: rgb(255, 255, 255);
   display: grid;
   align-items: start;
   align-content: start;
   gap: 0.6em;
    position: absolute;
   z-index: 1;
   top: 2.75em;
   left: 0;
   width: 100%;
   max-width: 500px;
   height: calc(100% - 2.75em);
    transform: translateX(-100%);
   transition: 200ms transform ease-in-out;
   color: rgb(80, 80, 80);
   ${props => {
        switch (props.isOpen) {
            case true:
                return `
                transform: translateX(0px);
                z-index: 9999;
                `
            default:
                break;
        }
    }}
`
const Header = styled.div`
 display: grid;
      grid-template-columns: 1fr 1fr;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5em 0 1em;
      margin: 0 0 1em;
      
      span {
         font-size: 16px;
         line-height: 18px;
         font-weight: 500;
         text-align: center;
         text-align: end;
      }

      button {
         color: rgb(66, 165, 245);
         justify-self: flex-start;
      }
`
const EmptyBox = styled.div`
height: 2.75em;
width:4em;
background-color: var(--color);
`