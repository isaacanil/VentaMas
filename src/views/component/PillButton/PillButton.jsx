import { Badge, Spin } from 'antd';
import styled, { css } from 'styled-components';

const base = css`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e1e1;
  border-radius: 50px;
  padding: 0.4em 0.6em;
  gap: 0.6em;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  width: auto;

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const StyledPillButton = styled.button`
  ${base}
  background-color: ${({ bg }) => bg || 'white'};
  color: ${({ color }) => color || 'black'};
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
`;

const Label = styled.span`
  font-weight: 500;
`;

/**
 * @param {Object} props
 * @param {ReactNode} props.children
 * @param {string} [props.bg]    // background-color
 * @param {string} [props.color] // text color
 * @param {boolean} [props.disabled]
 * @param {function} [props.onClick]
 */
export const PillButton = ({
  icon,
  children,
  loading,
  bg,
  color,
  disabled,
  onClick,
  badgeCount,
}) => (
  <StyledPillButton
    bg={bg}
    color={color}
    disabled={disabled || loading}
    onClick={onClick}
  >
    {icon && <IconWrapper>{icon}</IconWrapper>}
    <Label>{children}</Label>
    <Badge
      count={badgeCount}
      overflowCount={9999}
      style={{
        zIndex: 10,
      }}
    ></Badge>
    {loading && <Spin size="small" />}
  </StyledPillButton>
);
