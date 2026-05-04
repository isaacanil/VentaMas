import { Button } from '@heroui/react';
import { Popover } from 'antd';
import React, { useRef } from 'react';
import styled from 'styled-components';

import { CalendarSection } from './components/CalendarSection';
import { HeroUIDatePickerInput } from './components/HeroUIDatePickerInput';
import { MobileModal } from './components/MobileModal';
import { PresetsSection } from './components/PresetsSection';
import { createDefaultPresets } from './constants/presets';
import { useDatePicker } from './hooks/useDatePicker';
import { useMobile } from './hooks/useMobile';
import { formatDisplayValue } from './utils/dateUtils';
import type { DatePickerPreset, DatePickerProps } from './types';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const DatePickerContent = styled.div<{ $isMobile?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: ${({ $isMobile }) => ($isMobile ? 'auto' : '540px')};
  max-width: ${({ $isMobile }) => ($isMobile ? '100%' : '680px')};
  height: ${({ $isMobile }) => ($isMobile ? 'auto' : '350px')};
  min-height: 0;
  max-height: ${({ $isMobile }) => ($isMobile ? 'none' : '460px')};
  padding: ${({ $isMobile }) => ($isMobile ? '1em' : '10px 0')};
`;

const ActionsSection = styled.div<{ $isMobile?: boolean }>`
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  gap: 8px;
  padding: ${({ $isMobile }) => ($isMobile ? '1em' : '0')};
  border-top: 1px solid var(--ds-color-border-subtle);
  background: var(--ds-color-bg-surface);
`;

const DesktopLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
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
  flex: 0 0 220px;
  flex-direction: column;
  width: 220px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
`;

const EMPTY_PRESETS: DatePickerPreset[] = [];

export const HeroUIDatePicker = ({
  mode = 'single',
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  format = 'DD/MM/YYYY',
  allowClear = true,
  size = 'middle',
  disabled = false,
  presets = EMPTY_PRESETS,
  className,
  style,
  ...props
}: DatePickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobile();
  const finalPresets =
    presets.length > 0 ? presets : createDefaultPresets(mode);

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
    </DatePickerContent>
  );

  const desktopContent = (
    <DatePickerContent>
      <DesktopLayout>
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
      </DesktopLayout>

      {allowClear ? (
        <ActionsSection>
          <Button
            fullWidth
            variant="tertiary"
            onPress={() => handleClear(null, finalPresets)}
          >
            Limpiar
          </Button>
        </ActionsSection>
      ) : null}
    </DatePickerContent>
  );

  if (isMobile) {
    return (
      <Container ref={containerRef} className={className} style={style}>
        <HeroUIDatePickerInput
          value={inputValue}
          placeholder={placeholder}
       
          disabled={disabled}
          allowClear={allowClear}
          hasValue={hasValue}
          onClear={(event) => handleClear(event, finalPresets)}
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
            {allowClear ? (
              <Button
                fullWidth
                variant="tertiary"
                onPress={() => handleClear(null, finalPresets)}
              >
                Limpiar
              </Button>
            ) : null}
          </ActionsSection>
        </MobileModal>
      </Container>
    );
  }

  return (
    <Container ref={containerRef} className={className} style={style}>
      <Popover
        content={desktopContent}
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        placement="bottomLeft"
        overlayClassName="custom-datepicker-popover"
        getPopupContainer={() => document.body}
        destroyOnHidden
        fresh
      >
        <div onClick={() => !disabled && setOpen(!open)}>
          <HeroUIDatePickerInput
            value={inputValue}
            placeholder={placeholder}
            size={size}
            disabled={disabled}
            allowClear={allowClear}
            hasValue={hasValue}
            onClear={(event) => handleClear(event, finalPresets)}
            onClick={undefined}
            {...props}
          />
        </div>
      </Popover>
    </Container>
  );
};
