import React, { useState } from 'react';
import styled from 'styled-components';
/******************* <Button children='Hola'/> para poder usar *********************************/
const StyledButton = styled.button`
  position: relative;
  display: inline-block;
`;

const Tooltip = styled.div`
  position: absolute;
  display: none;
  z-index: 1;
  background-color: #000;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
`;

export const ButtonWithMessage = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 10000 });

  const handleMouseEnter = (event) => {
    setIsHovered(true);
    setTooltipPosition({
      ...tooltipPosition,
      x: event.clientX,
  
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <StyledButton
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <Tooltip style={{ left: tooltipPosition.x, top: tooltipPosition.y, display: isHovered ? 'block' : 'none' }}>
        Hover me
      </Tooltip>
    </StyledButton>
  );
};

