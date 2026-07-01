import React, { useRef } from 'react';
import styled from 'styled-components';

import { VmButton, VmPopover } from '@/components/heroui';

import { CalendarSection } from './components/CalendarSection';
import { DatePickerInput } from './components/DatePickerInput';
import { MobileModal } from './components/MobileModal';
import { PresetsSection } from './components/PresetsSection';
import { createDefaultPresets } from './constants/presets';
import { useDatePicker } from './hooks/useDatePicker';
import { useMobile } from './hooks/useMobile';
import { formatDisplayValue } from './utils/dateUtils';
import type { DatePickerProps, DatePickerPreset } from './types';

// Styled Components
const Container = styled.div`
  position: relative;
  width: 100%;
`;

interface DatePickerContentProps {
  $isMobile?: boolean;
  $calendarOnly?: boolean;
}

interface ActionsSectionProps {
  $isMobile?: boolean;
}

interface DesktopLayoutProps {
  $hasSidebar?: boolean;
}

const DatePickerContent = styled.div<DatePickerContentProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? '14px' : '8px'};
  width: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? '100%' : 'max-content'};
  height: ${({ $isMobile, $calendarOnly }: DatePickerContentProps) =>
    $isMobile || $calendarOnly ? 'auto' : '350px'};
  min-height: 0;
  max-height: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? 'none' : '460px'};
  padding: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? '4px 16px 10px' : '10px 0px'};
`;

const ActionsSection = styled.div<ActionsSectionProps>`
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: ${({ $isMobile }: ActionsSectionProps) =>
    $isMobile ? '12px 16px 14px' : '6px 0 8px'};
  background: white;
  border-top: 1px solid #f0f0f0;
`;

const DesktopLayout = styled.div<DesktopLayoutProps>`
  display: grid;
  grid-template-columns: ${({ $hasSidebar }: DesktopLayoutProps) =>
    $hasSidebar ? 'auto 200px' : 'auto'};
  gap: 8px;
  align-items: stretch;
  height: 100%;
  min-height: 0;
`;

const CalendarPane = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
`;

const SidebarPane = styled.aside`
  display: flex;
  flex: 0 0 200px;
  flex-direction: column;
  width: 200px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
`;

const EMPTY_PRESETS: DatePickerPreset[] = [];

export const DatePicker = ({
  mode = 'single', // 'single' | 'range'
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  format = 'DD/MM/YYYY',
  allowClear = true,
  size = 'middle',
  disabled = false,
  presets = EMPTY_PRESETS,
  showPresets = true,
  className,
  style,
  ...props
}: DatePickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobile();

  const finalPresets: DatePickerPreset[] =
    showPresets
      ? presets.length > 0
        ? presets
        : createDefaultPresets(mode)
      : EMPTY_PRESETS;
  const shouldShowPresets = showPresets && finalPresets.length > 0;

  const {
    open,
    setOpen,
    currentDate,
    hoverDate,
    setHoverDate,
    showPresetsDropdown,
    setShowPresetsDropdown,
    presetsDropdownRef,
    handlePresetClick,
    handleClear,
    handleDateClick,
    navigateMonth,
    getCurrentRangeStart,
    getCurrentRangeEnd,
  } = useDatePicker({
    mode,
    value: value ?? null,
    onChange,
    presets: finalPresets,
  });

  const currentRangeStart = getCurrentRangeStart();
  const currentRangeEnd = getCurrentRangeEnd();

  const inputValue = formatDisplayValue(value ?? null, format, mode);
  const hasValue = inputValue !== '';

  const mobileContent = (
    <DatePickerContent $isMobile>
      <CalendarSection
        currentDate={currentDate}
        onNavigateMonth={navigateMonth}
        onDateClick={handleDateClick}
        onDateHover={setHoverDate}
        value={value}
        mode={mode}
        currentRangeStart={currentRangeStart}
        currentRangeEnd={currentRangeEnd}
        hoverDate={hoverDate}
        isMobile={isMobile}
      />

      {shouldShowPresets ? (
        <PresetsSection
          presets={finalPresets}
          value={value}
          mode={mode}
          isMobile={isMobile}
          onPresetClick={(preset) => handlePresetClick(preset, isMobile)}
          showPresetsDropdown={showPresetsDropdown}
          setShowPresetsDropdown={setShowPresetsDropdown}
          presetsDropdownRef={presetsDropdownRef}
        />
      ) : null}
    </DatePickerContent>
  );

  const desktopContent = (
    <DatePickerContent $calendarOnly={!shouldShowPresets}>
      <DesktopLayout $hasSidebar={shouldShowPresets}>
        <CalendarPane>
          <CalendarSection
            currentDate={currentDate}
            onNavigateMonth={navigateMonth}
            onDateClick={handleDateClick}
            onDateHover={setHoverDate}
            value={value}
            mode={mode}
            currentRangeStart={currentRangeStart}
            currentRangeEnd={currentRangeEnd}
            hoverDate={hoverDate}
          />
        </CalendarPane>

        {shouldShowPresets ? (
          <SidebarPane>
            <PresetsSection
              layout="sidebar"
              presets={finalPresets}
              value={value}
              mode={mode}
              isMobile={isMobile}
              onPresetClick={(preset) => handlePresetClick(preset, isMobile)}
            />
          </SidebarPane>
        ) : null}
      </DesktopLayout>

      {allowClear && (
        <ActionsSection>
          <VmButton
            size="sm"
            variant="tertiary"
            onPress={() => handleClear(null, finalPresets)}
          >
            Limpiar
          </VmButton>
        </ActionsSection>
      )}
    </DatePickerContent>
  );

  if (isMobile) {
    return (
      <Container ref={containerRef} className={className} style={style}>
        <DatePickerInput
          value={inputValue}
          placeholder={placeholder}
          size={size}
          disabled={disabled}
          allowClear={allowClear}
          hasValue={hasValue}
          onClear={(e) => {
            e.stopPropagation();
            handleClear(e, finalPresets);
          }}
          onClick={() => !disabled && setOpen(true)}
          {...props}
        />

        <MobileModal
          open={open}
          onClose={() => setOpen(false)}
          title={
            mode === 'range'
              ? 'Seleccionar rango de fechas'
              : 'Seleccionar fecha'
          }
        >
          {mobileContent}
          <ActionsSection $isMobile={isMobile}>
            {allowClear && (
              <VmButton
                size="sm"
                variant="tertiary"
                onPress={() => handleClear(null, finalPresets)}
              >
                Limpiar
              </VmButton>
            )}
          </ActionsSection>
        </MobileModal>
      </Container>
    );
  }

  return (
    <Container ref={containerRef} className={className} style={style}>
      <VmPopover.Root
        isOpen={open}
        onOpenChange={(v) => !disabled && setOpen(v)}
      >
        <VmPopover.Trigger>
          <DatePickerInput
            value={inputValue}
            placeholder={placeholder}
            size={size}
            disabled={disabled}
            allowClear={allowClear}
            hasValue={hasValue}
            onClear={(e) => {
              e.stopPropagation();
              handleClear(e, finalPresets);
            }}
            onClick={undefined}
            {...props}
          />
        </VmPopover.Trigger>
        <VmPopover.Content placement="bottom start" className="overflow-hidden">
          {desktopContent}
        </VmPopover.Content>
      </VmPopover.Root>
    </Container>
  );
};
