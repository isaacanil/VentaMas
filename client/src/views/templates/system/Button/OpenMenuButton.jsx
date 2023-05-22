import React from 'react'
import styled from 'styled-components'

export const OpenMenuButton = ({ onClick, isOpenMenu, zIndex }) => {
  return (
    <Container onClick={onClick} zIndex={zIndex}>
      <MenuIcon isOpen={isOpenMenu}></MenuIcon>
    </Container>
  )
}
const Container = styled.div`
:root {
   --menu-items: rgb(241, 241, 241);
   //btnMenuItem
   --btnMenuItem-bg-color: var(--menu-items);
   --btnMenuItem-width: 1.6em;
   --btnMenuItem-height: 2px;

}
      justify-self: start;
  max-height: 2em;
  min-width: 2em;
  min-height: 2em;
  max-width: 2em;
  width: 2em;
  height: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: var(--border-radius);
  cursor: pointer;
  z-index: 10000000;
`
const MenuIcon = styled.div`
  position: relative;
  z-index: 10;
  width: 1.2em;
  height: 2px;
  background-color: var(--menu-items);
  transition: all 1s ease-in-out;

  &:after {
    content: '';
    position: absolute;
    z-index: 10;
    width: 1.2em;
    height: 2px;
    background-color: var(--menu-items);
    margin-top: 6px;
    transition: all 0.4s ease-in-out;
  }

  &::before {
    content: '';
    position: absolute;
    z-index: 10;
    width: 1.2em;
    height: 2px;
    background-color: var(--menu-items);
    margin-top: -6px;
    transition: all 0.4s ease-in-out;
  }
  ${props => {
    switch (props.isOpen) {
      case true:
        return `
        position: relative;
         width: 1.2em;
         height: 2px;
         background-color: transparent;
         transition: all 0.2s ease-in-out;
        &::after {
            content: '';
            position: absolute;
            width: 1.2em;
            height: 2px;
            background-color: var(--menu-items);
            margin-top: 0;
            transform: rotate(-45deg);
            transition: all 0.4s ease-in-out;


         }

         &::before {
            content: '';
            position: absolute;
            width: 1.2em;
            height: 2px;
            background-color: var(--menu-items);
            margin-top: 0;
            transform: rotate(45deg);
            transition: all 0.4s ease-in-out;
         }
        `
      default:
        break;
    }
  }}
  
`







