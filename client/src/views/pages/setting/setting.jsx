import React from 'react'
import { styled } from '@stitches/react'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import {Card} from './Components/Card'
import { settingData } from './SettingData'
export const Setting = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7]
  return (
    <Container>
      <MenuApp></MenuApp>
      <Body>
        <Cards>
          {
           settingData.length > 0 ? (
             settingData.map((item, index) => (
                <Card data={item}></Card>
              ))
            ) : null
          }
        </Cards>
      </Body>
    </Container>
  )
}

const Container = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'grid',
  gridTemplateRows: 'min-content 1fr'
})
const Body = styled('div', {
  width: '100%',
  height: 'calc(100vh - 2.75em)'
})



const Cards = styled('div', {
  padding: '10px 0 0 0',
  display: 'grid',
  margin: '0 auto',
  maxWidth: '1000px',
  width: '100%',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '1em'
})
