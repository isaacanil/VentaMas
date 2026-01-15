import { Typography, InputNumber, message, Space, Button } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { addDiscount } from '@/features/cart/cartSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { formatPrice } from '@/utils/format';
import { quitarCeros } from '@/utils/number/number';



const { Title, Paragraph } = Typography;

interface CustomInputProps {
  options: number[];
  value: number;
  discount: number;
  disabled?: boolean;
  onRequestAccess?: () => boolean | void;
  width?: string;
}

const CustomInput = ({
  options,
  value,
  discount,
  disabled = false,
  onRequestAccess,
  width = '170px',
}: CustomInputProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLDivElement>(null);

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

  const handleChange = (newValue: number | null) => {
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

  const handleSelect = (option: number) => {
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
      <Wrapper $width={width}>
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            value={value}
            onChange={handleChange}
            placeholder="%"
            prefix="%"
            style={{ width: '100%' }}
         
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
          <Button
            disabled
            style={{
              cursor: 'default',
              color: 'rgba(0, 0, 0, 0.88)',
              backgroundColor: '#fafafa',
              borderColor: '#d9d9d9',
            }}
          >
            {'-' + formatPrice(discount)}
          </Button>
        </Space.Compact>
      </Wrapper>
    </Container>
  );
};

export default CustomInput;

const Container = styled.div`
  position: relative;
`;
const Wrapper = styled.div<{ $width?: string }>`
  position: relative;
  width: ${(props) => props.$width || '170px'};

  label {
    position: absolute;
    top: -8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: 12px;
    padding: 0 0.4em;
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: #353535;
    background-color: white;
    border-radius: 3px;
  }

  .ant-input-number-group-wrapper,
  .ant-input-number-wrapper,
  .ant-input-number {
    width: 100%;
  }

  .ant-input-number-group-addon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
`;

const MenuOptions = styled.ul`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.2em;
  padding: 0;
  list-style: none;
`;
const StyledMenu = styled.div`
  position: absolute;
  top: -58px;
  right: 0;
  z-index: 10;
  width: min-content;
  max-width: 500px;
  padding: 10px;
  margin: -80px 0;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 0 10px rgb(0 0 0 / 20%);
`;

const StyledMenuItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.2em;
  height: 2.4em;
  padding: 5px;
  cursor: pointer;
  background-color: #f3f3f3;
  border-radius: 4px;
`;
