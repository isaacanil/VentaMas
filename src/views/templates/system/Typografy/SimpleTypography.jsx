import React from 'react';
import styled, { css } from 'styled-components';

import { designSystemV2 } from '../../../../theme/designSystemV2';

const { colors: palette } = designSystemV2;

const SIZE_TOKENS = {
    large: {
        fontSize: '1.1rem',
        lineHeight: '1.6rem',
    },
    medium: {
        fontSize: '1rem',
        lineHeight: '1.45rem',
    },
    small: {
        fontSize: '0.9rem',
        lineHeight: '1.3rem',
    },
    xsmall: {
        fontSize: '0.8rem',
        lineHeight: '1.2rem',
    },
};

const WEIGHT_TOKENS = {
    regular: 400,
    medium: 600,
    bold: 700,
};

const COLOR_TOKENS = {
    primary: palette.text.primary,
    secondary: palette.text.secondary,
    muted: palette.text.muted,
    inverse: palette.text.inverse,
    success: palette.states.success,
    danger: palette.states.danger,
    warning: palette.states.warning,
    info: palette.states.info,
};

const ellipsisStyles = css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const StyledText = styled.span`
    margin: 0;
    font-size: ${({ $size }) => SIZE_TOKENS[$size].fontSize};
    line-height: ${({ $size }) => SIZE_TOKENS[$size].lineHeight};
    font-weight: ${({ $weight }) => WEIGHT_TOKENS[$weight]};
    color: ${({ $color }) => COLOR_TOKENS[$color] ?? COLOR_TOKENS.primary};
    text-align: ${({ $align }) => $align};
    letter-spacing: 0.01em;

    ${({ $uppercase }) => $uppercase && 'text-transform: uppercase;'}
    ${({ $truncate }) => $truncate && ellipsisStyles}
`;

export const SimpleTypography = ({
    as,
    size = 'medium',
    weight = 'regular',
    color = 'primary',
    align = 'left',
    uppercase = false,
    truncate = false,
    children,
    ...rest
}) => (
    <StyledText
        as={as}
        $size={size}
        $weight={weight}
        $color={color}
        $align={align ?? 'left'}
        $uppercase={uppercase}
        $truncate={truncate}
        {...rest}
    >
        {children}
    </StyledText>
);

SimpleTypography.displayName = 'SimpleTypography';

export default SimpleTypography;
