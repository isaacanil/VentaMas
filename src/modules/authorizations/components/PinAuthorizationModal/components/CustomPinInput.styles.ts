import styled from 'styled-components';

export const PinInputContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 24px 0;
`;

interface PinDotProps {
  $filled?: boolean;
  $active?: boolean;
}

export const PinDot = styled.div<PinDotProps>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 56px;
  border: 2px solid ${(props) => (props.$filled ? '#52c41a' : '#d9d9d9')};
  border-radius: 12px;
  background-color: ${(props) => (props.$filled ? '#f6ffed' : '#fafafa')};
  transition: all 0.2s ease;

  ${(props) =>
    props.$active &&
    `
    border-color: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  `}

  &::after {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${(props) => (props.$filled ? '#52c41a' : 'transparent')};
    content: '';
    transition: all 0.15s ease;
  }
`;

export const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;

export const PinInputWrapper = styled.div`
  cursor: text;
`;
