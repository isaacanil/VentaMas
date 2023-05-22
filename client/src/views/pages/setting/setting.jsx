import React from 'react'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { Card } from './Components/Card'
import { getSettingData } from './SettingData'

import { Transition } from '../../templates/system/Transition'
export const Setting = () => {
  // Agrupar configuraciones por categoría
  const settingData = getSettingData();
  const groupedSettings = settingData.reduce((acc, item) => {
    if (acc[item.category]) {
      acc[item.category].push(item);
    } else {
      acc[item.category] = [item];
    }
    return acc;
  }, {});

  return (
    <Transition>
      <Container>
        <MenuApp />
        <Body>
          <Categories>
            {Object.keys(groupedSettings).map((category, index) => (
              <CategoryContainer key={index}>
                <h3>{category}</h3>
                <Cards>
                  {groupedSettings[category].map((item, index) => (
                    <Card data={item} key={index} />
                  ))}
                </Cards>
              </CategoryContainer>
            ))}
          </Categories>
        </Body>
      </Container>
    </Transition>
  );
};


const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: grid;
  gap: 0.5em;
  grid-template-rows: min-content 1fr;
`
const Body = styled.div`
  width: 100%;
border-radius: var(--border-radius);
background-color: #ffffff;
`
const Categories = styled.div`
  display: grid;
  gap: 1em;
  padding: 1em;

`
const CategoryContainer = styled.div`
  padding: 10px;
  margin: 0 auto;
  max-width: 1000px;
  background-color: var(--color2);
  border-radius: var(--border-radius);
`
const Cards = styled.div`
  padding: 10px 0 0 0;
  margin: 0 auto;
  
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
`


