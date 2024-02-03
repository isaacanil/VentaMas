import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useClickOutSide } from '../../../../hooks/useClickOutSide';

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.div`


 

  
`;

const DropdownContent = styled.div`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: absolute;
  background-color: #f9f9f9;
  min-width: min-content;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  padding: 4px;
  z-index: 100000;
  border-radius: 4px;
`;

const DropdownItem = styled.div`
  padding: 0 16px;
  display: flex;
  width: 100%;
  align-items: center;
  height: 2em;
  cursor: pointer;
  &:hover {
    background-color: #f1f1f1;
  }
`;

export const Dropdown = ({ trigger, menu, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = (item) => {
    setIsOpen(false);
    item.onClick()
  }
  const btnRef = useRef();
    useClickOutSide(btnRef, isOpen, () => setIsOpen(false));
  return (
    <DropdownContainer ref={btnRef} >
      <DropdownButton onClick={() => setIsOpen(!isOpen)}>
       {children}
      </DropdownButton>
      <DropdownContent isOpen={isOpen}>
        {menu.items.map(item => (
          <DropdownItem key={item.key} onClick={() => handleClick(item)}>
            {item.label}
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownContainer>
  );
};


