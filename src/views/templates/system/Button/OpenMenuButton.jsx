import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { toggleOpenMenu } from '../../../../features/nav/navSlice'

export const OpenMenuButton = ({ onClick, zIndex, isOpen }) => {
  const dispatch = useDispatch()
  const toggleMenu = () => dispatch(toggleOpenMenu());

  return (
    <Container
      isOpen={isOpen}
      onClick={onClick || toggleMenu} zIndex={zIndex}>
      <MenuIcon isOpen={isOpen}></MenuIcon>
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
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2em;
  height: 2em;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: var(--border-radius);
  cursor: pointer;

  z-index: ${props => props.isOpen ? 10000 : 0};
  transition-delay: ${props => !props.isOpen && '1s'};

  @media (max-width: 768px) {
    width: 2.3em;
    height: 2.3em;
  }

`
const MenuIcon = styled.div`
  position: relative;
  z-index: 10;
  width: 1.2em;
  height: 2px;
  background-color: var(--menu-items);
  transition: all 1s ease-in-out;
  
  // Iconos más grandes en móviles
  @media (max-width: 768px) {
    width: 1.4em;
    height: 2.5px;
  }

  &:after {
    content: '';
    position: absolute;
    z-index: 10;
    width: 1.2em;
    height: 2px;
    background-color: var(--menu-items);
    margin-top: 6px;
    transition: all 0.4s ease-in-out;
    
    @media (max-width: 768px) {
      width: 1.4em;
      height: 2.5px;
      margin-top: 7px;
    }
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
    
    @media (max-width: 768px) {
      width: 1.4em;
      height: 2.5px;
      margin-top: -7px;
    }
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
         
         @media (max-width: 768px) {
           width: 1.4em;
           height: 2.5px;
         }
         
        &::after {
            content: '';
            position: absolute;
            width: 1.2em;
            height: 2px;
            background-color: var(--menu-items);
            margin-top: 0;
            transform: rotate(-45deg);
            transition: all 0.4s ease-in-out;

            @media (max-width: 768px) {
              width: 1.4em;
              height: 2.5px;
            }
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
            
            @media (max-width: 768px) {
              width: 1.4em;
              height: 2.5px;
            }
         }
        `
      default:
        break;
    }
  }}
  
  
`








