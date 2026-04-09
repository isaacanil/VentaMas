import type { ReactNode } from 'react';

import { SectionHeader, SectionWrapper } from '../styles';

interface DueDateSectionProps {
  children: ReactNode;
}

export const DueDateSection = ({ children }: DueDateSectionProps) => (
  <SectionWrapper style={{ marginBottom: '24px' }}>
    <SectionHeader>
      <h3>Términos y Plazos</h3>
      <p>Configura las reglas de vencimiento para tus clientes.</p>
    </SectionHeader>
    {children}
  </SectionWrapper>
);
