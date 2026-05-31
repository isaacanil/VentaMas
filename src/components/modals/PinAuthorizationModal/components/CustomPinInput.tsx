import { useRef, type ChangeEvent, type KeyboardEvent } from 'react';

import {
  HiddenInput,
  PinDot,
  PinInputContainer,
  PinInputWrapper,
} from './CustomPinInput.styles';

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
  const activeIndex = value.length;
  const dotKeys = createPinDotKeys(maxLength);

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
