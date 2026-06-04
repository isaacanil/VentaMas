import { Form } from 'antd';

import {
  DimensionInputGroup,
  FullWidthInputNumber,
} from '../WarehouseForm.styles';

const WAREHOUSE_DIMENSION_FIELDS = [
  { label: 'Longitud', name: 'length', placeholder: 'Longitud' },
  { label: 'Ancho', name: 'width', placeholder: 'Ancho' },
  { label: 'Altura', name: 'height', placeholder: 'Altura' },
] as const;

export const WarehouseDimensionFields = () => (
  <DimensionInputGroup>
    {WAREHOUSE_DIMENSION_FIELDS.map((field) => (
      <Form.Item
        key={field.name}
        label={field.label}
        name={['dimension', field.name]}
      >
        <FullWidthInputNumber min={0} placeholder={field.placeholder} />
      </Form.Item>
    ))}
  </DimensionInputGroup>
);
