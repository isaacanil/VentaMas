import { Typography, InputNumber, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { addDiscount } from '../../../../features/cart/cartSlice';
import { quitarCeros } from '../../../../hooks/quitarCeros';
import { useClickOutSide } from '../../../../hooks/useClickOutSide';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';

const { Title, Paragraph } = Typography;

const CustomInput = ({
  options,
  value,
  discount,
  disabled = false,
  onRequestAccess,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const ensureAccess = () => {
    if (typeof onRequestAccess === 'function') {
      return onRequestAccess() !== false;
    }
    return true;
  };

  const blurInput = () => {
    const inputElement = inputRef.current?.querySelector('input');
    if (inputElement) {
      inputElement.blur();
    }
  };

  const handleChange = (newValue) => {
    if (disabled) return;
    if (!ensureAccess()) {
      blurInput();
      return;
    }
    dispatch(addDiscount(Number(quitarCeros(newValue))));
  };

  const handleClick = () => {
    if (disabled) return;
    if (!ensureAccess()) {
      blurInput();
      return;
    }
    setShowMenu((prev) => !prev);
  };

  const handleSelect = (option) => {
    if (disabled) return;
    if (!ensureAccess()) {
      blurInput();
      return;
    }
    setShowMenu(false);
    dispatch(addDiscount(option));
  };

  useClickOutSide(inputRef, showMenu, handleClick);

  useEffect(() => {
    if (value < 0) message.error('El descuento no puede ser negativo');
    if (value > 100) message.error('El descuento no puede ser mayor a 100');
  }, [value]);

  return (
    <Container ref={inputRef}>
      {showMenu && (
        <StyledMenu>
          <Title level={5}>Descuentos</Title>
          <Paragraph>Selecciona un descuento</Paragraph>
          <MenuOptions>
            {options.map((option) => (
              <StyledMenuItem key={option} onClick={() => handleSelect(option)}>
                {option}%
              </StyledMenuItem>
            ))}
          </MenuOptions>
        </StyledMenu>
      )}
      <Wrapper>
        <InputNumber
          value={value}
          onChange={handleChange}
          placeholder="%"
          prefix="%"
          addonAfter={'-' + useFormatPrice(discount)}
          style={{ width: '170px' }}
          min={0}
          max={100}
          onClick={handleClick}
          onFocus={() => {
            if (!disabled && !ensureAccess()) {
              blurInput();
            }
          }}
          disabled={disabled}
        />
      </Wrapper>
    </Container>
  );
};

export default CustomInput;

const Container = styled.div`
  position: relative;
`;
const Wrapper = styled.div`
  position: relative;
  label {
    height: 12px;
    box-sizing: border-box;
    margin: 0;
    padding: 0 0.4em;
    position: absolute;
    top: -8px;
    display: flex;
    align-items: center;
    background-color: white;
    color: #353535;
    font-weight: 600;
    border-radius: 3px;
    font-size: 11px;
  }
`;

const MenuOptions = styled.ul`
  display: grid;
  gap: 0.2em;
  grid-template-columns: repeat(6, 1fr);
  list-style: none;
  padding: 0;
`;
const StyledMenu = styled.div`
  border: 1px solid #ccc;
  padding: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  width: min-content;
  max-width: 500px;
  border-radius: 6px;
  background: #ffffff;
  position: absolute;
  z-index: 10;
  margin: -80px 0;
  right: 0;
  top: -58px;
`;

const StyledMenuItem = styled.li`
  padding: 5px 5px;
  display: flex;
  height: 2.4em;
  width: 3.2em;
  align-items: center;
  border-radius: 4px;
  justify-content: center;
  background-color: #f3f3f3;

  cursor: pointer;
`;
