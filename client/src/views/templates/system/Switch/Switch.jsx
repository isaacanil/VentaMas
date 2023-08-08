import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Animación de rebote
const bounce = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(15px); }
  100% { transform: translateX(0); }
`;

// Estilo del Switch
const SwitchContainer = styled.div`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border: 1px solid #ccc;
  border-radius: ${props => props.height / 2}px;
display: flex;
    align-items: center;
    justify-content: ${props => props.isOn ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isOn ? '#4caf50' : '#ccc'};
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s, justify-content 0.2s;
`;

// Estilo de la bola
const Ball = styled.div`
  width: ${props => props.diameter}px;
  height: ${props => props.diameter}px;
  border-radius: 50%;

  background-color: white;
  transition: left 0.2s;
  /* animation: ${props => props.isOn ? bounce : 'none'} 0.2s; */
`;

// Componente de Switch
const Switch = ({width = 45, height = 26, ballDiameter = 22}) => {
  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  return (
    <SwitchContainer isOn={isOn} onClick={toggleSwitch} width={width} height={height}>
      <Ball isOn={isOn} width={width} height={height} diameter={ballDiameter} />
    </SwitchContainer>
  );
};

export default Switch;