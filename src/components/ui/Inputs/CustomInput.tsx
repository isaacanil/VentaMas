import { Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { addDiscount } from '@/features/cart/cartSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { formatPrice } from '@/utils/format';
import { quitarCeros } from '@/utils/number/number';

import {
  Container,
  DiscountButton,
  FullWidthCompact,
  FullWidthInputNumber,
  MenuOptions,
  StyledMenu,
  StyledMenuItem,
  Wrapper,
} from './CustomInput.styles';

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
        <FullWidthCompact>
          <FullWidthInputNumber
            value={value}
            onChange={handleChange}
            placeholder="%"
            prefix="%"
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
          <DiscountButton disabled>
            {'-' + formatPrice(discount)}
          </DiscountButton>
        </FullWidthCompact>
      </Wrapper>
    </Container>
  );
};

export default CustomInput;
