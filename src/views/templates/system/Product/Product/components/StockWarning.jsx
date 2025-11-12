import React from 'react';
import styled from 'styled-components';

// Styled wrapper for the warning badge
const WarningWrapper = styled.div`
  position: absolute;
  ${({ position }) => (position === 'top' ? 'top: 0;' : 'bottom: 0;')}
  left: 0;
  width: 105px;
  text-align: center;
  line-height: 1em;
  border-top-right-radius: 10px;
  padding: ${({ position }) =>
    position === 'top' ? '0.2em 0.4em 0.6em' : '0.6em 0.4em 0.2em'};
  background: ${({ variant, isSelected }) => {
    switch (variant) {
      case 'outOfStock':
        return isSelected
          ? 'linear-gradient(180deg, rgba(239, 83, 80, 0), #ef5350 50%)'
          : 'linear-gradient(180deg, rgba(158, 158, 158, 0), #9e9e9e 50%)';
      case 'criticalStock':
        // Stronger orange/red gradient for critical
        return 'linear-gradient(180deg, rgba(255, 112, 67, 0), #ff7043 50%)';
      case 'lowStock':
        return 'linear-gradient(180deg, rgba(251, 140, 0, 0), #fb8c00 50%)';
      default:
        return 'linear-gradient(180deg, rgba(158, 158, 158, 0), #9e9e9e 50%)';
    }
  }};
  transform: translateX(0) scale(1);
  transition: all 300ms ease-in-out;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  z-index: 1;
`;

/**
 * @param {string} message     - Texto a mostrar en la advertencia
 * @param {'top'|'bottom'} position  - Posición de la etiqueta
 * @param {boolean} isSelected - Estado de selección (cambia degradado)
 * @param {boolean} show       - Control de visibilidad
 * @param {'outOfStock'|'lowStock'|'criticalStock'} variant - Tipo de advertencia
 */
export const StockWarning = ({
  message,
  position = 'top',
  isSelected = false,
  show = false,
  variant = 'outOfStock',
}) => {
  if (!show) return null;
  return (
    <WarningWrapper
      position={position}
      isSelected={isSelected}
      variant={variant}
    >
      {message}
    </WarningWrapper>
  );
};
