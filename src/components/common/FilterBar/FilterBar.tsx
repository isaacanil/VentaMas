import {
  faEllipsis,
  faFilter,
  faFilterCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import { DateTime } from 'luxon';
import React, { useCallback, useMemo, useState } from 'react';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { useOverflowCollapse } from '@/hooks/useOverflowCollapse';
import useViewportWidth from '@/hooks/windows/useViewportWidth';

import {
  Bar,
  DesktopForm,
  DesktopActions,
  DesktopMain,
  DesktopMeasureForm,
  DesktopPinned,
  DrawerContent,
  MobileHeader,
  MobileWrapper,
  ModalContent,
} from './styles';

export type FilterBarSection = 'main' | 'additional';

type FilterBarLabels = {
  drawerTrigger?: string;
  drawerTitle?: string;
  modalTitle?: string;
  more?: string;
  clear?: string;
};

type FilterBarBreakpoints = Partial<Record<'mobile' | 'desktop', number>>;

type FilterBarSelectOption = {
  label: React.ReactNode;
  value: string | number;
  disabled?: boolean;
};

type NumberRangeValueObject = {
  min?: number | null;
  max?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  from?: number | null;
  to?: number | null;
  start?: number | null;
  end?: number | null;
  startValue?: number | null;
  endValue?: number | null;
};

type NumberRangeValue =
  | [number | null, number | null]
  | NumberRangeValueObject
  | null;

type DateRangeInputValue =
  | [unknown, unknown]
  | { startDate?: unknown; endDate?: unknown }
  | null;

type DateRangeValue = [DateTime | null, DateTime | null] | null;

type DateRangeMillisValue = {
  startDate: number | null;
  endDate: number | null;
};

type FilterBarItemBase = {
  key?: string | number;
  id?: string | number;
  label?: React.ReactNode;
  section?: FilterBarSection;
  visibleOnDesktop?: boolean;
  visibleOnMobile?: boolean;
  collapsible?: boolean;
  wrap?: boolean;
  minWidth?: number | string;
  width?: number | string;
  controlStyle?: React.CSSProperties;
  fieldStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  allowClear?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
  render?: (item: FilterBarItem) => React.ReactNode;
  component?: React.ReactNode;
  isActive?: boolean | ((value: unknown) => boolean);
};

type FilterBarSelectItem = FilterBarItemBase & {
  type: 'select' | 'multiSelect';
  value?: string | number | Array<string | number> | null;
  onChange?: (value: string | number | Array<string | number> | null) => void;
  options?: FilterBarSelectOption[];
  placeholder?: string;
  props?: React.ComponentProps<typeof Select>;
};

type FilterBarInputItem = FilterBarItemBase & {
  type: 'input';
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  props?: React.ComponentProps<typeof Input>;
};

type FilterBarNumberRangeItem = FilterBarItemBase & {
  type: 'numberRange';
  value?: NumberRangeValue;
  onChange?: (value: NumberRangeValueObject) => void;
  onMinChange?: (value: number | null) => void;
  onMaxChange?: (value: number | null) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  minAriaLabel?: string;
  maxAriaLabel?: string;
  minProps?: React.ComponentProps<typeof InputNumber>;
  maxProps?: React.ComponentProps<typeof InputNumber>;
  props?: React.ComponentProps<typeof Space.Compact>;
};

type FilterBarDateRangeItem = FilterBarItemBase & {
  type: 'dateRange';
  value?: DateRangeInputValue;
  onChange?: (
    value: DateRangeValue | DateRangeMillisValue | [number | null, number | null],
  ) => void;
  valueFormat?: 'luxon' | 'timestamp';
  valueAsArray?: boolean;
  placeholder?: string;
  props?: React.ComponentProps<typeof DatePicker>;
};

type FilterBarSwitchItem = FilterBarItemBase & {
  type: 'switch';
  value?: boolean;
  onChange?: (value: boolean) => void;
  props?: React.ComponentProps<typeof Switch>;
};

type FilterBarCustomItem = FilterBarItemBase & {
  type?: 'custom';
  value?: unknown;
  onChange?: (value: unknown) => void;
  props?: Record<string, unknown>;
};

export type FilterBarItem =
  | FilterBarSelectItem
  | FilterBarInputItem
  | FilterBarNumberRangeItem
  | FilterBarDateRangeItem
  | FilterBarSwitchItem
  | FilterBarCustomItem;

type RenderItemsConfig = {
  registerRef?: (index: number) => (node: HTMLElement | null) => void;
  wrapWithFormItem?: boolean;
};

const DEFAULT_BREAKPOINTS = { mobile: 500, desktop: 1200 } as const;
const EMPTY_ITEMS: FilterBarItem[] = [];
const EMPTY_BREAKPOINTS: FilterBarBreakpoints = {};
const EMPTY_DRAWER_PROPS: React.ComponentProps<typeof Drawer> = {};
const EMPTY_BUTTON_PROPS: React.ComponentProps<typeof Button> = {};
const EMPTY_FORM_PROPS: React.ComponentProps<typeof Form> = {};
const DEFAULT_RENDER_ITEMS_CONFIG: RenderItemsConfig = {};
const DEFAULT_LABELS: Required<FilterBarLabels> = {
  drawerTrigger: 'Filtros',
  drawerTitle: 'Filtros',
  modalTitle: 'Filtros adicionales',
  more: 'Más filtros',
  clear: 'Limpiar filtros',
};

const normalizeItems = (
  items: FilterBarItem[] = EMPTY_ITEMS,
): FilterBarItem[] =>
  items.map((item) => ({
    section: 'main',
    visibleOnDesktop: true,
    visibleOnMobile: true,
    collapsible: true,
    ...item,
  }));

const isItemActive = (item: FilterBarItem) => {
  if (typeof item.isActive === 'function') {
    return item.isActive(item.value);
  }
  if (item.isActive != null) return Boolean(item.isActive);
  if (Array.isArray(item.value)) return item.value.some(Boolean);
  if (item.value && typeof item.value === 'object') {
    return Object.values(item.value).some(Boolean);
  }
  return Boolean(item.value);
};

const resolveNumberValue = (...values: Array<unknown>): number | null => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const getNumberRange = (value?: NumberRangeValue) => {
  if (Array.isArray(value)) return { min: value[0], max: value[1] };
  if (value && typeof value === 'object') {
    const rangeValue = value as NumberRangeValueObject;
    return {
      min: resolveNumberValue(
        rangeValue.min,
        rangeValue.minAmount,
        rangeValue.from,
        rangeValue.start,
        rangeValue.startValue,
      ),
      max: resolveNumberValue(
        rangeValue.max,
        rangeValue.maxAmount,
        rangeValue.to,
        rangeValue.end,
        rangeValue.endValue,
      ),
    };
  }
  return { min: null, max: null };
};

const isDateRangeObject = (
  value: unknown,
): value is { startDate?: unknown; endDate?: unknown } =>
  Boolean(value) &&
  typeof value === 'object' &&
  ('startDate' in value || 'endDate' in value);

const getDateRangeValue = (item: FilterBarDateRangeItem): DateRangeValue => {
  if (!item.value) return null;
  const toDateTime = (value: unknown): DateTime | null => {
    if (!value) return null;
    if (DateTime.isDateTime(value)) return value;
    if (value instanceof Date) return DateTime.fromJSDate(value);
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate?: () => Date }).toDate === 'function'
    ) {
      return DateTime.fromJSDate((value as { toDate: () => Date }).toDate());
    }
    if (typeof value === 'number') return DateTime.fromMillis(value);
    if (typeof value === 'string') {
      const parsed = DateTime.fromISO(value);
      return parsed.isValid ? parsed : null;
    }
    return null;
  };
  if (Array.isArray(item.value)) {
    const [start, end] = item.value;
    return [toDateTime(start), toDateTime(end)];
  }
  if (isDateRangeObject(item.value)) {
    return [
      item.value.startDate ? toDateTime(item.value.startDate) : null,
      item.value.endDate ? toDateTime(item.value.endDate) : null,
    ];
  }
  return null;
};

const handleDateChange = (
  item: FilterBarDateRangeItem,
  range: DateRangeValue,
) => {
  if (!item.onChange) return;
  if (item.valueFormat === 'luxon') {
    item.onChange(range);
    return;
  }
  const start = range?.[0] ? range[0].startOf('day').toMillis() : null;
  const end = range?.[1] ? range[1].endOf('day').toMillis() : null;
  if (item.valueAsArray) {
    item.onChange([start, end]);
  } else {
    item.onChange({ startDate: start, endDate: end });
  }
};

const renderControl = (item: FilterBarItem) => {
  if (item.render) return item.render(item);
  if (item.component) return item.component;

  switch (item.type) {
    case 'select':
    case 'multiSelect': {
      return (
        <Select
          {...item.props}
          mode={item.type === 'multiSelect' ? 'multiple' : item.props?.mode}
          value={item.value}
          onChange={item.onChange}
          options={item.options}
          placeholder={item.placeholder}
          allowClear={item.allowClear !== false}
          style={{ width: '100%', minWidth: item.width, ...item.controlStyle }}
          aria-label={item.ariaLabel}
        />
      );
    }
    case 'input': {
      return (
        <Input
          {...item.props}
          value={item.value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            item.onChange?.(e.target.value)
          }
          placeholder={item.placeholder}
          allowClear={item.allowClear !== false}
          aria-label={item.ariaLabel}
        />
      );
    }
    case 'numberRange': {
      const { min, max } = getNumberRange(item.value);
      const onMinChange = (val: number | null) => {
        if (item.onMinChange) item.onMinChange(val);
        else item.onChange?.({ min: val, max });
      };
      const onMaxChange = (val: number | null) => {
        if (item.onMaxChange) item.onMaxChange(val);
        else item.onChange?.({ min, max: val });
      };
      return (
        <Space.Compact {...item.props}>
          <InputNumber
            {...item.minProps}
            value={min}
            onChange={onMinChange}
            placeholder={item.minPlaceholder}
            aria-label={item.minAriaLabel}
          />
          <InputNumber
            {...item.maxProps}
            value={max}
            onChange={onMaxChange}
            placeholder={item.maxPlaceholder}
            aria-label={item.maxAriaLabel}
          />
        </Space.Compact>
      );
    }
    case 'dateRange': {
      return (
        <DatePicker
          mode="range"
          {...item.props}
          value={getDateRangeValue(item)}
          onChange={(range: DateRangeValue) => handleDateChange(item, range)}
          allowClear={item.allowClear !== false}
          aria-label={item.ariaLabel}
        />
      );
    }
    case 'switch': {
      return (
        <Switch
          {...item.props}
          checked={!!item.value}
          onChange={item.onChange}
          aria-label={item.ariaLabel}
        />
      );
    }
    default:
      return item.children ?? null;
  }
};

const renderItems = (
  items: FilterBarItem[],
  {
    registerRef,
    wrapWithFormItem = true,
  }: RenderItemsConfig = DEFAULT_RENDER_ITEMS_CONFIG,
) =>
  items
    .map((item, index) => {
      const control = renderControl(item);
      if (!control) return null;
      const content =
        wrapWithFormItem && item.wrap !== false ? (
          <Form.Item
            label={item.label ?? ' '}
            colon={false}
            style={{
              marginBottom: 0,
              width: '100%',
              ...(item.fieldStyle || {}),
            }}
          >
            {control}
          </Form.Item>
        ) : (
          control
        );

      return (
        <div
          key={item.key || item.id || index}
          ref={
            item.collapsible !== false && registerRef
              ? registerRef(index)
              : null
          }
          style={{
            display: 'inline-flex',
            ...(item.minWidth ? { minWidth: item.minWidth } : {}),
            ...(item.wrapperStyle || {}),
          }}
        >
          {content}
        </div>
      );
    })
    .filter(Boolean);

type FilterBarProps = {
  items?: FilterBarItem[];
  breakpoints?: FilterBarBreakpoints;
  labels?: FilterBarLabels;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  mobileHeaderRight?: React.ReactNode;
  modalWidth?: number | string;
  showClearInModal?: boolean;
  showClearInDrawer?: boolean;
  drawerProps?: React.ComponentProps<typeof Drawer>;
  moreButtonProps?: React.ComponentProps<typeof Button>;
  formProps?: React.ComponentProps<typeof Form>;
};

export const FilterBar = ({
  items = EMPTY_ITEMS,
  breakpoints = EMPTY_BREAKPOINTS,
  labels = DEFAULT_LABELS,
  hasActiveFilters = false,
  onClearFilters,
  mobileHeaderRight,
  modalWidth = 520,
  showClearInModal = true,
  showClearInDrawer = true,
  drawerProps = EMPTY_DRAWER_PROPS,
  moreButtonProps = EMPTY_BUTTON_PROPS,
  formProps = EMPTY_FORM_PROPS,
}: FilterBarProps) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const vw = useViewportWidth();
  const mobileBreakpoint = breakpoints.mobile ?? DEFAULT_BREAKPOINTS.mobile;
  const isMobile = vw <= mobileBreakpoint;

  const normalizedItems = useMemo(() => normalizeItems(items), [items]);
  const mainItems = useMemo(
    () =>
      normalizedItems.filter(
        (item) =>
          item.section !== 'additional' && item.visibleOnDesktop !== false,
      ),
    [normalizedItems],
  );
  const collapsibleMainItems = useMemo(
    () => mainItems.filter((item) => item.collapsible !== false),
    [mainItems],
  );
  const pinnedMainItems = useMemo(
    () => mainItems.filter((item) => item.collapsible === false),
    [mainItems],
  );
  const additionalItems = useMemo(
    () =>
      normalizedItems.filter(
        (item) =>
          item.section === 'additional' && item.visibleOnDesktop !== false,
      ),
    [normalizedItems],
  );
  const mobileItems = useMemo(
    () => normalizedItems.filter((item) => item.visibleOnMobile !== false),
    [normalizedItems],
  );

  const { containerRef, register, visibleCount, hasOverflow } =
    useOverflowCollapse({ gap: 16, endPadding: 0 });

  const visibleMainItems = useMemo(() => {
    if (!Number.isFinite(visibleCount)) return collapsibleMainItems;
    return collapsibleMainItems.slice(0, visibleCount);
  }, [collapsibleMainItems, visibleCount]);
  const desktopFilters = useMemo(
    () => renderItems(visibleMainItems),
    [visibleMainItems],
  );
  const desktopMeasureFilters = useMemo(
    () =>
      renderItems(collapsibleMainItems, {
        registerRef: register,
      }),
    [collapsibleMainItems, register],
  );
  const desktopPinnedItems = useMemo(
    () => renderItems(pinnedMainItems),
    [pinnedMainItems],
  );
  const mobileFilters = useMemo(() => renderItems(mobileItems), [mobileItems]);

  const collapsedMainItems = useMemo(() => {
    if (!Number.isFinite(visibleCount)) return [];
    return collapsibleMainItems.slice(visibleCount);
  }, [collapsibleMainItems, visibleCount]);

  const modalItems = useMemo(() => {
    return [...collapsedMainItems, ...additionalItems];
  }, [collapsedMainItems, additionalItems]);

  const hasActiveExtras = useMemo(
    () => modalItems.some(isItemActive),
    [modalItems],
  );

  const showMoreButton = modalItems.length > 0;
  const modalFilters = useMemo(() => renderItems(modalItems), [modalItems]);

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);
  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  const clearButtonText = labels.clear ?? DEFAULT_LABELS.clear;

  if (isMobile) {
    return (
      <MobileWrapper>
        <MobileHeader>
          <Button
            icon={<FontAwesomeIcon icon={faFilter} />}
            onClick={openDrawer}
            aria-label={labels.drawerTrigger ?? DEFAULT_LABELS.drawerTrigger}
          >
            {labels.drawerTrigger ?? DEFAULT_LABELS.drawerTrigger}
          </Button>
          {mobileHeaderRight ? (
            <div className="mobile-extra">{mobileHeaderRight}</div>
          ) : null}
        </MobileHeader>

        <Drawer
          title={labels.drawerTitle ?? DEFAULT_LABELS.drawerTitle}
          placement="bottom"
          onClose={closeDrawer}
          open={drawerVisible}
          size="large"
          styles={{
            wrapper: {
              height: '100vh',
            },
          }}
          {...drawerProps}
        >
          <DrawerContent>
            <Form
              layout="vertical"
              style={{
                display: 'flex',
                gap: '1.25rem',
                flexDirection: 'column',
              }}
              {...formProps}
            >
              {mobileFilters}
              {showClearInDrawer && hasActiveFilters && onClearFilters ? (
                <Button
                  icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
                  onClick={onClearFilters}
                  type="default"
                  block
                  aria-label={clearButtonText}
                />
              ) : null}
            </Form>
          </DrawerContent>
        </Drawer>
      </MobileWrapper>
    );
  }

  return (
    <Bar>
      <DesktopMain ref={containerRef}>
        <DesktopMeasureForm layout="vertical" {...formProps}>
          {desktopMeasureFilters}
        </DesktopMeasureForm>

        <DesktopForm layout="vertical" {...formProps}>
          {desktopFilters}
        </DesktopForm>
      </DesktopMain>

      <DesktopActions>
        {desktopPinnedItems.length > 0 ? (
          <DesktopPinned>{desktopPinnedItems}</DesktopPinned>
        ) : null}

        {showMoreButton ? (
          <Tooltip title={labels.more ?? DEFAULT_LABELS.more}>
            <Button
              icon={<FontAwesomeIcon icon={faEllipsis} />}
              onClick={openModal}
              size="middle"
              type={hasActiveExtras || hasOverflow ? 'primary' : 'text'}
              aria-label={labels.more ?? DEFAULT_LABELS.more}
              {...moreButtonProps}
            />
          </Tooltip>
        ) : null}

        {hasActiveFilters && onClearFilters ? (
          <Tooltip title={clearButtonText}>
            <Button
              icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
              onClick={onClearFilters}
              type="text"
              aria-label={clearButtonText}
            />
          </Tooltip>
        ) : null}
      </DesktopActions>

      {showMoreButton ? (
        <Modal
          title={labels.modalTitle ?? DEFAULT_LABELS.modalTitle}
          open={modalVisible}
          onCancel={closeModal}
          footer={null}
          width={modalWidth}
          centered
        >
          <ModalContent>
            <Form layout="vertical" {...formProps}>
              {modalFilters}
              {showClearInModal && hasActiveFilters && onClearFilters ? (
                <Button
                  icon={<FontAwesomeIcon icon={faFilterCircleXmark} />}
                  onClick={onClearFilters}
                  block
                  aria-label={clearButtonText}
                >
                  {clearButtonText}
                </Button>
              ) : null}
            </Form>
          </ModalContent>
        </Modal>
      ) : null}
    </Bar>
  );
};
