// DropdownMenu.js
import { Button as AntButton } from 'antd';
import React, { useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { useClickOutSide } from '../../../../hooks/useClickOutSide';

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
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);

  // estilos de popper
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [{ name: 'arrow' }],
  });

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
        React.cloneElement(customButton, {
          onClick: toggleMenu,
          ref: setReferenceElement,
        })
      ) : (
        <AntButton ref={setReferenceElement} onClick={toggleMenu} {...props}>
          {title}
        </AntButton>
      )}

      {isOpen && (
        <Container
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          {options.map((option, index) => (
            <Option key={index} option={option} closeMenu={closeMenu} />
          ))}
        </Container>
      )}
    </div>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.2em;
  min-width: 350px;
  max-width: 400px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);

  z-index: 555;
  overflow: hidden;
`;
