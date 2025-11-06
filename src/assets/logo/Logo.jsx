import React from 'react'
import styled from 'styled-components'

import logo from './ventamax.svg'

const imgSize = {
    xsmall: '1.5rem',
    small: '3rem',
    badge: '3.25rem',
    medium: '5rem',
    large: '6rem',
    xlarge: '10rem',
    xxlarge: '12rem',
}

export const Logo = ({
    size = 'medium',
    customSize,
    className,
    alt = '',
    ...imgProps
}) => {
    const resolvedSize = customSize ?? imgSize[size] ?? imgSize.medium

    return (
        <Img
            src={logo}
            alt={alt}
            className={className}
            $dimension={resolvedSize}
            {...imgProps}
        />
    )
}

const Img = styled.img`
    display: block !important;
    height: ${({ $dimension }) => $dimension} !important;
    width: ${({ $dimension }) => $dimension} !important;
`
