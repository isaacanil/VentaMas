import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../../constants/icons/icons';
import { useClickOutSide } from '../../../../../../hooks/useClickOutSide';

export const Item = ({
  label,
  filterOptions,
  onChange,
  onClear,
  format,
  selectedValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(!isOpen);

  const handleSelect = (value) => {
    const event = { target: { value } };
    onChange(event);
  };

  const MenuRef = useRef(null);
  useClickOutSide(MenuRef, isOpen, () => setIsOpen(false));
  const handleClear = () => onClear();

  return (
    <Container ref={MenuRef}>
      <Header onClick={handleOpen} selectedValue={selectedValue}>
        {label}
        {isOpen ? icons.arrows.caretUp : icons.arrows.caretDown}
      </Header>
      {isOpen && (
        <Menu>
          <Body>
            {filterOptions.map((option, optionIndex) => (
              <OptionItem
                key={optionIndex}
                isSelected={selectedValue == option.value}
                onClick={() => handleSelect(option.value)}
              >
                {format ? format(option.label) : option.label}
              </OptionItem>
            ))}
          </Body>
          <Footer>
            <button onClick={handleClear} disabled={!selectedValue}>
              Limpiar
            </button>
          </Footer>
        </Menu>
      )}
    </Container>
  );
};
const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.bg.shave};
`;
const Header = styled.div`
  height: 2.2em;
  border-radius: 8px;
  justify-content: space-between;
  gap: 1em;
  border: 2px solid #ccc;
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.bg.shade};
  padding: 0 0.4em;
  ${(props) =>
    props.selectedValue &&
    `
        border: 2px solid ${props.theme.bg.color};
        
    `}
`;

const Menu = styled.div`
  position: absolute;
  top: 100%;
  z-index: 100;
  display: grid;
  grid-template-rows: 1fr min-content;
  min-width: 300px;
  height: 300px;
  overflow-y: hidden;
  background-color: rgb(242 242 242);
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 0 10px 0 rgb(0 0 0 / 20%);
`;

const Body = styled.div`
  top: 100%;
  z-index: 100;
  overflow-y: scroll;
  background-color: rgb(255 255 255);
`;
const OptionItem = styled.div`
  border-bottom: 1px solid #ccc;
  height: 2.4em;
  display: flex;
  padding: 0 1em;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #5e5e5e + cc;
  }
  ${(props) =>
    props.isSelected === true &&
    `
        background-color: #9cb2f0;

    `}
`;

const Footer = styled.div`
  display: flex;
  height: 2.2em;

  button {
    flex-grow: 1;
    font-weight: 500;
    color: white;
    background-color: gray;
    border: none;

    &:disabled {
      color: #666;
      background-color: #ccc;
    }
  }
`;
