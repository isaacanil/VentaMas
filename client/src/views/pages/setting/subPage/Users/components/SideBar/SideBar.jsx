import React from 'react'
import styled from 'styled-components'
import { getMenuData } from './MenuData'
import { NavLink } from 'react-router-dom'
import { icons } from '../../../../../../../constants/icons/icons'
import Item from './components/Item'
const SideBar = () => {
  const menuData = getMenuData()
  return (
    <Container>
      <Items>
        {menuData.map((item, index) => (
          <Item item={item} key={index} />
        ))}
      </Items>
    </Container>
  )
}

export default SideBar
const Container = styled.div`
width: 300px;
max-width: 300px;

height: calc(100vh - 2.75em);

`
// const Item = styled(NavLink)`
// display: flex;
// height: 2.4em;
// background-color: white;
// padding: 0 0.8em;
// align-items: center;
// border-radius: 0.5rem;
// font-size: 14px;
// color: #444444;
// margin: 0 0.8em;
// span{
//   display: flex;
//   align-items: center;
//   width: 2.6em;
//   font-size: 1.2em;

// }
// `
const Section = styled.div`
  width: 100%;
  background-color: blue;
`
const Items = styled.ul`
 padding: 0;
  padding-top: 2em;
  display: grid;
  gap: 0.6em;


`
