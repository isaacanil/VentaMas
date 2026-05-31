import { Input } from 'antd';

import { CompactFormItem, SectionHeader, SectionWrapper } from '../styles';

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
      <h3>Informacion Adicional</h3>
      <p>Personaliza el pie de pagina de tus documentos.</p>
    </SectionHeader>
    <CompactFormItem
      name="invoiceMessage"
      label="Mensaje en la factura"
      tooltip="Este mensaje aparecera en el pie de las facturas y cotizaciones."
    >
      <Input.TextArea
        rows={4}
        maxLength={300}
        onBlur={onBlur}
        disabled={isSaving}
        placeholder="Ej: Gracias por su preferencia y confianza..."
      />
    </CompactFormItem>
  </SectionWrapper>
);
