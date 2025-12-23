import { faEllipsis, faFilter, faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons';
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
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';


import { useOverflowCollapse } from '@/hooks/useOverflowCollapse';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import { DatePicker } from '@/components/common/DatePicker/DatePicker';

import {
  Bar,
  DesktopActions,
  DrawerContent,
  MobileHeader,
  MobileWrapper,
  ModalContent,
} from './styles';

const DEFAULT_BREAKPOINTS = { mobile: 500, desktop: 1200 };
const DEFAULT_LABELS = {
  drawerTrigger: 'Filtros',
  drawerTitle: 'Filtros',
  modalTitle: 'Filtros adicionales',
  more: 'Más filtros',
  clear: 'Limpiar filtros',
};

const normalizeItems = (items = []) =>
  items.map((item) => ({
    section: 'main',
    visibleOnDesktop: true,
    visibleOnMobile: true,
    collapsible: true,
    ...item,
  }));

const isItemActive = (item = {}) => {
  if (typeof item.isActive === 'function') return item.isActive(item.value);
  if (item.isActive != null) return !!item.isActive;
  if (Array.isArray(item.value)) return item.value.some(Boolean);
  if (item.value && typeof item.value === 'object') {
    return Object.values(item.value).some(Boolean);
  }
  return !!item.value;
};

const getNumberRange = (value) => {
  if (Array.isArray(value)) return { min: value[0], max: value[1] };
  if (value && typeof value === 'object') {
    return {
      min:
        value.min ??
        value.minAmount ??
        value.from ??
        value.start ??
        value.startValue ??
        null,
      max:
        value.max ?? value.maxAmount ?? value.to ?? value.end ?? value.endValue,
    };
  }
  return { min: null, max: null };
};

const getDateRangeValue = (item) => {
  if (!item?.value) return null;
  const toDateTime = (value) => {
    if (!value) return null;
    if (DateTime.isDateTime(value)) return value;
    if (value instanceof Date) return DateTime.fromJSDate(value);
    if (typeof value?.toDate === 'function') {
      return DateTime.fromJSDate(value.toDate());
    }
    if (typeof value === 'number') return DateTime.fromMillis(value);
    if (typeof value === 'string') {
      const parsed = DateTime.fromISO(value);
      return parsed.isValid ? parsed : null;
    }
    return null;
  };
  if (Array.isArray(item.value)) {
    return item.value.map((v) => toDateTime(v));
  }
  return [
    item.value?.startDate ? toDateTime(item.value.startDate) : null,
    item.value?.endDate ? toDateTime(item.value.endDate) : null,
  ];
};

const handleDateChange = (item, range) => {
  if (!item?.onChange) return;
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

const renderControl = (item) => {
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
          onChange={(e) => item.onChange?.(e?.target?.value)}
          placeholder={item.placeholder}
          allowClear={item.allowClear !== false}
          aria-label={item.ariaLabel}
        />
      );
    }
    case 'numberRange': {
      const { min, max } = getNumberRange(item.value);
      const onMinChange = (val) => {
        if (item.onMinChange) item.onMinChange(val);
        else item.onChange?.({ min: val, max });
      };
      const onMaxChange = (val) => {
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
          onChange={(range) => handleDateChange(item, range)}
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

const renderItems = (items, { registerRef, wrapWithFormItem = true } = {}) =>
  items
    .map((item, index) => {
      const control = renderControl(item);
      if (!control) return null;
      const content =
        wrapWithFormItem && item.wrap !== false ? (
          <Form.Item
            label={item.label ?? ' '}
            style={{ marginBottom: 0, width: '100%', ...(item.fieldStyle || {}) }}
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
            item.collapsible !== false && registerRef ? registerRef(index) : null
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

export const FilterBar = ({
  items = [],
  breakpoints = {},
  labels = DEFAULT_LABELS,
  hasActiveFilters = false,
  onClearFilters,
  mobileHeaderRight,
  modalWidth = 520,
  showClearInModal = true,
  showClearInDrawer = true,
  drawerProps = {},
  moreButtonProps = {},
  formProps = {},
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const vw = useViewportWidth();
  const mobileBreakpoint = breakpoints.mobile ?? DEFAULT_BREAKPOINTS.mobile;
  const isMobile = vw <= mobileBreakpoint;

  const normalizedItems = useMemo(() => normalizeItems(items), [items]);
  const mainItems = useMemo(
    () =>
      normalizedItems.filter(
        (item) => item.section !== 'additional' && item.visibleOnDesktop !== false,
      ),
    [normalizedItems],
  );
  const additionalItems = useMemo(
    () =>
      normalizedItems.filter(
        (item) => item.section === 'additional' && item.visibleOnDesktop !== false,
      ),
    [normalizedItems],
  );
  const mobileItems = useMemo(
    () => normalizedItems.filter((item) => item.visibleOnMobile !== false),
    [normalizedItems],
  );

  const { containerRef, register, visibleCount, hasOverflow } = useOverflowCollapse({
    moreButtonWidth: 80,
    gap: 16,
  });

  const desktopFilters = renderItems(mainItems, {
    registerRef: register,
  });

  const collapsedMainItems = useMemo(() => {
    if (!Number.isFinite(visibleCount)) return [];
    return mainItems.slice(visibleCount);
  }, [mainItems, visibleCount]);

  const modalItems = useMemo(() => {
    // Si hay overflow, movemos los filtros extra al modal
    return [...collapsedMainItems, ...additionalItems];
  }, [collapsedMainItems, additionalItems]);

  const hasActiveExtras = useMemo(
    () => modalItems.some(isItemActive),
    [modalItems],
  );

  const showMoreButton = modalItems.length > 0;
  const modalFilters = renderItems(modalItems);

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
              style={{ display: 'flex', gap: '1.25rem', flexDirection: 'column' }}
              {...formProps}
            >
              {renderItems(mobileItems)}
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
    <Bar ref={containerRef}>
      <Form
        layout="vertical"
        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}
        {...formProps}
      >
        {desktopFilters}
      </Form>

      <DesktopActions>
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

const itemShape = PropTypes.shape({
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.node,
  section: PropTypes.oneOf(['main', 'additional']),
  type: PropTypes.string,
  render: PropTypes.func,
  component: PropTypes.node,
  props: PropTypes.object,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onMinChange: PropTypes.func,
  onMaxChange: PropTypes.func,
  isActive: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  visibleOnDesktop: PropTypes.bool,
  visibleOnMobile: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  allowClear: PropTypes.bool,
  ariaLabel: PropTypes.string,
  minAriaLabel: PropTypes.string,
  maxAriaLabel: PropTypes.string,
  minPlaceholder: PropTypes.string,
  maxPlaceholder: PropTypes.string,
  minProps: PropTypes.object,
  maxProps: PropTypes.object,
  controlStyle: PropTypes.object,
  fieldStyle: PropTypes.object,
  wrapperStyle: PropTypes.object,
});

FilterBar.propTypes = {
  items: PropTypes.arrayOf(itemShape),
  breakpoints: PropTypes.shape({
    mobile: PropTypes.number,
    desktop: PropTypes.number,
  }),
  labels: PropTypes.object,
  hasActiveFilters: PropTypes.bool,
  onClearFilters: PropTypes.func,
  mobileHeaderRight: PropTypes.node,
  modalWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showClearInModal: PropTypes.bool,
  showClearInDrawer: PropTypes.bool,
  drawerProps: PropTypes.object,
  moreButtonProps: PropTypes.object,
  formProps: PropTypes.object,
};
