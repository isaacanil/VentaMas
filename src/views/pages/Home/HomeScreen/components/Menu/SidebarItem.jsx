import React from 'react';
import styled from 'styled-components';

export const SidebarItem = ({ item, isActive, onClick }) => {
  return (
    <Container onClick={onClick} isActive={isActive}>
      <Icon>{item.icon}</Icon>
      <Label>{item.label}</Label>
    </Container>
  );
};
const Container = styled.li`
  display: grid;
  gap: 0.2em;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.6em 0.4em;
  color: ${({ isActive }) => (isActive ? '#fff' : '#333')};
  cursor: pointer;
  background-color: ${({ isActive }) => (isActive ? '#1E90FF' : 'transparent')};
  border-radius: 8px;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background-color: ${({ isActive }) => (isActive ? '#1E90FF' : '#f7f7f7')};
  }
`;
const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
`;
const Label = styled.div`
  display: block;
  font-size: 0.8em;
`;
