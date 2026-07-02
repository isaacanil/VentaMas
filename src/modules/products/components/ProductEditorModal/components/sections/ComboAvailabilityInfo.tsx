import { Card, Checkbox, Form } from 'antd';

export const ComboAvailabilityInfo = () => (
  <Card title="Disponibilidad del combo" size="small">
    <Form.Item
      name="restrictSaleWithoutStock"
      label=""
      valuePropName="checked"
      help="Cuando está activo, la venta se bloquea si falta stock en algún componente."
    >
      <Checkbox>Bloquear venta si faltan componentes</Checkbox>
    </Form.Item>
  </Card>
);
