import { Badge as AntdBadge } from 'antd';
import styled, { css } from 'styled-components';

interface PillButtonStyleProps {
  $bg?: string;
  $color?: string;
}

const base = css`
  display: inline-flex;
  gap: 0.6em;
  align-items: center;
  justify-content: space-between;
  width: auto;
  padding: 0.4em 0.6em;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e1e1;
  border-radius: 50px;
  transition: all 0.25s ease;

  &:active {
    box-shadow: 0 1px 4px rgb(0 0 0 / 15%);
    transform: translateY(1px);
  }

  &:disabled {
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
  }
`;

export const StyledPillButton = styled.button<PillButtonStyleProps>`
  ${base}

  background-color: ${({ $bg }) => $bg || 'white'};
  color: ${({ $color }) => $color || 'black'};
`;

export const IconWrapper = styled.span`
  display: flex;
  align-items: center;
`;

export const Label = styled.span`
  font-weight: 500;
`;

export const PillBadge = styled(AntdBadge)`
  z-index: 10;
`;
