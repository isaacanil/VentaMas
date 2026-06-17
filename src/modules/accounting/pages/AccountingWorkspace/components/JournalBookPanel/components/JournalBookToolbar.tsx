import { parseDate } from '@internationalized/date';
import type { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';

import {
  VmDateField,
  VmDateRangePicker,
  VmListBox,
  VmRangeCalendar,
  VmSearchField,
  VmSelect,
  VmSwitch,
} from '@/components/heroui';
import { JOURNAL_TYPE_OPTIONS } from '../constants';

interface JournalBookToolbarProps {
  dateFrom: string;
  dateTo: string;
  moduleFilter: string;
  moduleOptions: string[];
  previewOnly: boolean;
  query: string;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  setModuleFilter: (value: string) => void;
  setPreviewOnly: (value: boolean) => void;
  setQuery: (value: string) => void;
  setTypeFilter: (value: string) => void;
  typeFilter: string;
}

export const JournalBookToolbar = ({
  dateFrom,
  dateTo,
  moduleFilter,
  moduleOptions,
  previewOnly,
  query,
  setCurrentPage,
  setDateFrom,
  setDateTo,
  setModuleFilter,
  setPreviewOnly,
  setQuery,
  setTypeFilter,
  typeFilter,
}: JournalBookToolbarProps) => (
  <Toolbar>
    <ToolbarField $width="compact" style={{ gridColumn: 'span 2' }}>
      <ToolbarLabel>Fechas</ToolbarLabel>
      <VmDateRangePicker
        value={
          dateFrom && dateTo
            ? { start: parseDate(dateFrom), end: parseDate(dateTo) }
            : null
        }
        onChange={(range) => {
          setCurrentPage(1);
          if (range) {
            setDateFrom(range.start.toString());
            setDateTo(range.end.toString());
          } else {
            setDateFrom('');
            setDateTo('');
          }
        }}
      >
        <VmDateField.Group fullWidth>
          <VmDateField.Input slot="start">
            {(segment) => <VmDateField.Segment segment={segment} />}
          </VmDateField.Input>
          <VmDateRangePicker.RangeSeparator />
          <VmDateField.Input slot="end">
            {(segment) => <VmDateField.Segment segment={segment} />}
          </VmDateField.Input>
          <VmDateField.Suffix>
            <VmDateRangePicker.Trigger>
              <VmDateRangePicker.TriggerIndicator />
            </VmDateRangePicker.Trigger>
          </VmDateField.Suffix>
        </VmDateField.Group>
        <VmDateRangePicker.Popover>
          <VmRangeCalendar>
            <VmRangeCalendar.Header>
              <VmRangeCalendar.YearPickerTrigger>
                <VmRangeCalendar.YearPickerTriggerHeading />
                <VmRangeCalendar.YearPickerTriggerIndicator />
              </VmRangeCalendar.YearPickerTrigger>
              <VmRangeCalendar.NavButton slot="previous" />
              <VmRangeCalendar.NavButton slot="next" />
            </VmRangeCalendar.Header>
            <VmRangeCalendar.Grid>
              <VmRangeCalendar.GridHeader>
                {(day) => (
                  <VmRangeCalendar.HeaderCell>{day}</VmRangeCalendar.HeaderCell>
                )}
              </VmRangeCalendar.GridHeader>
              <VmRangeCalendar.GridBody>
                {(date) => <VmRangeCalendar.Cell date={date} />}
              </VmRangeCalendar.GridBody>
            </VmRangeCalendar.Grid>
            <VmRangeCalendar.YearPickerGrid>
              <VmRangeCalendar.YearPickerGridBody>
                {({ year }) => <VmRangeCalendar.YearPickerCell year={year} />}
              </VmRangeCalendar.YearPickerGridBody>
            </VmRangeCalendar.YearPickerGrid>
          </VmRangeCalendar>
        </VmDateRangePicker.Popover>
      </VmDateRangePicker>
    </ToolbarField>

    <ToolbarField $width="compact">
      <ToolbarLabel htmlFor="journal-type">Tipo</ToolbarLabel>
      <VmSelect
        id="journal-type"
        value={typeFilter}
        onChange={(value) => {
          if (value) {
            setCurrentPage(1);
            setTypeFilter(value as string);
          }
        }}
      >
        <VmSelect.Trigger>
          <VmSelect.Value />
          <VmSelect.Indicator />
        </VmSelect.Trigger>
        <VmSelect.Popover>
          <VmListBox>
            {JOURNAL_TYPE_OPTIONS.map((option) => (
              <VmListBox.Item
                key={option.value}
                id={option.value}
                textValue={option.label}
              >
                {option.label}
                <VmListBox.ItemIndicator />
              </VmListBox.Item>
            ))}
          </VmListBox>
        </VmSelect.Popover>
      </VmSelect>
    </ToolbarField>

    <ToolbarField $width="compact">
      <ToolbarLabel htmlFor="journal-module">Modulo</ToolbarLabel>
      <VmSelect
        id="journal-module"
        value={moduleFilter}
        onChange={(value) => {
          if (value) {
            setCurrentPage(1);
            setModuleFilter(value as string);
          }
        }}
      >
        <VmSelect.Trigger>
          <VmSelect.Value />
          <VmSelect.Indicator />
        </VmSelect.Trigger>
        <VmSelect.Popover>
          <VmListBox>
            <VmListBox.Item id="all" textValue="Todos">
              Todos
              <VmListBox.ItemIndicator />
            </VmListBox.Item>
            {moduleOptions.map((option) => (
              <VmListBox.Item key={option} id={option} textValue={option}>
                {option}
                <VmListBox.ItemIndicator />
              </VmListBox.Item>
            ))}
          </VmListBox>
        </VmSelect.Popover>
      </VmSelect>
    </ToolbarField>

    <ToolbarField $width="search">
      <ToolbarLabel htmlFor="journal-search">Buscar</ToolbarLabel>
      <VmSearchField
        variant="secondary"
        aria-label="Buscar asientos"
        value={query}
        onChange={(value) => {
          setCurrentPage(1);
          setQuery(value);
        }}
      >
        <VmSearchField.Group>
          <VmSearchField.SearchIcon />
          <VmSearchField.Input
            id="journal-search"
            placeholder="NCF, referencia, descripcion o cuenta"
          />
          <VmSearchField.ClearButton />
        </VmSearchField.Group>
      </VmSearchField>
    </ToolbarField>

    <ToolbarToggle>
      <VmSwitch
        id="journal-preview-only"
        isSelected={previewOnly}
        onChange={(isSelected) => {
          setCurrentPage(1);
          setPreviewOnly(isSelected);
        }}
      >
        <VmSwitch.Control>
          <VmSwitch.Thumb />
        </VmSwitch.Control>
        <VmSwitch.Content>
          <ToggleLabel>Solo previos (No posteados)</ToggleLabel>
        </VmSwitch.Content>
      </VmSwitch>
    </ToolbarToggle>
  </Toolbar>
);

const Toolbar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--ds-space-4);
  padding-bottom: 4px;
`;

const ToolbarField = styled.div<{ $width?: 'compact' | 'search' }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  flex: 0 0 auto;

  ${({ $width }) =>
    $width === 'compact'
      ? `
        min-width: 140px;
      `
      : $width === 'search'
        ? `
          min-width: 240px;
          flex: 1 1 auto;
        `
        : ''}
`;

const ToolbarToggle = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  margin-top: 18px;
`;

const ToolbarLabel = styled.label`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-secondary);
`;

const ToggleLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
