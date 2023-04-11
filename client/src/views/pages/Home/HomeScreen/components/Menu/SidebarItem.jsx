
import React from 'react'
import styled from 'styled-components';

export const SidebarItem = ({item}) => {
  return (
    <Container>   
      <Icon>
            {item.icon}
      </Icon>
      <Label>
            {item.label}
      </Label>
    </Container>
  )
}
const Container = styled.li`
  display: grid;
  gap: 0.2em;
  align-items: center;
  justify-content: center;

  width: 100%;
  color: ${({ isActive }) => (isActive ? '#fff' : '#333')};
  background-color: ${({ isActive }) =>
        isActive ? '#1E90FF' : 'transparent'};
  cursor: pointer;

  &:hover {
    background-color: ${({ isActive }) =>
        isActive ? '#1E90FF' : '#f7f7f7'};
  }
`;
const Icon = styled.div`
display: flex;
align-items: center;
font-size: 30px;
justify-content: center;
`
const Label = styled.div`
display: block;
font-size: 0.8em;


`
