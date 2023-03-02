import React, { useEffect, useState } from 'react'
import { MdMessage } from 'react-icons/md'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { toggleViewOrdersNotes } from '../../../../features/modals/modalSlice'
import { Button } from '../Button/Button'
export const MessageAlert = ({isOpen , data}) => {
  const dispatch = useDispatch()

  const closeModal = ()=>{
    dispatch(
      toggleViewOrdersNotes({isOpen: 'close'})
    )
  }
  return (
    <Backdrop isOpen={isOpen === true && data !== null ? true : false}>
      <Container isOpen={isOpen === true ? true : false}>
        <Body>
          <IconContainer>
            <MdMessage/>
          </IconContainer>
          <MessageContainer>
            <Message>
              {data !== "" && data !== null ? (data.note ? data.note : 'vacio') : null}
            </Message>  
          </MessageContainer>
        </Body>
        <Footer>
          <Button borderRadius={'normal'} title='ok' onClick={closeModal}></Button>
        </Footer>

      </Container>

    </Backdrop>
  )
}
const Backdrop = styled.div`
  height: 100%;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 2;
  ${(props) => {
    switch (props.isOpen) {
      case false:
        return`
          transform: scale(0);
          display: none;
        `
    
      default:
        break;
    }
  }}

`
const Container = styled.div`
  //box
  background-color: #ffffff;

  //height
  height: min-content;
  max-width: 600px;
  width: 100%;

  //border

  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--box-shadow);

  //font
  color: #141414;

  display: grid;
  grid-template-rows: 1fr min-content;
  gap: 1em;
  grid-template-columns: 1fr;
  position: relative;
  align-items: center;
  padding: 0.5em 0;

  

  ${(props) => {
    switch (props.isOpen) {
      case false:
        return`
          transform: scale(0);
        `
        break;
    
      default:
        break;
    }
  }}
  
  
`
const Body = styled.div`
  height: 100%;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
  padding: 1em 2em 1em 0;
  display: grid;
  grid-template-columns: 0.4fr 1fr;
  grid-template-rows: 1fr;

  @media (max-width: 1000px){
    border-radius: 0;
    height: min-content;
    grid-template-columns: 1fr;
    align-items: flex-start;
    align-content: flex-start;
    justify-content: center;
    grid-template-rows: auto;
  }
  
`
const Footer = styled.div`
  padding: 0 1em;
  display: flex;
  justify-content: flex-end;
`
const IconContainer = styled.div`
  width: 100%;
  height: min-content;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 70px;
  color: var(--font-color-dark-slightly);
`
const MessageContainer = styled.div`
height: min-content;
width: 100%;
overflow: hidden;
overflow-wrap: break-word;
padding: 1em 2em;
  
    
  
`
const Message = styled.p`
  width: 100%;
  
`