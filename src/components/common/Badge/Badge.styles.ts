import styled, { css } from 'styled-components';

export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeVariant = 'filled' | 'outlined' | 'text' | 'light';

interface StyledBadgeProps {
  $color: string;
  $bgColor: string;
  $size: BadgeSize;
  $variant: BadgeVariant;
}

const getVariantStyles = (props: StyledBadgeProps) => {
  switch (props.$variant) {
    case 'outlined':
      return css`
        color: ${props.$color};
        background-color: transparent;
        border: 1px solid ${props.$color};
      `;
    case 'text':
      return css`
        padding-right: 0;
        padding-left: 0;
        color: ${props.$color};
        background-color: transparent;
        border: none;
      `;
    case 'light':
      return css`
        color: ${props.$color};
        background-color: ${props.$bgColor}40;
      `;
    default:
      return css`
        color: ${props.$color};
        background-color: ${props.$bgColor};
      `;
  }
};

export const StyledBadge = styled.span<StyledBadgeProps>`
  align-items: center;
  border-radius: 4px;
  display: inline-flex;
  font-weight: 500;

  ${(props) => {
    switch (props.$size) {
      case 'small':
        return css`
          padding: 2px 8px;
          font-size: 11px;
        `;
      case 'large':
        return css`
          padding: 6px 16px;
          font-size: 15px;
        `;
      default:
        return css`
          padding: 4px 12px;
          font-size: 13px;
        `;
    }
  }}

  ${(props) => getVariantStyles(props)}
`;

export const IconWrapper = styled.span`
  margin-right: 6px;
`;
