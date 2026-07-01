import {
  faEllipsis,
  faFilter,
  faFilterCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

import { DatePicker } from '@/components/common/DatePicker';
import { VmButton, VmDrawer, VmModal } from '@/components/heroui';
import type { VmButtonProps, VmDrawerProps } from '@/components/heroui';
import { useOverflowCollapse } from '@/hooks/useOverflowCollapse';
import useViewportWidth from '@/hooks/useViewportWidth';

import {
  getDateRangeValue,
  getNumberRange,
  handleDateRangeChange,
  isItemActive,
} from './FilterBar.utils';
import {
  getFilterBarItemSlots,
  getFilterBarOverflowSlots,
} from './FilterBar.layout';
import type {
  DateRangeInputValue,
  DateRangeMillisValue,
  DateRangeValue,
  NumberRangeValue,
  NumberRangeValueObject,
} from './FilterBar.utils';
import {
  Bar,
  DesktopForm,
  DesktopActions,
  DesktopMain,
  DesktopMeasureForm,
  DesktopPinned,
  DrawerContent,
  MobileFilterForm,
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

type FilterBarItemBase = {
  [key: string]: unknown;
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
    value:
      | DateRangeValue
      | DateRangeMillisValue
      | [number | null, number | null],
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
  fullWidth?: boolean;
  wrapWithFormItem?: boolean;
};

const DEFAULT_BREAKPOINTS = { mobile: 500, desktop: 1200 } as const;
const EMPTY_ITEMS: FilterBarItem[] = [];
const EMPTY_BREAKPOINTS: FilterBarBreakpoints = {};
const EMPTY_DRAWER_PROPS: Partial<VmDrawerProps> = {};
const EMPTY_BUTTON_PROPS: Partial<VmButtonProps> = {};
const EMPTY_FORM_PROPS: React.ComponentProps<typeof Form> = {};
const DEFAULT_RENDER_ITEMS_CONFIG: RenderItemsConfig = {};
const DEFAULT_LABELS: Required<FilterBarLabels> = {
  drawerTrigger: 'Filtros',
  drawerTitle: 'Filtros',
  modalTitle: 'Filtros adicionales',
  more: 'Más filtros',
  clear: 'Limpiar filtros',
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
          value={getDateRangeValue(item.value)}
          onChange={(range: DateRangeValue) =>
            handleDateRangeChange({
              range,
              valueFormat: item.valueFormat,
              valueAsArray: item.valueAsArray,
              onChange: item.onChange,
            })
          }
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
    fullWidth = false,
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
              ...item.fieldStyle,
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
            display: fullWidth ? 'flex' : 'inline-flex',
            ...(fullWidth ? { width: '100%', minWidth: 0 } : {}),
            ...(!fullWidth && item.minWidth ? { minWidth: item.minWidth } : {}),
            ...item.wrapperStyle,
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
  drawerProps?: Partial<VmDrawerProps>;
  moreButtonProps?: Partial<VmButtonProps>;
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

  const filterBarItemSlots = useMemo(
    () => getFilterBarItemSlots(items),
    [items],
  );
  const { collapsibleMainItems, mobileItems, pinnedMainItems } =
    filterBarItemSlots;

  const { containerRef, register, visibleCount, hasOverflow } =
    useOverflowCollapse({ gap: 16, endPadding: 0 });

  const { visibleMainItems, modalItems } = useMemo(
    () => getFilterBarOverflowSlots(filterBarItemSlots, visibleCount),
    [filterBarItemSlots, visibleCount],
  );
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
  const mobileFilters = useMemo(
    () => renderItems(mobileItems, { fullWidth: true }),
    [mobileItems],
  );

  const hasActiveExtras = useMemo(
    () => modalItems.some(isItemActive),
    [modalItems],
  );

  const showMoreButton = modalItems.length > 0;
  const modalFilters = useMemo(() => renderItems(modalItems), [modalItems]);

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const handleDrawerOpenChange = useCallback(
    (isOpen: boolean) => setDrawerVisible(isOpen),
    [],
  );
  const openModal = useCallback(() => setModalVisible(true), []);
  const handleModalOpenChange = useCallback(
    (isOpen: boolean) => setModalVisible(isOpen),
    [],
  );

  const clearButtonText = labels.clear ?? DEFAULT_LABELS.clear;

  if (isMobile) {
    return (
      <MobileWrapper>
        <MobileHeader>
          <VmButton
            variant="secondary"
            onPress={openDrawer}
            aria-label={labels.drawerTrigger ?? DEFAULT_LABELS.drawerTrigger}
          >
            <FontAwesomeIcon icon={faFilter} />
            {labels.drawerTrigger ?? DEFAULT_LABELS.drawerTrigger}
          </VmButton>
          {mobileHeaderRight ? (
            <div className="mobile-extra">{mobileHeaderRight}</div>
          ) : null}
        </MobileHeader>

        <VmDrawer
          title={labels.drawerTitle ?? DEFAULT_LABELS.drawerTitle}
          placement="bottom"
          isOpen={drawerVisible}
          onOpenChange={handleDrawerOpenChange}
          showHandle={false}
          {...drawerProps}
        >
          <DrawerContent>
            <MobileFilterForm
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              {mobileFilters}
              {showClearInDrawer && hasActiveFilters && onClearFilters ? (
                <VmButton
                  variant="secondary"
                  fullWidth
                  onPress={onClearFilters}
                  aria-label={clearButtonText}
                >
                  <FontAwesomeIcon icon={faFilterCircleXmark} />
                  {clearButtonText}
                </VmButton>
              ) : null}
            </MobileFilterForm>
          </DrawerContent>
        </VmDrawer>
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
            <VmButton
              isIconOnly
              size="sm"
              variant={
                hasActiveExtras || hasOverflow ? 'primary' : 'secondary'
              }
              onPress={openModal}
              aria-label={labels.more ?? DEFAULT_LABELS.more}
              {...moreButtonProps}
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </VmButton>
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
        <VmModal
          title={labels.modalTitle ?? DEFAULT_LABELS.modalTitle}
          isOpen={modalVisible}
          onOpenChange={handleModalOpenChange}
          placement="center"
          dialogProps={{
            style: {
              width:
                typeof modalWidth === 'number' ? `${modalWidth}px` : modalWidth,
              maxWidth: 'calc(100vw - 48px)',
            },
          }}
        >
          <ModalContent>
            <Form layout="vertical" {...formProps}>
              {modalFilters}
              {showClearInModal && hasActiveFilters && onClearFilters ? (
                <VmButton
                  variant="secondary"
                  fullWidth
                  onPress={onClearFilters}
                  aria-label={clearButtonText}
                >
                  <FontAwesomeIcon icon={faFilterCircleXmark} />
                  {clearButtonText}
                </VmButton>
              ) : null}
            </Form>
          </ModalContent>
        </VmModal>
      ) : null}
    </Bar>
  );
};
