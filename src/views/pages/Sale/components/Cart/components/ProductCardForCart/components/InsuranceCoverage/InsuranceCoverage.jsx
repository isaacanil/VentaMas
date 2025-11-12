import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { updateProductInsurance } from '../../../../../../../../../features/cart/cartSlice';

const validateNumericWithDecimal = (input) => {
  // Si está vacío, permitirlo
  if (input === '') return '';
  
  // Verificar si la entrada contiene sólo dígitos y a lo sumo un punto decimal
  const isValid = /^(\d+)?\.?(\d+)?$/.test(input);
  
  if (isValid) {
    return input;
  } else {
    // Si no es válido, rechazamos el cambio
    return null;
  }
};

export const InsuranceCoverage = ({ item }) => {
  const dispatch = useDispatch();
  
  // Local state for insurance mode and value
  const [insurance, setInsurance] = useState({
    mode: item.insurance?.mode || 'porcentaje',
    value: item.insurance?.value 
  });

  // Update local state when item changes
  useEffect(() => {
    setInsurance({
      mode: item.insurance?.mode || 'porcentaje',
      value: item.insurance?.value 
    });
  }, [item]);

  const handleInsuranceModeChange = (newMode) => {
    const newInsurance = { ...insurance, mode: newMode };
    setInsurance(newInsurance);
    dispatch(updateProductInsurance({ 
      id: item.id, 
      mode: newMode, 
      value: newInsurance.value 
    }));
  };

  const handleInsuranceValueChange = newValue => {
    const validatedValue = validateNumericWithDecimal(newValue);

    // Si la entrada no es válida, mantenemos el valor anterior
    if (validatedValue === null) return;
    
    // Actualizamos el estado con el valor validado
    const newInsurance = { ...insurance, value: validatedValue };
    setInsurance(newInsurance);
    dispatch(updateProductInsurance({ 
      id: item.id, 
      mode: newInsurance.mode, 
      value: newInsurance.value 
    }));
  };

  const handleInsuranceValueBlur = e => {
    let value = e.target.value === '' ? '' : Number(e.target.value);

    if (insurance.mode === 'porcentaje') {
      if (value > 100) value = 100;

      setInsurance({ ...insurance, value });
      dispatch(updateProductInsurance({ 
        id: item.id, 
        mode: insurance.mode, 
        value 
      }));
    }
  };

  return (
    <CoveragePill
      as={motion.div}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CoverageLabel>Cobertura</CoverageLabel>
      <CoverageControls>
        <ToggleSwitch>
          <ToggleTrack 
            onClick={() => handleInsuranceModeChange(insurance.mode === 'porcentaje' ? 'monto' : 'porcentaje')}
            active={insurance.mode === 'monto'}
          >
            <SwitchOption position="left" active={insurance.mode === 'porcentaje'}>%</SwitchOption>
            <SwitchOption position="right" active={insurance.mode === 'monto'}>$</SwitchOption>
            <ToggleThumb 
              as={motion.div}
              animate={{ 
                x: insurance.mode === 'monto' ? 24 : -2
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          </ToggleTrack>
        </ToggleSwitch>
        <ValueInput
          value={insurance.value}
          onChange={(e) => handleInsuranceValueChange(e.target.value)}
          onBlur={handleInsuranceValueBlur}
          as={motion.input}
          whileFocus={{ boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.25)" }}
        />
      </CoverageControls>
    </CoveragePill>
  );
};

// Estilos
const CoveragePill = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 10px;
  background: #f9f9f9;
  border: 1px solid #eaeaea;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    border-color: #e0e0e0;
  }
`;

const CoverageLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-right: 8px;
  white-space: nowrap;
`;

const CoverageControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ToggleSwitch = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToggleTrack = styled.div`
  width: 52px;
  height: 28px;
  background-color: #f3f3f3;
  border-radius: 100px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.151) inset;
  padding: 0 2px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #d0d0d0;
  }
`;

const ToggleThumb = styled.div`
  position: absolute;
  left: 2px;
  width: 24px;
  height: 24px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  z-index: 2;
`;

const SwitchOption = styled.div`
  position: absolute;
  left: ${props => props.position === 'left' ? '6px' : '34px'};
  color: ${props => props.active ? 'black' : '#3b3b3b'};
  font-size: 14px;
  font-weight: 500;
  z-index: 3;
  transition: color 0.3s ease;
`;

const ValueInput = styled.input`
  width: 100%;
  height: 2em;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background: white;
  padding: 0 8px;
  text-align: center;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    border-color: #2563eb;
    outline: none;
  }
  
  &:focus {
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
  
  &::placeholder {
    color: #aaa;
  }
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;

export default InsuranceCoverage;