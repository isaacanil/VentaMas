import { CloseOutlined } from '@ant-design/icons';
import { Label, ListBox } from '@heroui/react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { isPresetActive } from '@/components/common/DatePicker/utils/dateUtils';
import type { DatePickerPreset, PresetsSectionProps } from '../types';

type PresetLayout = 'grid' | 'sidebar';

type SidebarPresetItem =
  | {
      id: string;
      kind: 'header';
      label: string;
    }
  | {
      id: string;
      isActive: boolean;
      kind: 'preset';
      label: string;
      preset: DatePickerPreset;
    };

type SidebarPresetOption = Extract<SidebarPresetItem, { kind: 'preset' }>;

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
  padding: ${({ $layout }: PresetsContainerProps) =>
    $layout === 'sidebar' ? '12px 2px 12px 12px' : '12px'};
  padding-bottom: ${({ $layout }: PresetsContainerProps) =>
    $layout === 'sidebar' ? '0' : '12px'};

  /* border-bottom: ${({ $layout }: PresetsContainerProps) =>
    $layout === 'sidebar' ? 'none' : '1px solid #f0f0f0'}; */
  height: ${({ $layout }: PresetsContainerProps) =>
    $layout === 'sidebar' ? '100%' : 'auto'};
`;

const PresetsGrid = styled.div<PresetsGridProps>`
  display: grid;
  grid-template-columns: ${({ $isMobile }: PresetsGridProps) =>
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
  background: ${({ $active }: DropdownItemProps) =>
    $active ? '#e6f7ff' : 'white'};
  color: ${({ $active }: DropdownItemProps) =>
    $active ? '#1890ff' : '#374151'};
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }: DropdownItemProps) =>
      $active ? '#bae7ff' : '#f5f5f5'};
    color: ${({ $active }: DropdownItemProps) =>
      $active ? '#1890ff' : '#1d4ed8'};
  }
`;

const PresetButton = styled.button<PresetButtonProps>`
  width: ${({ $layout }: PresetButtonProps) =>
    $layout === 'sidebar' ? '100%' : 'auto'};
  text-align: ${({ $layout }: PresetButtonProps) =>
    $layout === 'sidebar' ? 'left' : 'center'};
  justify-content: ${({ $layout }: PresetButtonProps) =>
    $layout === 'sidebar' ? 'flex-start' : 'center'};
  display: flex;
  align-items: center;
  gap: ${({ $layout }: PresetButtonProps) =>
    $layout === 'sidebar' ? '10px' : '0'};
  padding: 10px 16px;
  border: 1px solid
    ${({ $active, $isToggle }: PresetButtonProps) => {
      if ($isToggle) return '#bfbfbf';
      return $active ? '#1890ff' : '#d9d9d9';
    }};
  border-width: ${({ $isToggle }: PresetButtonProps) =>
    $isToggle ? '2px' : '1px'};
  border-radius: 4px;
  background: ${({ $active, $isToggle }: PresetButtonProps) => {
    if ($isToggle) return '#f5f5f5';
    return $active ? '#1890ff' : 'white';
  }};
  color: ${({ $active, $isToggle }: PresetButtonProps) => {
    if ($isToggle) return '#6b7280';
    return $active ? 'white' : '#374151';
  }};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;

  &:hover {
    border-color: ${({ $isToggle }: PresetButtonProps) =>
      $isToggle ? '#8a8a8a' : '#1890ff'};
    color: ${({ $active, $isToggle }: PresetButtonProps) => {
      if ($isToggle) return '#374151';
      return $active ? 'white' : '#1890ff';
    }};
    background: ${({ $active, $isToggle }: PresetButtonProps) => {
      if ($isToggle) return '#f1f5f9';
      return $active ? '#1890ff' : 'white';
    }};
  }

  &:active {
    transform: translateY(1px);
  }
`;

const SidebarListBoxScope = styled.div`
  height: 100%;
  min-height: 0;

  .vm-date-picker-presets-listbox {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 10px 12px;
  }

  .vm-date-picker-presets-item,
  .vm-date-picker-presets-header-item {
    padding: 0;
    min-height: auto;
    background: transparent;
  }

  .vm-date-picker-presets-item {
    display: flex;
    align-items: center;
    border-radius: 6px;
    color: #374151;
  }

  .vm-date-picker-presets-item[data-active='true'] {
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 600;
  }

  .vm-date-picker-presets-item[data-hovered],
  .vm-date-picker-presets-item[data-focused] {
    background: #f5f7fb;
    color: #1d4ed8;
  }

  .vm-date-picker-presets-item[data-active='true'][data-hovered],
  .vm-date-picker-presets-item[data-active='true'][data-focused] {
    background: #bae7ff;
    color: #1890ff;
  }

  .vm-date-picker-presets-header-item[data-disabled] {
    background: transparent;
  }

  .vm-date-picker-presets-item[data-focus-visible] {
    box-shadow: 0 0 0 2px rgb(24 144 255 / 18%);
  }
`;

const SidebarGroupTitle = styled.span`
  display: block;
  padding: 8px 4px 4px;
  color: var(--ds-color-text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--ds-letter-spacing-wide);
  line-height: 1.2;
  text-transform: uppercase;
`;

const SidebarPresetLabel = styled(Label)`
  display: block;
  width: 100%;
  padding: 7px 10px;
  color: inherit;
  font-size: 14px;
  font-weight: inherit;
  line-height: 1.25;
  cursor: pointer;

  .vm-date-picker-presets-item[data-pressed] & {
    transform: translateY(1px);
  }
`;

const DEFAULT_GROUP = 'Rangos rápidos';
const EMPTY_DATE_PICKER_PRESETS: DatePickerPreset[] = [];

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
  presets = EMPTY_DATE_PICKER_PRESETS,
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

  const selectedKey = useMemo(() => {
    const active = presetItems.find((p) => isPresetActive(value, p, mode));
    return active ? active.label : null;
  }, [presetItems, value, mode]);

  const sidebarPresetItems = useMemo<SidebarPresetItem[]>(() => {
    return groupedEntries.flatMap(([groupName, items]) => {
      const presetOptions = items.map<SidebarPresetItem>((preset) => ({
        id: `${groupName}:${preset.label}`,
        isActive: preset.label === selectedKey,
        kind: 'preset',
        label: preset.label,
        preset,
      }));

      if (groupedEntries.length <= 1) {
        return presetOptions;
      }

      return [
        {
          id: `header:${groupName}`,
          kind: 'header',
          label: groupName,
        },
        ...presetOptions,
      ];
    });
  }, [groupedEntries, selectedKey]);

  const sidebarPresetById = useMemo(() => {
    return new Map(
      sidebarPresetItems
        .filter((item): item is SidebarPresetOption => item.kind === 'preset')
        .map((item) => [item.id, item]),
    );
  }, [sidebarPresetItems]);

  if (normalizedLayout === 'sidebar') {
    return (
      <SidebarListBoxScope>
        <ListBox
          aria-label="Rangos de fecha"
          selectionMode="none"
          items={sidebarPresetItems}
          onAction={(key) => {
            const selectedItem = sidebarPresetById.get(String(key));
            if (!selectedItem || selectedItem.isActive) return;
            onPresetClick?.(selectedItem.preset);
          }}
          className="vm-date-picker-presets-listbox"
        >
          {(item) => {
            if (item.kind === 'header') {
              return (
                <ListBox.Item
                  id={item.id}
                  textValue={item.label}
                  isDisabled
                  className="vm-date-picker-presets-header-item"
                >
                  <SidebarGroupTitle>{item.label}</SidebarGroupTitle>
                </ListBox.Item>
              );
            }

            return (
              <ListBox.Item
                id={item.id}
                textValue={item.label}
                data-active={item.isActive ? 'true' : undefined}
                className="vm-date-picker-presets-item"
              >
                <SidebarPresetLabel>
                  {item.label}
                </SidebarPresetLabel>
              </ListBox.Item>
            );
          }}
        </ListBox>
      </SidebarListBoxScope>
    );
  }

  return (
    <PresetsContainer $layout={normalizedLayout}>
      <PresetsGrid $isMobile={isMobile}>
        {presets.slice(0, 5).map((preset) => {
          const isActive = isPresetActive(value, preset, mode);
          return (
            <PresetButton
              key={preset.label}
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
                      {items.map((preset) => {
                        const isActive = isPresetActive(value, preset, mode);
                        return (
                          <DropdownItem
                            key={`${groupName}-${preset.label}`}
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
                <MobileDrawer
                  onClick={(event: React.MouseEvent) => event.stopPropagation()}
                >
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
                        {items.map((preset) => {
                          const isActive = isPresetActive(value, preset, mode);
                          return (
                            <PresetButton
                              key={`${groupName}-${preset.label}`}
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
