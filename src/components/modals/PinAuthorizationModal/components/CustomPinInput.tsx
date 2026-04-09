import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import styled from 'styled-components';

const PinInputContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 24px 0;
`;

interface PinDotProps {
  $filled?: boolean;
  $active?: boolean;
}

const PinDot = styled.div<PinDotProps>`
  width: 48px;
  height: 56px;
  border: 2px solid ${(props) => (props.$filled ? '#52c41a' : '#d9d9d9')};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (props.$filled ? '#f6ffed' : '#fafafa')};
  transition: all 0.2s ease;
  position: relative;

  ${(props) =>
    props.$active &&
    `
    border-color: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  `}

  &::after {
    width: 12px;
    height: 12px;
    content: '';
    background-color: ${(props) => (props.$filled ? '#52c41a' : 'transparent')};
    border-radius: 50%;
    transition: all 0.15s ease;
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
`;

const PinInputWrapper = styled.div`
  cursor: text;
`;

const createPinDotKeys = (maxLength: number) =>
  Array.from({ length: maxLength }, (_unused, index) => `pin-dot-${index + 1}`);

interface CustomPinInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  disabled?: boolean;
  maxLength?: number;
}

export const CustomPinInput = ({
  value = '',
  onChange,
  onEnter,
  disabled,
  maxLength = 6,
}: CustomPinInputProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(value.length);
  const dotKeys = createPinDotKeys(maxLength);

  useEffect(() => {
    setActiveIndex(value.length);
  }, [value]);

  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange?.(newValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && value.length > 0) {
      onChange?.(value.slice(0, -1));
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter') {
      onEnter?.();
      event.preventDefault();
    }
  };

  return (
    <PinInputWrapper onClick={handleContainerClick}>
      <PinInputContainer>
        {dotKeys.map((dotKey, index) => (
          <PinDot
            key={dotKey}
            $filled={index < value.length}
            $active={index === activeIndex && !disabled}
          />
        ))}
      </PinInputContainer>
      <HiddenInput
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
      />
    </PinInputWrapper>
  );
};
