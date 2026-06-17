import { InvoiceTemplates } from '@/modules/invoice/public';

import { SectionHeader, SectionWrapper } from '../styles';

export const VisualStyleSection = () => (
  <SectionWrapper $withBottomSpace>
    <SectionHeader>
      <h3>Estilo Visual</h3>
      <p>Selecciona el formato que mejor se adapte a tu impresora.</p>
    </SectionHeader>
    <InvoiceTemplates onlySelector hidePreviewButton />
  </SectionWrapper>
);
