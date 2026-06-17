import type { MouseEventHandler } from 'react';
import styled from 'styled-components';

type MenuStyleProps = {
  $isOpen?: boolean;
  $zIndex?: number;
};

interface OpenMenuButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  zIndex?: number;
  isOpen?: boolean;
}

export const OpenMenuButton = ({
  onClick,
  zIndex,
  isOpen,
}: OpenMenuButtonProps) => {
  return (
    <Container
      $isOpen={isOpen}
      $zIndex={zIndex}
      aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      onClick={onClick}
      type="button"
    >
      <MenuIcon $isOpen={isOpen} />
    </Container>
  );
};
const Container = styled.button<MenuStyleProps>`
  display: grid;
  place-items: center center;
  flex: 0 0 auto;
  justify-self: start;
  width: 2em;
  min-width: 2em;
  height: 2em;
  z-index: ${(props) =>
    typeof props.$zIndex === 'number' ? props.$zIndex : 'auto'};
  appearance: none;
  padding: 0;
  line-height: 0;
  background-color: rgb(0 0 0 / 20%);
  border: 0;
  border-radius: var(--border-radius);
  color: var(--menu-items, rgb(241 241 241));
  cursor: pointer;
  font: inherit;
  transition-delay: ${(props) => (props.$isOpen ? '0s' : '1s')};

  &:hover {
    background-color: rgb(0 0 0 / 28%);
  }

  &:focus-visible {
    outline: 2px solid rgb(255 255 255 / 70%);
    outline-offset: 2px;
  }

  @media (width <= 768px) {
    width: 2.3em;
    min-width: 2.3em;
    height: 2.3em;
  }
`;
const MenuIcon = styled.div<MenuStyleProps>`
  position: relative;
  z-index: 10;
  width: 1.2em;
  height: 2px;
  background-color: currentColor;
  border-radius: 999px;
  transition: all 1s ease-in-out;

  @media (width <= 768px) {
    width: 1.4em;
    height: 2.5px;
  }

  &::after {
    content: '';
    position: absolute;
    z-index: 10;
    inset-block-start: 0;
    inset-inline: 0;
    width: 1.2em;
    height: 2px;
    background-color: currentColor;
    border-radius: 999px;
    transform: translateY(6px);
    transition: all 0.4s ease-in-out;

    @media (width <= 768px) {
      width: 1.4em;
      height: 2.5px;
      transform: translateY(7px);
    }
  }

  &::before {
    content: '';
    position: absolute;
    z-index: 10;
    inset-block-start: 0;
    inset-inline: 0;
    width: 1.2em;
    height: 2px;
    background-color: currentColor;
    border-radius: 999px;
    transform: translateY(-6px);
    transition: all 0.4s ease-in-out;

    @media (width <= 768px) {
      width: 1.4em;
      height: 2.5px;
      transform: translateY(-7px);
    }
  }
  ${(props) => {
    switch (props.$isOpen) {
      case true:
        return `
        position: relative;
         width: 1.2em;
         height: 2px;
         background-color: transparent;
         transition: all 0.2s ease-in-out;
         
         @media (max-width: 768px) {
           width: 1.4em;
           height: 2.5px;
         }
         
        &::after {
            content: '';
            position: absolute;
            inset-block-start: 0;
            inset-inline: 0;
            width: 1.2em;
            height: 2px;
            background-color: currentColor;
            transform: rotate(-45deg);
            transition: all 0.4s ease-in-out;

            @media (max-width: 768px) {
              width: 1.4em;
              height: 2.5px;
            }
         }

         &::before {
            content: '';
            position: absolute;
            inset-block-start: 0;
            inset-inline: 0;
            width: 1.2em;
            height: 2px;
            background-color: currentColor;
            transform: rotate(45deg);
            transition: all 0.4s ease-in-out;
            
            @media (max-width: 768px) {
              width: 1.4em;
              height: 2.5px;
            }
         }
        `;
      default:
        return '';
    }
  }}
`;
