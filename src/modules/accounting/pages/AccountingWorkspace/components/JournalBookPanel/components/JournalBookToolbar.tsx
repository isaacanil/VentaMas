import {
  DateField,
  DateRangePicker,
  ListBox,
  RangeCalendar,
  SearchField,
  Select,
  Switch,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import type { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';

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
      <DateRangePicker
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
        <DateField.Group fullWidth>
          <DateField.Input slot="start">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateRangePicker.RangeSeparator />
          <DateField.Input slot="end">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateField.Suffix>
            <DateRangePicker.Trigger>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DateRangePicker.Popover>
          <RangeCalendar>
            <RangeCalendar.Header>
              <RangeCalendar.YearPickerTrigger>
                <RangeCalendar.YearPickerTriggerHeading />
                <RangeCalendar.YearPickerTriggerIndicator />
              </RangeCalendar.YearPickerTrigger>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => (
                  <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                )}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            <RangeCalendar.YearPickerGrid>
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>
    </ToolbarField>

    <ToolbarField $width="compact">
      <ToolbarLabel htmlFor="journal-type">Tipo</ToolbarLabel>
      <Select
        id="journal-type"
        value={typeFilter}
        onChange={(value) => {
          if (value) {
            setCurrentPage(1);
            setTypeFilter(value as string);
          }
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {JOURNAL_TYPE_OPTIONS.map((option) => (
              <ListBox.Item
                key={option.value}
                id={option.value}
                textValue={option.label}
              >
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </ToolbarField>

    <ToolbarField $width="compact">
      <ToolbarLabel htmlFor="journal-module">Modulo</ToolbarLabel>
      <Select
        id="journal-module"
        value={moduleFilter}
        onChange={(value) => {
          if (value) {
            setCurrentPage(1);
            setModuleFilter(value as string);
          }
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="all" textValue="Todos">
              Todos
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {moduleOptions.map((option) => (
              <ListBox.Item key={option} id={option} textValue={option}>
                {option}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </ToolbarField>

    <ToolbarField $width="search">
      <ToolbarLabel htmlFor="journal-search">Buscar</ToolbarLabel>
      <SearchField
        variant="secondary"
        aria-label="Buscar asientos"
        value={query}
        onChange={(value) => {
          setCurrentPage(1);
          setQuery(value);
        }}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input
            id="journal-search"
            placeholder="NCF, referencia, descripcion o cuenta"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </ToolbarField>

    <ToolbarToggle>
      <Switch
        id="journal-preview-only"
        isSelected={previewOnly}
        onChange={(isSelected) => {
          setCurrentPage(1);
          setPreviewOnly(isSelected);
        }}
      >
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <ToggleLabel>Solo previos (No posteados)</ToggleLabel>
        </Switch.Content>
      </Switch>
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
