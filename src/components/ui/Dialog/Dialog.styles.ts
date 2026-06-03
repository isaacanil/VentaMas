import { m } from 'framer-motion';
import styled, { css, type DefaultTheme } from 'styled-components';

import type { DialogSize, DialogType } from '@/Context/Dialog/contextState';
import Typography from '@/components/ui/Typografy/Typografy';

import { dialogTheme } from './Dialog.config';

const getDialogSize = (size: DialogSize = 'default') => {
  const sizes = {
    small: css`
      max-width: 400px;
      min-height: 200px;
    `,
    default: css`
      max-width: 600px;
      min-height: 300px;
    `,
    large: css`
      max-width: 800px;
      min-height: 400px;
    `,
  };
  return sizes[size] || sizes.default;
};

export const BaseButton = styled.button`
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transform-origin: center;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    transform: none !important;
  }

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    background: linear-gradient(
      45deg,
      transparent,
      rgb(255 255 255 / 10%),
      transparent
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover:not(:disabled)::before {
    transform: translateX(100%);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;

export const CancelButton = styled(BaseButton)`
  color: #64748b;
  background: ${(props: { theme: DefaultTheme }) =>
    props.theme.colors?.background || '#ffffff'};
  border: 2px solid #e2e8f0;

  &:hover:not(:disabled) {
    color: #475569;
    background: #f8fafc;
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgb(148 163 184 / 10%);
    transform: translateY(-2px);
  }
`;

export const ConfirmButton = styled(BaseButton)<{ $type: DialogType }>`
  color: white;
  background: ${({ $type }) => dialogTheme[$type]?.button || '#3b82f6'};
  border: none;
  box-shadow: 0 2px 8px ${({ $type }) => dialogTheme[$type]?.border}40;

  &:hover:not(:disabled) {
    background: ${({ $type }) => dialogTheme[$type]?.buttonHover || '#2563eb'};
    box-shadow: 0 4px 15px ${({ $type }) => dialogTheme[$type]?.border}60;
    transform: translateY(-2px);
  }

  &:disabled {
    background: ${({ $type }) => dialogTheme[$type]?.button}90;
  }
`;

export const CloseButton = styled(BaseButton)<{ $type: DialogType }>`
  width: 32px;
  min-width: unset;
  height: 32px;
  padding: 0;
  color: ${({ $type }) => dialogTheme[$type]?.text};
  background: transparent;
  border: 2px solid ${({ $type }) => dialogTheme[$type]?.border}40;
  border-radius: 50%;

  &:hover:not(:disabled) {
    background: ${({ $type }) => dialogTheme[$type]?.border}20;
    transform: rotate(90deg);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: ${({ $type }) => dialogTheme[$type]?.text};
  }
`;

export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

export const Backdrop = styled(m.div)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100dvw;
  height: 100%;
  padding: 1rem;
  backdrop-filter: blur(4px) brightness(0.7);
`;

export const Container = styled(m.div)<{
  $size: DialogSize;
  $type: DialogType;
}>`
  ${({ $size }) => getDialogSize($size)}

  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 1.5rem;
  width: 100%;
  padding: 1.75rem;
  background-color: ${({ $type, theme }) =>
    dialogTheme[$type]?.background || theme.colors?.background};
  border: 2px solid
    ${({ $type }) => dialogTheme[$type]?.border || 'rgba(0,0,0,0.1)'};
  border-radius: 16px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 8%);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

export const Header = styled.div<{ $type: DialogType }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  color: ${({ $type }) => dialogTheme[$type]?.text};
  border-bottom: 1px solid ${({ $type }) => dialogTheme[$type]?.border}30;
`;

export const Body = styled.div`
  display: flex;
  align-items: flex-start;
`;

export const Description = styled.div<{ $type: DialogType }>`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  width: 100%;
  padding: 1.5rem;
  color: ${({ $type }) => dialogTheme[$type]?.text};
  background-color: ${({ $type }) =>
    dialogTheme[$type]?.iconBg || 'rgba(0,0,0,0.05)'};
  border: 1px solid ${({ $type }) => dialogTheme[$type]?.border}30;
  border-radius: 12px;
`;

export const IconWrapper = styled.div<{ $type: DialogType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  color: ${({ $type }) => dialogTheme[$type]?.text || 'inherit'};
`;

export const MessageText = styled(Typography)`
  flex: 1;
  line-height: 1.5;
`;

export const Footer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;
