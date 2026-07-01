import { useMemo, useState } from 'react';

import { isPresetActive } from '@/components/common/DatePicker/utils/dateUtils';
import { VmListBox } from '@/components/heroui';
import {
  DropdownGroup,
  DropdownItem,
  MobilePresetGrid,
  MobilePresetTabs,
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
const MOBILE_GROUP_LABELS: Record<string, string> = {
  [DEFAULT_GROUP]: 'Rápidos',
  'Periodos recientes': 'Recientes',
  'Periodos pasados': 'Pasados',
  Trimestres: 'Trimestres',
};

const getMobileGroupLabel = (groupName: string): string =>
  MOBILE_GROUP_LABELS[groupName] || groupName;

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
  const [selectedMobileGroup, setSelectedMobileGroup] = useState<string | null>(
    null,
  );

  const groupedEntries = useMemo<[string, DatePickerPreset[]][]>(() => {
    const sourcePresets =
      isMobile || normalizedLayout === 'sidebar'
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
  }, [presetItems, normalizedLayout, isMobile]);

  const selectedKey = useMemo(() => {
    const active = presetItems.find((p) => isPresetActive(value, p, mode));
    return active ? active.label : null;
  }, [presetItems, value, mode]);

  const activeMobileGroup =
    presetItems.find((preset) => preset.label === selectedKey)?.group ||
    DEFAULT_GROUP;
  const mobileSelectedKey =
    selectedMobileGroup ||
    groupedEntries.find(([groupName]) => groupName === activeMobileGroup)?.[0] ||
    groupedEntries[0]?.[0] ||
    DEFAULT_GROUP;

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
        <VmListBox
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
                <VmListBox.Item
                  id={item.id}
                  textValue={item.label}
                  isDisabled
                  className="vm-date-picker-presets-header-item"
                >
                  <SidebarGroupTitle>{item.label}</SidebarGroupTitle>
                </VmListBox.Item>
              );
            }

            return (
              <VmListBox.Item
                id={item.id}
                textValue={item.label}
                data-active={item.isActive ? 'true' : undefined}
                className="vm-date-picker-presets-item"
              >
                <SidebarPresetLabel>{item.label}</SidebarPresetLabel>
              </VmListBox.Item>
            );
          }}
        </VmListBox>
      </SidebarListBoxScope>
    );
  }

  const visiblePresets = isMobile
    ? presets
    : presets.slice(0, VISIBLE_PRESETS_COUNT);
  const shouldShowOverflowPresets =
    !isMobile && presets.length > VISIBLE_PRESETS_COUNT;

  if (isMobile) {
    return (
      <PresetsContainer $isMobile $layout={normalizedLayout}>
        <MobilePresetTabs
          selectedKey={mobileSelectedKey}
          onSelectionChange={(key) => setSelectedMobileGroup(String(key))}
        >
          <MobilePresetTabs.ListContainer>
            <MobilePresetTabs.List aria-label="Rangos rápidos de fecha">
              {groupedEntries.map(([groupName]) => (
                <MobilePresetTabs.Tab id={groupName} key={groupName}>
                  <MobilePresetTabs.Indicator />
                  {getMobileGroupLabel(groupName)}
                </MobilePresetTabs.Tab>
              ))}
            </MobilePresetTabs.List>
          </MobilePresetTabs.ListContainer>

          {groupedEntries.map(([groupName, items]) => (
            <MobilePresetTabs.Panel id={groupName} key={groupName}>
              <MobilePresetGrid>
                {items.map((preset) => {
                  const isActive = isPresetActive(value, preset, mode);
                  return (
                    <PresetButton
                      key={`${groupName}-${preset.label}`}
                      $active={isActive}
                      $isMobile
                      $layout="grid"
                      onClick={() => onPresetClick?.(preset)}
                    >
                      {preset.label}
                    </PresetButton>
                  );
                })}
              </MobilePresetGrid>
            </MobilePresetTabs.Panel>
          ))}
        </MobilePresetTabs>
      </PresetsContainer>
    );
  }

  return (
    <PresetsContainer $isMobile={isMobile} $layout={normalizedLayout}>
      <PresetsGrid $isMobile={isMobile}>
        {visiblePresets.map((preset) => {
          const isActive = isPresetActive(value, preset, mode);
          return (
            <PresetButton
              key={preset.label}
              $active={isActive}
              $isMobile={isMobile}
              $layout="grid"
              onClick={() => onPresetClick?.(preset)}
            >
              {preset.label}
            </PresetButton>
          );
        })}
        {shouldShowOverflowPresets && (
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
          </>
        )}
      </PresetsGrid>
    </PresetsContainer>
  );
};
