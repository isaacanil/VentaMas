import { Switch } from 'antd';

import {
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  SwitchField,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';

export const ComboAvailabilitySection = () => (
  <SectionCard>
    <SectionHeader>
      <SectionTitle level={4}>Disponibilidad del combo</SectionTitle>
      <SectionDescription>
        Controla si la venta se bloquea cuando falta stock en algún componente.
      </SectionDescription>
    </SectionHeader>
    <SwitchField
      name="restrictSaleWithoutStock"
      label="Bloquear venta si faltan componentes"
      tooltip="Cuando está activo, la venta se bloquea si falta stock en algún producto de la receta."
      valuePropName="checked"
    >
      <Switch />
    </SwitchField>
  </SectionCard>
);
