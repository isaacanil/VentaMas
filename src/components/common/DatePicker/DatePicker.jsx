import { Popover } from 'antd';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import React, { useRef } from 'react';
import styled from 'styled-components';
import 'dayjs/locale/es';

// Plugins de dayjs
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(localeData);
dayjs.extend(weekday);
dayjs.locale('es');

// Configurar para que la semana empiece en domingo
const locale = dayjs.Ls.es;
if (locale) {
    locale.weekStart = 0; // 0 = domingo
}

// Componentes
import {
    DatePickerInput,
    PresetsSection,
    CalendarSection,
    MobileModal
} from './components';

// Hooks y utilidades
import { createDefaultPresets } from './constants/presets';
import { useDatePicker } from './hooks/useDatePicker';
import { useMobile } from './hooks/useMobile';
import { formatDisplayValue } from './utils/dateUtils';

// Styled Components
const Container = styled.div`
    position: relative;
    width: 100%;
`;

const DatePickerContent = styled.div`
    padding: ${({ $isMobile }) => ($isMobile ? '1em' : '10px 0px')};
    min-width: ${({ $isMobile }) => ($isMobile ? 'auto' : '540px')};
    max-width: ${({ $isMobile }) => ($isMobile ? '100%' : '680px')};
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    height: ${({ $isMobile }) => ($isMobile ? 'auto' : '350px')};
    max-height: ${({ $isMobile }) => ($isMobile ? 'none' : '460px')};
`;

const ActionsSection = styled.div`
    display: flex;
    gap: 8px;
    border-top: 1px solid #f0f0f0;
    background: white;
    padding: ${props => props.$isMobile ? '1em' : '0px'};
    position: sticky;
    bottom: 0;
    z-index: 1;
`;

const ActionButton = styled.button`
    flex: 1;
    padding: 8px 16px;
    border: 1px solid ${props => props.$primary ? '#1890ff' : '#d9d9d9'};
    border-radius: 4px;
    background: ${props => props.$primary ? '#1890ff' : 'white'};
    color: ${props => props.$primary ? 'white' : '#595959'};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
        ${props => props.$primary ? `
            background: #40a9ff;
            border-color: #40a9ff;
        ` : `
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
    min-height: 0;
    height: 100%;
`;

const CalendarPane = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    height: 100%;
`;

const SidebarPane = styled.aside`
    display: flex;
    flex-direction: column;
    width: 220px;
    flex: 0 0 220px;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
`;

export const DatePicker = ({
    mode = 'single', // 'single' | 'range'
    value,
    onChange,
    placeholder = 'Seleccionar fecha',
    format = 'DD/MM/YYYY',
    allowClear = true,
    size = 'middle',
    disabled = false,
    presets = [],
    className,
    style,
    ...props
}) => {
    const containerRef = useRef(null);
    const isMobile = useMobile();
    
    const finalPresets = presets.length > 0 ? presets : createDefaultPresets(mode);
    
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
        getCurrentRangeEnd
    } = useDatePicker({ mode, value, onChange, presets: finalPresets });

    const currentRangeStart = getCurrentRangeStart();
    const currentRangeEnd = getCurrentRangeEnd();

    const inputValue = formatDisplayValue(value, format, mode);
    const hasValue = inputValue !== '';

    const renderContent = (includeActions = true) => {
        if (isMobile) {
            return (
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

                    {includeActions && (allowClear || !isMobile) && (
                        <ActionsSection $isMobile={isMobile}>
                            {allowClear && (
                                <ActionButton onClick={(e) => handleClear(e, finalPresets)}>
                                    Limpiar
                                </ActionButton>
                            )}
                        </ActionsSection>
                    )}
                </DatePickerContent>
            );
        }

        return (
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

                {includeActions && allowClear && (
                    <ActionsSection>
                        <ActionButton onClick={(e) => handleClear(e, finalPresets)}>
                            Limpiar
                        </ActionButton>
                    </ActionsSection>
                )}
            </DatePickerContent>
        );
    };

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
                    title={mode === 'range' ? 'Seleccionar rango de fechas' : 'Seleccionar fecha'}
                >
                    {renderContent(false)}
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
                content={renderContent()}
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
                        onClick={() => {}}
                        {...props}
                    />
                </div>
            </Popover>
        </Container>
    );
};
