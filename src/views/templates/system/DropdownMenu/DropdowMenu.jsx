// DropdownMenu.js
import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { Button as AntButton } from 'antd';
import { useCallback, useRef, useState, cloneElement } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '@/hooks/useClickOutSide';

import { Option } from './Option';

export const DropdownMenu = ({
  title = 'Opciones',
  options = [],
  customButton,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const DropDownMenuRef = useRef(null);

  // Popper
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [floatingOffset(8), flip(), shift({ padding: 8 })],
  });
  const setReference = useCallback((node) => refs.setReference(node), [refs]);
  const setFloating = useCallback((node) => refs.setFloating(node), [refs]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useClickOutSide(DropDownMenuRef, isOpen, toggleMenu);

  return (
    <div ref={DropDownMenuRef}>
      {customButton ? (
        cloneElement(customButton, {
          onClick: toggleMenu,
          ref: setReference,
        })
      ) : (
        <AntButton ref={setReference} onClick={toggleMenu} {...props}>
          {title}
        </AntButton>
      )}

      {isOpen && (
        <Container ref={setFloating} style={floatingStyles}>
          {options.map((option, index) => (
            <Option key={index} option={option} closeMenu={closeMenu} />
          ))}
        </Container>
      )}
    </div>
  );
};

const Container = styled.div`
  z-index: 555;
  width: 100%;
  min-width: 350px;
  max-width: 400px;
  padding: 0.2em;
  overflow: hidden;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 0 5px rgb(0 0 0 / 30%);
`;
