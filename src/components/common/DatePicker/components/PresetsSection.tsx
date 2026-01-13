import { CloseOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { isPresetActive } from '@/components/common/DatePicker/utils/dateUtils';
import type { DatePickerPreset, PresetsSectionProps } from '../types';

type PresetLayout = 'grid' | 'sidebar';

interface PresetsContainerProps {
  $layout: PresetLayout;
}

interface PresetsGridProps {
  $isMobile?: boolean;
}

interface DropdownItemProps {
  $active?: boolean;
}

interface PresetButtonProps {
  $layout: PresetLayout;
  $active?: boolean;
  $isToggle?: boolean;
}

const PresetsContainer = styled.div<PresetsContainerProps>`
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: ${({ $layout }) =>
    $layout === 'sidebar' ? '12px 2px 12px 12px' : '12px'};
  padding-bottom: ${({ $layout }) => ($layout === 'sidebar' ? '0' : '12px')};

  /* border-bottom: ${({ $layout }) =>
    $layout === 'sidebar' ? 'none' : '1px solid #f0f0f0'}; */
  height: ${({ $layout }) => ($layout === 'sidebar' ? '100%' : 'auto')};
`;

const PresetsGrid = styled.div<PresetsGridProps>`
  display: grid;
  grid-template-columns: ${({ $isMobile }) =>
    $isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)'};
  gap: 12px;
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
  box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
  z-index: 1000;
  margin-top: 6px;
  max-height: 240px;
  overflow-y: auto;
  animation: dropdown-slide 0.2s ease-out;

  @media (width <= 480px) {
    left: 0;
    right: auto;
    width: 100%;
    max-width: none;
  }

  @keyframes dropdown-slide {
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

const DropdownItem = styled.button<DropdownItemProps>`
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: ${({ $active }) => ($active ? '#e6f7ff' : 'white')};
  color: ${({ $active }) => ($active ? '#1890ff' : '#374151')};
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => ($active ? '#bae7ff' : '#f5f5f5')};
    color: ${({ $active }) => ($active ? '#1890ff' : '#1d4ed8')};
  }
`;

const PresetButton = styled.button<PresetButtonProps>`
  width: ${({ $layout }) => ($layout === 'sidebar' ? '100%' : 'auto')};
  text-align: ${({ $layout }) => ($layout === 'sidebar' ? 'left' : 'center')};
  justify-content: ${({ $layout }) =>
    $layout === 'sidebar' ? 'flex-start' : 'center'};
  display: flex;
  align-items: center;
  gap: ${({ $layout }) => ($layout === 'sidebar' ? '10px' : '0')};
  padding: 10px 16px;
  border: 1px solid
    ${({ $active, $isToggle }) => {
    if ($isToggle) return '#bfbfbf';
    return $active ? '#1890ff' : '#d9d9d9';
  }};
  border-width: ${({ $isToggle }) => ($isToggle ? '2px' : '1px')};
  border-radius: 4px;
  background: ${({ $active, $isToggle }) => {
    if ($isToggle) return '#f5f5f5';
    return $active ? '#1890ff' : 'white';
  }};
  color: ${({ $active, $isToggle }) => {
    if ($isToggle) return '#6b7280';
    return $active ? 'white' : '#374151';
  }};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;

  &:hover {
    border-color: ${({ $isToggle }) => ($isToggle ? '#8a8a8a' : '#1890ff')};
    color: ${({ $active, $isToggle }) => {
    if ($isToggle) return '#374151';
    return $active ? 'white' : '#1890ff';
  }};
    background: ${({ $active, $isToggle }) => {
    if ($isToggle) return '#f1f5f9';
    return $active ? '#1890ff' : 'white';
  }};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const SidebarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  flex: 1;
  min-height: 0;
`;

const SidebarScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  max-height: 100%;
`;

const SidebarGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SidebarGroupTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DEFAULT_GROUP = 'Rangos rápidos';

const MobileDrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 55%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1400;
`;

const MobileDrawer = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  animation: slide-up 0.28s ease-out;

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }

    to {
      transform: translateY(0);
    }
  }
`;

const MobileDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
`;

const MobileDrawerTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

const MobileDrawerClose = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;

  &:hover {
    background: #e2e8f0;
    color: #1f2937;
  }
`;

const MobileDrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MobileGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MobileGroupTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const PresetsSection = ({
  presets = [],
  value,
  mode,
  isMobile,
  onPresetClick,
  showPresetsDropdown = false,
  setShowPresetsDropdown,
  presetsDropdownRef,
  layout = 'grid',
}: PresetsSectionProps) => {
  const normalizedLayout: PresetLayout =
    layout === 'sidebar' ? 'sidebar' : 'grid';
  const presetItems = presets as DatePickerPreset[];

  const groupedEntries = useMemo<[string, DatePickerPreset[]][]>(() => {
    const sourcePresets =
      normalizedLayout === 'sidebar' ? presetItems : presetItems.slice(5);
    const grouped = sourcePresets.reduce<Record<string, DatePickerPreset[]>>(
      (acc, preset) => {
        const group = preset.group || DEFAULT_GROUP;
        if (!acc[group]) acc[group] = [];
        acc[group].push(preset);
        return acc;
      },
      {},
    );
    return Object.entries(grouped) as [string, DatePickerPreset[]][];
  }, [presetItems, normalizedLayout]);

  if (normalizedLayout === 'sidebar') {
    return (
      <PresetsContainer $layout={normalizedLayout}>
        <SidebarWrapper>
          <SidebarScroll>
            {groupedEntries.map(([groupName, items]) => (
              <SidebarGroup key={groupName}>
                {groupedEntries.length > 1 && (
                  <SidebarGroupTitle>{groupName}</SidebarGroupTitle>
                )}
                {items.map((preset, index) => {
                  const isActive = isPresetActive(value, preset, mode);
                  return (
                    <PresetButton
                      key={`${groupName}-${index}`}
                      $active={isActive}
                      $layout="sidebar"
                      onClick={() => onPresetClick?.(preset)}
                    >
                      {preset.label}
                    </PresetButton>
                  );
                })}
              </SidebarGroup>
            ))}
          </SidebarScroll>
        </SidebarWrapper>
      </PresetsContainer>
    );
  }

  return (
    <PresetsContainer $layout={normalizedLayout}>
      <PresetsGrid $isMobile={isMobile}>
        {presets.slice(0, 5).map((preset, index) => {
          const isActive = isPresetActive(value, preset, mode);
          return (
            <PresetButton
              key={index}
              $active={isActive}
              $layout="grid"
              onClick={() => onPresetClick?.(preset)}
            >
              {preset.label}
            </PresetButton>
          );
        })}
        {presets.length > 5 && (
          <>
            <PresetsDropdownContainer ref={presetsDropdownRef}>
              <PresetButton
                $isToggle
                $layout="grid"
                onClick={() => setShowPresetsDropdown?.(!showPresetsDropdown)}
              >
                +{presets.length - 5}
              </PresetButton>
              {!isMobile && showPresetsDropdown && (
                <PresetsDropdown>
                  {groupedEntries.map(([groupName, items]) => (
                    <div key={groupName}>
                      <DropdownGroup>{groupName}</DropdownGroup>
                      {items.map((preset, index) => {
                        const isActive = isPresetActive(value, preset, mode);
                        return (
                          <DropdownItem
                            key={`${groupName}-${index}`}
                            $active={isActive}
                            onClick={() => {
                              onPresetClick?.(preset);
                              setShowPresetsDropdown?.(false);
                            }}
                          >
                            {preset.label}
                          </DropdownItem>
                        );
                      })}
                    </div>
                  ))}
                </PresetsDropdown>
              )}
            </PresetsDropdownContainer>
            {isMobile && showPresetsDropdown && (
              <MobileDrawerOverlay
                onClick={() => setShowPresetsDropdown?.(false)}
              >
                <MobileDrawer onClick={(event) => event.stopPropagation()}>
                  <MobileDrawerHeader>
                    <MobileDrawerTitle>Más rangos</MobileDrawerTitle>
                    <MobileDrawerClose
                      onClick={() => setShowPresetsDropdown?.(false)}
                    >
                      <CloseOutlined />
                    </MobileDrawerClose>
                  </MobileDrawerHeader>
                  <MobileDrawerContent>
                    {groupedEntries.map(([groupName, items]) => (
                      <MobileGroup key={groupName}>
                        {groupedEntries.length > 1 && (
                          <MobileGroupTitle>{groupName}</MobileGroupTitle>
                        )}
                        {items.map((preset, index) => {
                          const isActive = isPresetActive(value, preset, mode);
                          return (
                            <PresetButton
                              key={`${groupName}-${index}`}
                              $active={isActive}
                              $layout="sidebar"
                              onClick={() => {
                                onPresetClick?.(preset);
                                setShowPresetsDropdown?.(false);
                              }}
                            >
                              {preset.label}
                            </PresetButton>
                          );
                        })}
                      </MobileGroup>
                    ))}
                  </MobileDrawerContent>
                </MobileDrawer>
              </MobileDrawerOverlay>
            )}
          </>
        )}
      </PresetsGrid>
    </PresetsContainer>
  );
};
