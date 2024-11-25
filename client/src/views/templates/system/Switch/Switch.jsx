import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const sizeVariants = {
  small: { width: '42px', height: '22px', knobSize: '16px' },
  medium: { width: '48px', height: '24px', knobSize: '18px' },
  large: { width: '52px', height: '26px', knobSize: '20px' },
};

const SwitchContainer = styled.div`
  width: ${({ size }) => sizeVariants[size].width};
  min-width: ${({ size }) => sizeVariants[size].width};
  max-width: ${({ size }) => sizeVariants[size].width};
  height: ${({ size }) => sizeVariants[size].height};
  min-height: ${({ size }) => sizeVariants[size].height};
  border-radius: ${({ size }) => `calc(${sizeVariants[size].height} / 2)`};
  background-color: ${({ isOn }) => (isOn ? '#1976D2' : '#c5c5c5')};
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Knob = styled(motion.div)`
  width: ${({ size }) => sizeVariants[size].knobSize};
  height: ${({ size }) => sizeVariants[size].knobSize};
  border-radius: 50%;
  background-color: white;
`;

export const Switch = ({ size = 'medium', checked = false, onChange, name }) => {
  const switchRef = useRef(null);
  const [knobPosition, setKnobPosition] = useState(null);

  const toggleSwitch = useCallback(() => {
    if (onChange) {
      onChange({ target: { name, checked: !checked, type: "checkbox" } });
    }
  }, [name, checked, onChange]);

  useEffect(() => {
    if (switchRef.current) {
      const { width } = switchRef.current.getBoundingClientRect();
      const knobWidth = parseFloat(sizeVariants[size].knobSize);
      const offPosition = 4;  // Margin from the left
      const onPosition = width - knobWidth - offPosition;
      setKnobPosition(checked ? onPosition : offPosition);
    }
  }, [checked, size]);

  return (
    <SwitchContainer ref={switchRef} onClick={toggleSwitch} isOn={checked} size={size}>
      <Knob
        initial={false}
        animate={{ x: knobPosition }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 1 }}
        size={size}
      />
      <input
        type="checkbox"
        style={{ display: 'none' }}
        checked={checked}
        name={name}
        onChange={toggleSwitch}
      />
    </SwitchContainer>
  );
};
