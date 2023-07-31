import React from 'react'
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components'

const Item = ({item}) => {
    const location = useLocation();
    console.log(location)
    const isActiveRoute = (path) => {
      return location.pathname === path;
    };
    return (
        <Container
            to={item?.route || null}
            active={isActiveRoute(item?.route)}
        >
            <span>
                {item?.icon}
            </span>
            {item?.title}
        </Container>
    )
}

export default Item
const Container = styled(NavLink)`
display: flex;
height: 2.4em;
background-color: white;
padding: 0 0.8em;
align-items: center;
border-radius: 0.5rem;
font-size: 14px;
color: #444444;
margin: 0 0.8em;
span{
  display: flex;
  align-items: center;
  width: 2.6em;
  font-size: 1.2em;

}
&.active {
    background-color: var(--color);
    color: white;
  }
`