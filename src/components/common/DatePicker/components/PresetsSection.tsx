import { CloseOutlined } from '@ant-design/icons';
import { ListBox } from '@heroui/react';
import React, { useMemo } from 'react';

import { isPresetActive } from '@/components/common/DatePicker/utils/dateUtils';
import {
  DropdownGroup,
  DropdownItem,
  MobileDrawer,
  MobileDrawerClose,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerOverlay,
  MobileDrawerTitle,
  MobileGroup,
  MobileGroupTitle,
  PresetButton,
  PresetsContainer,
  PresetsDropdown,
  PresetsDropdownContainer,
  PresetsGrid,
  SidebarGroupTitle,
  SidebarListBoxScope,
  SidebarPresetLabel,
} from './PresetsSection.styles';
import type { DatePickerPreset, PresetsSectionProps } from '../types';

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

const DEFAULT_GROUP = 'Rangos rápidos';
const EMPTY_DATE_PICKER_PRESETS: DatePickerPreset[] = [];
const VISIBLE_PRESETS_COUNT = 5;

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
  const normalizedLayout = layout;
  const presetItems = presets;

  const groupedEntries = useMemo<[string, DatePickerPreset[]][]>(() => {
    const sourcePresets =
      normalizedLayout === 'sidebar'
        ? presetItems
        : presetItems.slice(VISIBLE_PRESETS_COUNT);
    const grouped = sourcePresets.reduce<Record<string, DatePickerPreset[]>>(
      (acc, preset) => {
        const group = preset.group || DEFAULT_GROUP;
        if (!acc[group]) acc[group] = [];
        acc[group].push(preset);
        return acc;
      },
      {},
    );
    return Object.entries(grouped);
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
                <SidebarPresetLabel>{item.label}</SidebarPresetLabel>
              </ListBox.Item>
            );
          }}
        </ListBox>
      </SidebarListBoxScope>
    );
  }

  return (
    <PresetsContainer $layout={normalizedLayout}>
      <PresetsGrid>
        {presets.slice(0, VISIBLE_PRESETS_COUNT).map((preset) => {
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
        {presets.length > VISIBLE_PRESETS_COUNT && (
          <>
            <PresetsDropdownContainer ref={presetsDropdownRef}>
              <PresetButton
                $isToggle
                $layout="grid"
                onClick={() => setShowPresetsDropdown?.(!showPresetsDropdown)}
              >
                +{presets.length - VISIBLE_PRESETS_COUNT}
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
