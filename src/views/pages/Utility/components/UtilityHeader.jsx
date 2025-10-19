import React from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { designSystemV2 } from '../../../../theme/designSystemV2';

const { colors, spacing, radii, shadows, typography, transitions } = designSystemV2;

export const UtilityHeader = ({
    rangeLabel,
    selectedPreset,
    quickRanges,
    onPresetSelect,
}) => {
    return (
        <Header>
            <TitleGroup>
                <SimpleTypography as="h2" size="large" weight="bold">
                    Utilidad y desempeño
                </SimpleTypography>
                <SimpleTypography size="medium" color="secondary">
                    Visualiza tus ventas, costos, impuestos y resultado neto en el rango seleccionado.
                </SimpleTypography>
                {rangeLabel && (
                    <SimpleTypography size="small" color="secondary">
                        Rango seleccionado: {rangeLabel}
                    </SimpleTypography>
                )}
            </TitleGroup>

            <Filters>
                <QuickRangeGroup>
                    {quickRanges.map((option) => (
                        <QuickRangeButton
                            key={option.key}
                            type="button"
                            onClick={() => onPresetSelect(option.key)}
                            className={selectedPreset === option.key ? 'active' : undefined}
                        >
                            {option.label}
                        </QuickRangeButton>
                    ))}
                </QuickRangeGroup>
            </Filters>
        </Header>
    );
};

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${spacing.lg};
    flex-wrap: wrap;
`;

const TitleGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xs};
`;

const Filters = styled.div`
    display: flex;
    gap: ${spacing.md};
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
`;

const QuickRangeGroup = styled.div`
    display: inline-flex;
    background: ${colors.background.surface};
    border-radius: ${radii.md};
    padding: ${spacing.xs};
    box-shadow: ${shadows.sm};
    border: 1px solid ${colors.stroke.soft};
`;

const QuickRangeButton = styled.button`
    border: none;
    background: transparent;
    padding: ${spacing.sm} ${spacing.lg};
    border-radius: ${radii.md};
    font-size: ${typography.button.fontSize};
    line-height: ${typography.button.lineHeight};
    font-weight: ${typography.button.fontWeight};
    color: ${colors.text.secondary};
    cursor: pointer;
    transition: ${transitions.base};

    &:hover {
        background: ${colors.brand.subtle};
    }

    &.active {
        background: ${colors.brand.primary};
        color: ${colors.text.inverse};
        box-shadow: ${shadows.md};
    }

    &:focus-visible {
        outline: none;
        box-shadow: ${shadows.sm}, 0 0 0 3px ${colors.brand.subtle};
    }
`;
