import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../Button/Button';
import { Option } from './Option';
import { useClickOutSide } from '../../../../hooks/useClickOutSide';
import { usePopper } from 'react-popper';


export const DropdownMenu = ({ title = 'Opciones', options = [], ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const DropDownMenuRef = useRef(null);
 // Popper
 const [referenceElement, setReferenceElement] = useState(null);
 const [popperElement, setPopperElement] = useState(null);
 //estilos de popper
 const { styles, attributes } = usePopper(referenceElement, popperElement, {
  modifiers: [{ name: 'arrow' }],
});
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  useClickOutSide(DropDownMenuRef,  isOpen, toggleMenu,);
  return (
    <div  ref={DropDownMenuRef}>
      <Button
        ref={setReferenceElement}
        title={title}
        onClick={toggleMenu}
        {...props}
      />
      {/* <button
        ref={setReferenceElement}
        onClick={toggleMenu}

      >
        {title}
      </button> */}
      {isOpen && (
        <Container
          
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          {options.map((option, index) => (
            <Option key={index} option={option} />
          ))}
        </Container>
      )}
    </div>
  );
};


const Container = styled.div`
  width: 100%;
  min-width: 350px;
  max-width: 400px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  padding: 0em 0;
  z-index: 55;
  overflow: hidden;

  
`;

