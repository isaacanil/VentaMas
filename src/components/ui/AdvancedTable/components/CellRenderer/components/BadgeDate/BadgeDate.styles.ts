import styled from 'styled-components';

interface BadgeContainerProps {
  $bgColor?: string;
  $simple?: boolean;
}

interface DateIconContainerProps {
  $simple?: boolean;
}

interface DateTextProps {
  $color?: string;
  $simple?: boolean;
}

interface BadgeTextProps {
  $color: string;
}

export const BadgeContainer = styled.div<BadgeContainerProps>`
  display: ${({ $simple }: BadgeContainerProps) =>
    $simple ? 'flex' : 'inline-block'};
  align-items: ${({ $simple }: BadgeContainerProps) =>
    $simple ? 'center' : 'initial'};
  justify-content: ${({ $simple }: BadgeContainerProps) =>
    $simple ? 'center' : 'initial'};
  min-width: 115px;
  padding: ${({ $simple }: BadgeContainerProps) =>
    $simple ? '8px 16px' : '1px 8px'};
  background-color: ${({ $simple, $bgColor }: BadgeContainerProps) =>
    $simple
      ? 'var(--ds-color-bg-subtle)'
      : $bgColor || 'var(--ds-color-state-info-subtle)'};
  border-radius: var(--ds-radius-md);
`;

export const DateIconContainer = styled.div<DateIconContainerProps>`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: ${({ $simple }: DateIconContainerProps) =>
    $simple ? 'center' : 'space-between'};
`;

export const DateText = styled.span<DateTextProps>`
  font-size: var(--ds-font-size-base);
  color: ${({ $simple, $color }: DateTextProps) =>
    $simple ? 'var(--ds-color-text-secondary)' : $color || 'inherit'};
`;

export const BadgeText = styled.div<BadgeTextProps>`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  color: ${({ $color }: BadgeTextProps) => $color};
`;
