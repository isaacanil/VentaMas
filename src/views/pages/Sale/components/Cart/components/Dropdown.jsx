import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '../../../../../../hooks/useClickOutSide';

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.div``;

const DropdownContent = styled.div`
  position: absolute;
  z-index: 100000;
  display: ${(props) => (props.isOpen ? 'block' : 'none')};
  min-width: min-content;
  padding: 4px;
  background-color: #f9f9f9;
  border-radius: 4px;
  box-shadow: 0 8px 16px 0 rgb(0 0 0 / 20%);
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 2em;
  padding: 0 16px;
  cursor: pointer;

  &:hover {
    background-color: #f1f1f1;
  }
`;

export const Dropdown = ({ menu, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = (item) => {
    setIsOpen(false);
    item.onClick();
  };
  const btnRef = useRef();
  useClickOutSide(btnRef, isOpen, () => setIsOpen(false));
  return (
    <DropdownContainer ref={btnRef}>
      <DropdownButton onClick={() => setIsOpen(!isOpen)}>
        {children}
      </DropdownButton>
      <DropdownContent isOpen={isOpen}>
        {menu.items.map((item) => (
          <DropdownItem key={item.key} onClick={() => handleClick(item)}>
            {item.label}
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownContainer>
  );
};
