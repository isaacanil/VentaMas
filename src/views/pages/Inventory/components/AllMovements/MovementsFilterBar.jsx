import { Form, Cascader, Button, Select } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { useWarehouseHierarchy } from '@/firebase/warehouse/warehouseNestedServise';
import { DatePicker } from '@/views/templates/system/Dates/DatePicker/DatePicker';
import { shortenLocationPath } from '@/views/pages/InventoryControl/components/inventoryTableUtils.js';

const Bar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  padding: 0.4rem 1rem;
  background: var(--white);
  border-bottom: 1px solid var(--gray);

  .ant-form-item {
    display: inline-block;
    margin-bottom: 0 !important;
  }

  .ant-form-item-label {
    padding-bottom: 2px !important;
    line-height: 1.2 !important;
  }

  .ant-form-item-label > label {
    height: auto !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    color: #666 !important;
  }
`;

/**
 * MovementsFilterBar
 * - Lets the user filter movements by location (warehouse/shelf/row/segment)
 * - Default is "Todas" (no filter)
 */
const MovementsFilterBar = ({
  value,
  onChange,
  loading,
  dates,
  setDates,
  defaultDate,
  type,
  onTypeChange,
}) => {
  const { data: hierarchy, loading: loadingHierarchy } =
    useWarehouseHierarchy();

  // Build Cascader options from warehouse hierarchy
  const options = useMemo(() => {
    const toOptions = (items, level = 0) =>
      (items || []).map((item) => ({
        label: item.name || 'Sin nombre',
        value: item.id,
        children: Array.isArray(item.shelves)
          ? toOptions(item.shelves, level + 1)
          : Array.isArray(item.rows)
            ? toOptions(item.rows, level + 1)
            : Array.isArray(item.segments)
              ? toOptions(item.segments, level + 1)
              : undefined,
      }));

    return toOptions(hierarchy);
  }, [hierarchy]);

  // Convert from path string to cascader array value and back
  const cascaderValue = useMemo(() => {
    if (!value) return undefined; // show placeholder
    return value.split('/');
  }, [value]);

  const handleChange = (vals) => {
    if (!vals || vals.length === 0) {
      onChange(null); // Todas
      return;
    }
    onChange(vals.join('/'));
  };

  const disabled = loading || loadingHierarchy;

  return (
    <Bar>
      <Form
        layout="vertical"
        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}
      >
        <Form.Item label="Fecha">
          <DatePicker
            dates={dates}
            setDates={setDates}
            datesDefault={defaultDate}
          />
        </Form.Item>
        <Form.Item label="Ubicación">
          <Cascader
            allowClear
            changeOnSelect
            placeholder="Todas las ubicaciones"
            options={options}
            value={cascaderValue}
            onChange={handleChange}
            disabled={disabled}
            style={{ minWidth: 260, maxWidth: 380 }}
            displayRender={(labels) => {
              const full = Array.isArray(labels) ? labels.join('/') : '';
              const shortened = full ? shortenLocationPath(full) : '';
              return (
                <span
                  title={full}
                  style={{
                    display: 'inline-block',
                    maxWidth: 320,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle',
                  }}
                >
                  {shortened || 'Todas las ubicaciones'}
                </span>
              );
            }}
          />
        </Form.Item>

        <Form.Item label="Tipo">
          <Select
            style={{ minWidth: 160 }}
            value={type || 'all'}
            onChange={(v) => onTypeChange?.(v === 'all' ? null : v)}
            options={[
              { label: 'Todas', value: 'all' },
              { label: 'Entradas', value: 'in' },
              { label: 'Salidas', value: 'out' },
            ]}
            disabled={loading}
          />
        </Form.Item>

        {value && (
          <Button onClick={() => onChange(null)} type="text">
            Limpiar
          </Button>
        )}
      </Form>
    </Bar>
  );
};

MovementsFilterBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  dates: PropTypes.object.isRequired,
  setDates: PropTypes.func.isRequired,
  defaultDate: PropTypes.object,
  type: PropTypes.oneOf([null, 'in', 'out']),
  onTypeChange: PropTypes.func,
};

export default MovementsFilterBar;
