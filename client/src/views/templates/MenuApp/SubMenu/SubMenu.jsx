import React from 'react'
import styled from 'styled-components'
import { Button } from '../../system/Button/Button'
import { IoIosArrowBack } from 'react-icons/io'
import { MenuLink } from '../MenuLink'

export const SubMenu = ({ isOpen, item, MenuItemsLink, showSubMenu }) => {

    const submenuItems = item.submenu || [];

    const groupedSubmenus = submenuItems.reduce((acc, submenu) => {
        (acc[submenu.group] = acc[submenu.group] || []).push(submenu);
        return acc;
    }, {});
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
            <Body>

            {
                 isOpen ? (
                    Object.keys(groupedSubmenus).map(group => (
                        <Group key={group}>
                            {/* <GroupTitle>{group}</GroupTitle>  */}
                            {groupedSubmenus[group].map((submenu, index) => (
                                <MenuLink item={submenu} key={index}></MenuLink>
                            ))}
                        </Group>
                    ))
                ) : null
            }
            </Body>
        </Container>
    )
}
const GroupTitle = styled.h3`
    /* Estilos para el título del grupo */
`;
const Group = styled.div`
    background-color: white;
    border-radius: var(--border-radius);
    overflow: hidden;
`
const Body = styled.div`
    /* position: relative; */
    background-color: var(--color2);
    padding: 0.8em;
    display: grid;
    align-content: start;
    gap: 0.6em;
`

const Container = styled.div`
    
    background-color: rgb(255, 255, 255);
    width: 100%;

    display: grid;
    grid-template-rows: min-content 1fr;
  
    position: absolute;
    z-index: 1;
    top: 2.75em;
    left: 0;
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
      padding: 0 1.5em;
      height: 3.8em;   
      margin: 0;
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
