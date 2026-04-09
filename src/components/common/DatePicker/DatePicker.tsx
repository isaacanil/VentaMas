import { Popover } from 'antd';
import React, { useRef } from 'react';
import styled from 'styled-components';

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
}

interface ActionsSectionProps {
  $isMobile?: boolean;
}

interface ActionButtonProps {
  $primary?: boolean;
}

const DatePickerContent = styled.div<DatePickerContentProps>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? 'auto' : '540px'};
  max-width: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? '100%' : '680px'};
  height: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? 'auto' : '350px'};
  min-height: 0;
  max-height: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? 'none' : '460px'};
  padding: ${({ $isMobile }: DatePickerContentProps) =>
    $isMobile ? '1em' : '10px 0px'};
`;

const ActionsSection = styled.div<ActionsSectionProps>`
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  gap: 8px;
  padding: ${({ $isMobile }: ActionsSectionProps) =>
    $isMobile ? '1em' : '0px'};
  background: white;
  border-top: 1px solid #f0f0f0;
`;

const ActionButton = styled.button<ActionButtonProps>`
  flex: 1;
  padding: 8px 16px;
  font-size: 14px;
  color: ${({ $primary }: ActionButtonProps) =>
    $primary ? 'white' : '#595959'};
  cursor: pointer;
  background: ${({ $primary }: ActionButtonProps) =>
    $primary ? '#1890ff' : 'white'};
  border: 1px solid
    ${({ $primary }: ActionButtonProps) => ($primary ? '#1890ff' : '#d9d9d9')};
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    ${({ $primary }: ActionButtonProps) =>
      $primary
        ? `
            background: #40a9ff;
            border-color: #40a9ff;
        `
        : `
            border-color: #1890ff;
            color: #1890ff;
        `}
  }
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
  className,
  style,
  ...props
}: DatePickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobile();

  const finalPresets: DatePickerPreset[] =
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

      {allowClear && (
        <ActionsSection>
          <ActionButton onClick={(e) => handleClear(e, finalPresets)}>
            Limpiar
          </ActionButton>
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
              <ActionButton onClick={(e) => handleClear(e, finalPresets)}>
                Limpiar
              </ActionButton>
            )}
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
        destroyOnHidden={true}
        fresh={true}
      >
        <div onClick={() => !disabled && setOpen(!open)}>
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
        </div>
      </Popover>
    </Container>
  );
};
