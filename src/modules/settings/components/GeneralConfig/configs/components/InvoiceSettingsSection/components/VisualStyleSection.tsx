import InvoiceTemplates from '@/modules/invoice/components/Invoice/components/InvoiceTemplates/InvoiceTemplates';

import { SectionHeader, SectionWrapper } from '../styles';

export const VisualStyleSection = () => (
  <SectionWrapper style={{ marginBottom: '24px' }}>
    <SectionHeader>
      <h3>Estilo Visual</h3>
      <p>Selecciona el formato que mejor se adapte a tu impresora.</p>
    </SectionHeader>
    <InvoiceTemplates onlySelector hidePreviewButton />
  </SectionWrapper>
);
