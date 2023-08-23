import React, { useState } from 'react';
import styled from 'styled-components';

const MenuButton = styled.button`
  /* Estilos para el botón del menú */
`;

const Option = styled.div`
width: 100%;
height: 2.75em;
padding: 0 1em;
display: flex;
align-items: center;
:hover {
  background-color: #f2f2f2;
}
  /* Estilos para los botones de las opciones */
`;

const OptionsContainer = styled.div`
  width: 100%;
  max-width: 200px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  padding: 0em 0;
  position: absolute;
  z-index: 5;
  overflow: hidden;


  
`;

export const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { text: 'Opción 1', action: () => alert('Has seleccionado la Opción 1') },
    { text: 'Opción 2', action: () => alert('Has seleccionado la Opción 2') },
    { text: 'Opción 3', action: () => alert('Has seleccionado la Opción 3') },
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <MenuButton onClick={toggleMenu}>Menú</MenuButton>
      {isOpen && (
        <OptionsContainer>
          {options.map((option, index) => (
            <Option key={index} onClick={option.action}>
              {option.text}
            </Option>
          ))}
        </OptionsContainer>
      )}
    </div>
  );
};


