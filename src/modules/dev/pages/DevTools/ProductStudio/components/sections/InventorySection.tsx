import { BarcodeOutlined, InfoCircleOutlined } from '@/constants/icons/antd';
import { Alert, InputNumber, Select, Switch, Tooltip } from 'antd';
import { Form } from 'antd';
import styled from 'styled-components';

import { unitsOfMeasure } from '@/domain/products/unitsOfMeasure';
import {
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SwitchField,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';

const SubSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 12px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
`;

const SubSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  font-weight: 600;
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

interface InventorySectionProps {
  domId: string;
  isUpdateMode: boolean;
  isRawMaterial?: boolean;
}

export const InventorySection = ({
  domId,
  isUpdateMode,
  isRawMaterial = false,
}: InventorySectionProps) => (
  <SectionCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Inventario</SectionTitle>
      <SectionDescription>
        {isRawMaterial
          ? 'Define existencias y empaque interno.'
          : 'Define cómo se moverá el stock y los permisos de venta.'}
      </SectionDescription>
    </SectionHeader>
    {isUpdateMode && (
      <Alert
        type="info"
        showIcon
        message="El stock se ajusta desde los movimientos de inventario."
        style={{ marginBottom: 16 }}
      />
    )}
    <FieldGrid>
      <SwitchField
        name="trackInventory"
        label="Controlar inventario"
        tooltip="Activa para hacer seguimiento de las existencias de este producto."
        valuePropName="checked"
      >
        <Switch disabled={isRawMaterial} />
      </SwitchField>
      {!isRawMaterial ? (
        <SwitchField
          name="restrictSaleWithoutStock"
          label="Bloquear sin stock"
          tooltip="Restringe la venta cuando no hay unidades disponibles."
          valuePropName="checked"
        >
          <Switch />
        </SwitchField>
      ) : null}
      <Form.Item
        name="stock"
        label="Stock disponible"
        help={
          isUpdateMode
            ? 'Bloqueado al editar para mantener trazabilidad de existencias.'
            : undefined
        }
        rules={[{ required: true, message: 'Indica el stock inicial.' }]}
      >
        <InputNumber min={0} disabled={isUpdateMode} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="packSize"
        label="Unidades por empaque"
        rules={[{ required: true, message: 'Define el empaque.' }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
    </FieldGrid>

    {!isRawMaterial ? (
      <>
        <SubSectionHeader>
          <SubSectionTitle>
            <BarcodeOutlined /> Venta por peso
          </SubSectionTitle>
          <HeaderRight>
            <Tooltip title="Activa si este producto se pesa al momento de la venta.">
              <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
            </Tooltip>
            <Form.Item
              name={['weightDetail', 'isSoldByWeight']}
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </HeaderRight>
        </SubSectionHeader>

        <Form.Item noStyle dependencies={[['weightDetail', 'isSoldByWeight']]}>
          {({ getFieldValue }) => {
            const isSoldByWeight = getFieldValue([
              'weightDetail',
              'isSoldByWeight',
            ]);

            return (
              <CompactFields
                style={{
                  opacity: isSoldByWeight ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
              >
                <Form.Item
                  name={['weightDetail', 'weight']}
                  label="Peso promedio"
                  style={{ marginBottom: 0, width: 120 }}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    disabled={!isSoldByWeight}
                  />
                </Form.Item>
                <Form.Item
                  name={['weightDetail', 'weightUnit']}
                  label="Unidad"
                  dependencies={[['weightDetail', 'isSoldByWeight']]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          getFieldValue(['weightDetail', 'isSoldByWeight']) &&
                          !value
                        ) {
                          return Promise.reject(
                            new Error('Seleccionar una unidad de medida.'),
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  style={{ marginBottom: 0, width: 140 }}
                >
                  <Select
                    placeholder="Selecciona"
                    disabled={!isSoldByWeight}
                    options={unitsOfMeasure.map((unit) => ({
                      value: unit.unit,
                      label: unit.unit,
                    }))}
                  />
                </Form.Item>
              </CompactFields>
            );
          }}
        </Form.Item>
      </>
    ) : null}
  </SectionCard>
);
