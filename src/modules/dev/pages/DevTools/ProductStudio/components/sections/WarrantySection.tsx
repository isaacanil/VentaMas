import { Form, InputNumber, Select, Switch, Tooltip } from 'antd';
import styled from 'styled-components';

import { InfoCircleOutlined } from '@/constants/icons/antd';
import {
  SectionCard,
  SectionHeader,
  SectionTitle,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';

const WarrantyCard = styled(SectionCard)`
  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
`;

const CompactFields = styled.div`
  display: flex;
  align-items: end;
  gap: 12px;
`;

interface WarrantySectionProps {
  domId: string;
}

export const WarrantySection = ({ domId }: WarrantySectionProps) => (
  <WarrantyCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Garantía y cobertura</SectionTitle>
      <HeaderRight>
        <Tooltip title="Indica si este producto incluye garantía o servicio de mantenimiento.">
          <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
        </Tooltip>
        <Form.Item
          name={['warranty', 'status']}
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Switch checkedChildren="Sí" unCheckedChildren="No" />
        </Form.Item>
      </HeaderRight>
    </SectionHeader>
    <Form.Item noStyle dependencies={[['warranty', 'status']]}>
      {({ getFieldValue }) => {
        const isActive = getFieldValue(['warranty', 'status']);

        return (
          <CompactFields style={{ opacity: isActive ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <Form.Item
              name={['warranty', 'quantity']}
              label="Duración"
              style={{ marginBottom: 0, width: 100 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} disabled={!isActive} />
            </Form.Item>
            <Form.Item
              name={['warranty', 'unit']}
              label="Unidad"
              style={{ marginBottom: 0, width: 140 }}
            >
              <Select
                disabled={!isActive}
                options={[
                  { value: 'days', label: 'Días' },
                  { value: 'weeks', label: 'Semanas' },
                  { value: 'months', label: 'Meses' },
                  { value: 'years', label: 'Años' },
                ]}
              />
            </Form.Item>
          </CompactFields>
        );
      }}
    </Form.Item>
  </WarrantyCard>
);
