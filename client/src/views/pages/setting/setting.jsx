import React from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import {Card} from './Components/Card'
import { settingData } from './SettingData'

import { Transition } from '../../templates/system/Transition'
export const Setting = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7]
  return (
    <Transition >
      <Container>
      <MenuApp></MenuApp>
      <Body>
        <Cards>
          {
           settingData.length > 0 ? (
             settingData.map((item, index) => (
                <Card data={item} key={index}></Card>
              ))
            ) : null
          }
        </Cards>
      </Body>
    </Container>
   </Transition>
  
  )
}

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-rows: min-content 1fr;
`
const Body = styled.div`
  width: 100%;
  height: calc(100vh - 2.75em);
`
const Cards = styled.div`
  padding: 10px 0 0 0;
  margin: 0 auto;
  max-width: 1000px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
`
  

