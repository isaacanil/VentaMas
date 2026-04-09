import { Form, Input } from 'antd';

import { SectionHeader, SectionWrapper } from '../styles';

interface AdditionalInfoSectionProps {
  isSaving: boolean;
  onBlur: () => void;
}

export const AdditionalInfoSection = ({
  isSaving,
  onBlur,
}: AdditionalInfoSectionProps) => (
  <SectionWrapper>
    <SectionHeader>
      <h3>Información Adicional</h3>
      <p>Personaliza el pie de página de tus documentos.</p>
    </SectionHeader>
    <Form.Item
      name="invoiceMessage"
      label="Mensaje en la factura"
      tooltip="Este mensaje aparecerá en el pie de las facturas y cotizaciones."
      style={{ marginBottom: 0 }}
    >
      <Input.TextArea
        rows={4}
        maxLength={300}
        onBlur={onBlur}
        disabled={isSaving}
        placeholder="Ej: 'Gracias por su preferencia y confianza...'"
      />
    </Form.Item>
  </SectionWrapper>
);
