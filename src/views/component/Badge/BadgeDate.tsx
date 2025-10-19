import { DateTime } from 'luxon';
import React, { cloneElement, FC, ReactElement, ReactNode, isValidElement } from 'react';
import styled from 'styled-components';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ConfigItem } from '../../../config/statusActionConfig';

type BadgeDateConfig = ConfigItem;

interface BadgeDateProps {
    dateTime?: DateTime | null;
    config?: BadgeDateConfig | null | undefined;
}

const defaultConfig: BadgeDateConfig = {
    bgColor: '#f5f5f5',
    color: '#666666',
    icon: <FontAwesomeIcon icon={faCalendar} />,
    text: 'Fecha'
};

const BadgeContainer = styled.div<{ bgColor?: string; simple?: boolean }>`
    padding: ${props => props.simple ? '8px 16px' : '1px 8px'};
    border-radius: 6px;
    min-width: 115px;
    background-color: ${props => props.simple ? '#f8f9fa' : props.bgColor || '#E3F2FD'};
    display: ${props => props.simple ? 'flex' : 'inline-block'};
    justify-content: ${props => props.simple ? 'center' : 'initial'};
    align-items: ${props => props.simple ? 'center' : 'initial'};
`;

const DateIconContainer = styled.div<{ simple?: boolean }>`
    display: flex;
    justify-content: ${props => props.simple ? 'center' : 'space-between'};
    align-items: center;
    gap: 4px;
`;

const DateText = styled.span<{ color: string; simple?: boolean }>`
    color: ${props => props.simple ? '#495057' : props.color};
    font-size: ${props => props.simple ? '14px' : '14px'};
`;

const BadgeText = styled.div<{ color: string }>`
    color: ${props => props.color};
    font-size: 12px;
    font-weight: 500;
`;

interface IconProps {
    style?: React.CSSProperties;
}

const renderIcon = (icon: ReactNode, color: string) => {
    if (isValidElement<IconProps>(icon)) {
        return cloneElement(icon, {
            style: { color } as React.CSSProperties
        });
    }
    return icon;
};

export const BadgeDate = ({
    dateTime = DateTime.now(),
    config
}: BadgeDateProps) => {
    const finalConfig = {
        bgColor: config?.bgColor ?? defaultConfig.bgColor,
        color: config?.color ?? defaultConfig.color,
        icon: config?.icon ?? defaultConfig.icon,
        text: config?.text ?? defaultConfig.text
    };

    const formattedDate = dateTime?.isValid
        ? dateTime.toFormat('dd/MM/yyyy')
        : DateTime.now().toFormat('dd/MM/yyyy');

    if (!config) {
        return (
            <BadgeContainer simple>
                <DateText simple color="">
                    {formattedDate}
                </DateText>
            </BadgeContainer>
        );
    }

    return (
        <BadgeContainer bgColor={finalConfig.bgColor}>
            <DateIconContainer>
                <DateText color={finalConfig.color!}>
                    {formattedDate}
                </DateText>
                {renderIcon(finalConfig.icon!, finalConfig.color!)}
            </DateIconContainer>
            <BadgeText color={finalConfig.color!}>
                {finalConfig.text}
            </BadgeText>
        </BadgeContainer>
    );
};
