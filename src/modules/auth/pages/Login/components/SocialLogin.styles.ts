import { Divider } from 'antd';
import styled, { keyframes } from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const LoadingSpinner = styled.span`
  display: inline-block;
  flex-shrink: 0;
  width: 1.1em;
  height: 1.1em;
  vertical-align: middle;
  border: 2px solid rgb(255 255 255 / 20%);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

export const SocialDivider = styled(Divider)`
  margin: 1.25rem 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgb(255 255 255 / 40%);
  border-color: rgb(255 255 255 / 12%);
`;

export const SocialButton = styled.button`
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.01em;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: rgb(255 255 255 / 5%);
    border-color: rgb(255 255 255 / 30%);
    transform: translateY(-1px);
  }

  &:active {
    background-color: rgb(255 255 255 / 8%);
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  svg {
    flex-shrink: 0;
  }
`;
