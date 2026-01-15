// @ts-nocheck
import { Form, InputNumber, Select, Switch } from 'antd';
import styled from 'styled-components';

import {
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SwitchField,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';

const WarrantyCard = styled(SectionCard)`
  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;

export const WarrantySection = ({ domId }) => (
  <WarrantyCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Garantía y cobertura</SectionTitle>
      <SectionDescription>
        Define si el producto cuenta con garantía o mantenimiento.
      </SectionDescription>
    </SectionHeader>
    <FieldGrid>
      <SwitchField
        name={['warranty', 'status']}
        label="Garantía activa"
        tooltip="Indica si este producto incluye garantía o servicio de mantenimiento."
        valuePropName="checked"
      >
        <Switch />
      </SwitchField>
      <Form.Item name={['warranty', 'quantity']} label="Duración">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name={['warranty', 'unit']} label="Unidad de tiempo">
        <Select
          options={[
            { value: 'days', label: 'Días' },
            { value: 'weeks', label: 'Semanas' },
            { value: 'months', label: 'Meses' },
            { value: 'years', label: 'Años' },
          ]}
        />
      </Form.Item>
    </FieldGrid>
  </WarrantyCard>
);

