import { Button, Cascader, Form, Select } from 'antd';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import styled from 'styled-components';

import { useWarehouseHierarchy } from '@/firebase/warehouse/warehouseNestedServise';
import { shortenLocationPath } from '@/modules/inventory/pages/InventoryControl/components/inventoryTableUtils';
import { DatePicker } from '@/components/ui/Dates/DatePicker/DatePicker';

type MovementFilterType = 'in' | 'out' | null;

type DateRange = {
  startDate?: number | null;
  endDate?: number | null;
};

type HierarchyNode = {
  id?: string;
  name?: string | null;
  shelves?: HierarchyNode[];
  rows?: HierarchyNode[];
  segments?: HierarchyNode[];
};

type CascaderOption = {
  label: string;
  value: string;
  children?: CascaderOption[];
};

interface MovementsFilterBarProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  loading?: boolean;
  dates: DateRange;
  setDates: Dispatch<SetStateAction<DateRange>>;
  defaultDate?: DateRange;
  type?: MovementFilterType;
  onTypeChange?: (value: MovementFilterType) => void;
}

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
}: MovementsFilterBarProps) => {
  const { data: hierarchy = [], loading: loadingHierarchy } =
    useWarehouseHierarchy();

  // Build Cascader options from warehouse hierarchy
  const options = useMemo<CascaderOption[]>(() => {
    const toOptions = (items: HierarchyNode[]) =>
      (items || []).flatMap((item) => {
        if (!item.id) return [];
        return [
          {
            label: item.name || 'Sin nombre',
            value: item.id,
            children: Array.isArray(item.shelves)
              ? toOptions(item.shelves)
              : Array.isArray(item.rows)
                ? toOptions(item.rows)
                : Array.isArray(item.segments)
                  ? toOptions(item.segments)
                  : undefined,
          },
        ];
      });

    return toOptions(hierarchy as HierarchyNode[]);
  }, [hierarchy]);

  // Convert from path string to cascader array value and back
  const cascaderValue = useMemo<string[] | undefined>(() => {
    if (!value) return undefined; // show placeholder
    return value.split('/');
  }, [value]);

  const handleChange = (vals?: Array<string | number>) => {
    if (!vals || vals.length === 0) {
      onChange(null); // Todas
      return;
    }
    onChange(vals.map(String).join('/'));
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
            onChange={(v: 'all' | 'in' | 'out') =>
              onTypeChange?.(v === 'all' ? null : v)
            }
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

export default MovementsFilterBar;
