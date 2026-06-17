import { Card, InputNumber, Form, Checkbox, Select } from 'antd';
import React from 'react';

import { warrantyOptions } from '@/domain/products/productDefaults';

import { Group } from './WarrantyInfo.styles';

export const WarrantyInfo = () => {
  return (
    <Card title="Garantía" size="small">
      <Form.Item
        name={['warranty', 'status']}
        style={{ marginBottom: 0 }}
        valuePropName="checked"
      >
        <Checkbox>Aplica garantía</Checkbox>
      </Form.Item>
      <Group>
        <Form.Item name={['warranty', 'quantity']} style={{ marginBottom: 0 }}>
          <InputNumber
            placeholder="Cantidad"
            style={{
              width: '100%',
            }}
          />
        </Form.Item>
        <Form.Item
          name={['warranty', 'unit']}
          style={{
            marginBottom: 0,
          }}
        >
          <Select
            placeholder="Unidad"
            options={warrantyOptions.map((option) => ({
              value: option?.value,
              label: option?.label,
            }))}
          />
        </Form.Item>
      </Group>
    </Card>
  );
};
