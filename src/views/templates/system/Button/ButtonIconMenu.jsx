import { Tooltip } from 'antd'
import React from 'react'
import styled, { css } from 'styled-components'

export const ButtonIconMenu = ({
    icon,
    onClick,
    tooltip,
    tooltipDescription,
    tooltipPlacement = 'top',
    indicator = false,
    ...rest
}) => {
    const label = tooltip || tooltipDescription;
    const placementMap = {
        'bottom-end': 'bottomRight',
        'bottom-start': 'bottomLeft',
        'top-end': 'topRight',
        'top-start': 'topLeft'
    };
    const antdPlacement = placementMap[tooltipPlacement] || tooltipPlacement;

    const Btn = (
        <Container
            onClick={onClick}
            aria-label={label}
            $indicator={indicator}
            {...rest}
        >
            {icon}
        </Container>
    );

    return label ? (
        <Tooltip title={label} placement={antdPlacement}>
            {Btn}
        </Tooltip>
    ) : Btn;
}
const Container = styled.button`
    border: none;
    color: white;
    width: 2em;
    height: 2em;
    padding: 0;
    display: grid;
    justify-items: center;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    background-color: rgba(0, 0, 0, 0.2);
    cursor: pointer;
    position: relative;

    // Adaptación responsive para móviles
    @media (max-width: 768px) {
        width: 2.3em;
        height: 2.3em;
    }
    
    ${({ $indicator }) => $indicator && css`
        &::after {
            content: '';
            position: absolute;
            top: 0px;
            right: 0px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #f6573bff;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
        }
    `}
    
    svg {
        font-size: 1.2em;
        
        // Iconos más grandes en móviles
        @media (max-width: 768px) {
            font-size: 1.4em;
        }
    }
`
