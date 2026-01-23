import { BarcodeOutlined } from '@/constants/icons/antd';
import { Divider, InputNumber, Select, Switch } from 'antd';
import { Form } from 'antd';

import { unitsOfMeasure } from '@/constants/unitsOfMeasure';
import {
  DividerLabel,
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SwitchField,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';

interface InventorySectionProps {
  domId: string;
}

export const InventorySection = ({ domId }: InventorySectionProps) => (
  <SectionCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Inventario</SectionTitle>
      <SectionDescription>
        Define cómo se moverá el stock y los permisos de venta.
      </SectionDescription>
    </SectionHeader>
    <FieldGrid>
      <SwitchField
        name="trackInventory"
        label="Controlar inventario"
        tooltip="Activa para hacer seguimiento de las existencias de este producto."
        valuePropName="checked"
      >
        <Switch />
      </SwitchField>
      <SwitchField
        name="restrictSaleWithoutStock"
        label="Bloquear sin stock"
        tooltip="Restringe la venta cuando no hay unidades disponibles."
        valuePropName="checked"
      >
        <Switch />
      </SwitchField>
      <Form.Item
        name="stock"
        label="Stock disponible"
        rules={[{ required: true, message: 'Indica el stock inicial.' }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="packSize"
        label="Unidades por empaque"
        rules={[{ required: true, message: 'Define el empaque.' }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
    </FieldGrid>

    <Divider orientation="left">
      <DividerLabel>
        <BarcodeOutlined /> Venta por peso
      </DividerLabel>
    </Divider>

    <FieldGrid>
      <SwitchField
        name={['weightDetail', 'isSoldByWeight']}
        label="Se vende por peso"
        tooltip="Activa si este producto se pesa al momento de la venta."
        valuePropName="checked"
      >
        <Switch />
      </SwitchField>
      <Form.Item
        noStyle
        shouldUpdate={(prev, curr) =>
          prev?.weightDetail?.isSoldByWeight !==
          curr?.weightDetail?.isSoldByWeight
        }
      >
        {({ getFieldValue }) =>
          getFieldValue(['weightDetail', 'isSoldByWeight']) ? (
            <>
              <Form.Item
                name={['weightDetail', 'weight']}
                label="Peso promedio"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0.00"
                />
              </Form.Item>
              <Form.Item name={['weightDetail', 'weightUnit']} label="Unidad">
                <Select placeholder="Selecciona unidad">
                  {unitsOfMeasure.map((unit) => (
                    <Select.Option key={unit.unit} value={unit.unit}>
                      {unit.unit}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          ) : null
        }
      </Form.Item>
    </FieldGrid>
  </SectionCard>
);

