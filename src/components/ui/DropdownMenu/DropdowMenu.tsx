// DropdownMenu.js
import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { Button as AntButton } from 'antd';
import { cloneElement, useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import styled from 'styled-components';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import type { DropdownMenuProps } from '@/types/ui';
import { Option } from './Option';

const EMPTY_OPTIONS: DropdownMenuProps['options'] = [];
const BORDER_RADIUS_MAP: Record<string, string> = {
  normal: 'var(--border-radius)',
  light: 'var(--border-radius-light)',
  none: '0',
  round: '100px',
};

export const DropdownMenu = ({
  title = 'Opciones',
  options = EMPTY_OPTIONS,
  customButton,
  ...props
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const DropDownMenuRef = useRef<HTMLDivElement>(null);
  const { borderRadius, style, ...buttonProps } = props as {
    borderRadius?: string;
    style?: CSSProperties;
  };
  const buttonStyle = borderRadius
    ? {
        ...style,
        borderRadius: BORDER_RADIUS_MAP[borderRadius] ?? borderRadius,
      }
    : style;

  // Popper
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [floatingOffset(8), flip(), shift({ padding: 8 })],
  });
  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useClickOutSide(DropDownMenuRef, isOpen, toggleMenu);

  return (
    <div ref={DropDownMenuRef}>
      {customButton ? (
        cloneElement(customButton as any, {
          onClick: toggleMenu,
          ref: setReference,
        })
      ) : (
        <AntButton
          ref={setReference}
          onClick={toggleMenu}
          style={buttonStyle}
          {...buttonProps}
        >
          {title}
        </AntButton>
      )}

      {isOpen && (
        <Container ref={setFloating} style={floatingStyles}>
          {options.map((option) => (
            <Option
              key={
                option.id ||
                (typeof option.text === 'string'
                  ? option.text
                  : typeof option.description === 'string'
                    ? option.description
                    : title)
              }
              option={option}
              closeMenu={closeMenu}
            />
          ))}
        </Container>
      )}
    </div>
  );
};

const Container = styled.div`
  z-index: 555;
  width: 100%;
  min-width: 350px;
  max-width: 400px;
  padding: 0.2em;
  overflow: hidden;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 0 5px rgb(0 0 0 / 30%);
`;
