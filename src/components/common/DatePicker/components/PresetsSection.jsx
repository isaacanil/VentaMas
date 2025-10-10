import React from 'react';
import styled from 'styled-components';

import { isPresetActive } from '../utils/dateUtils';

const PresetsContainer = styled.div`
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
`;

const PresetsGrid = styled.div`
    display: grid;
    grid-template-columns: ${props => 
        props.$isMobile 
            ? 'repeat(3, 1fr)' 
            : 'repeat(3, 1fr)'
    };
    gap: 8px;
    
    // @media (max-width: 480px) {
    //     grid-template-columns: 1fr;
    // }
`;

const PresetsDropdownContainer = styled.div`
    position: relative;
`;

const DropdownGroup = styled.div`
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 600;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    
    &:first-child {
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
    }
`;

const PresetsDropdown = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 200px;
    width: max-content;
    max-width: 300px;
    background: white;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    z-index: 1000;
    margin-top: 6px;
    max-height: 240px;
    overflow-y: auto;
    animation: dropdownSlide 0.2s ease-out;

    @media (max-width: 480px) {
        left: 0;
        right: auto;
        width: 100%;
        max-width: none;
    }

    @keyframes dropdownSlide {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const DropdownItem = styled.button`
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: ${({ $active }) => ($active ? '#e6f7ff' : 'white')};
    color: ${({ $active }) => ($active ? '#1890ff' : '#595959')};
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    
    &:hover {
        background: ${({ $active }) => ($active ? '#bae7ff' : '#f5f5f5')};
        color: ${({ $active }) => ($active ? '#1890ff' : '#1890ff')};
    }
`;

const PresetButton = styled.button`
    padding: 6px 12px;
    border: 1px solid ${({ $active, $isToggle }) => {
        if ($isToggle) return '#bfbfbf';
        return $active ? '#1890ff' : '#d9d9d9';
    }};
    border-width: ${({ $isToggle }) => $isToggle ? '2px' : '1px'};
    border-radius: 4px;
    background: ${({ $active, $isToggle }) => {
        if ($isToggle) return '#f5f5f5';
        return $active ? '#1890ff' : 'white';
    }};
    color: ${({ $active, $isToggle }) => {
        if ($isToggle) return '#8c8c8c';
        return $active ? 'white' : '#595959';
    }};
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: ${({ $isToggle }) => $isToggle ? '500' : '400'};
    
    &:hover {
        border-color: ${({ $isToggle }) => $isToggle ? '#999999' : '#1890ff'};
        color: ${({ $active, $isToggle }) => {
            if ($isToggle) return '#666666';
            return $active ? 'white' : '#1890ff';
        }};
        background: ${({ $active, $isToggle }) => {
            if ($isToggle) return '#eeeeee';
            return $active ? '#1890ff' : 'white';
        }};
    }
    
    &:active {
        transform: translateY(1px);
    }
`;

export const PresetsSection = ({
    presets,
    value,
    mode,
    isMobile,
    onPresetClick,
    showPresetsDropdown,
    setShowPresetsDropdown,
    presetsDropdownRef
}) => {
    return (
        <PresetsContainer>
            <PresetsGrid $isMobile={isMobile}>
                {presets.slice(0, 5).map((preset, index) => {
                    const isActive = isPresetActive(value, preset, mode);
                    return (
                        <PresetButton
                            key={index}
                            $active={isActive}
                            onClick={() => onPresetClick(preset)}
                        >
                            {preset.label}
                        </PresetButton>
                    );
                })}
                {presets.length > 5 && (
                    <PresetsDropdownContainer ref={presetsDropdownRef}>
                        <PresetButton
                            $isToggle
                            onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                        >
                            +{presets.length - 5}
                        </PresetButton>
                        {showPresetsDropdown && (
                            <PresetsDropdown>
                                {(() => {
                                    const dropdownPresets = presets.slice(5);
                                    const groupedPresets = dropdownPresets.reduce((acc, preset) => {
                                        const group = preset.group || 'Otros';
                                        if (!acc[group]) acc[group] = [];
                                        acc[group].push(preset);
                                        return acc;
                                    }, {});

                                    return Object.entries(groupedPresets).map(([groupName, presets]) => (
                                        <div key={groupName}>
                                            <DropdownGroup>{groupName}</DropdownGroup>
                                            {presets.map((preset, index) => {
                                                const isActive = isPresetActive(value, preset, mode);
                                                return (
                                                    <DropdownItem
                                                        key={`${groupName}-${index}`}
                                                        $active={isActive}
                                                        onClick={() => {
                                                            onPresetClick(preset);
                                                            setShowPresetsDropdown(false);
                                                        }}
                                                    >
                                                        {preset.label}
                                                    </DropdownItem>
                                                );
                                            })}
                                        </div>
                                    ));
                                })()}
                            </PresetsDropdown>
                        )}
                    </PresetsDropdownContainer>
                )}
            </PresetsGrid>
        </PresetsContainer>
    );
}; 