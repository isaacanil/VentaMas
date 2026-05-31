import type { ReactNode } from 'react';

import { SectionHeader, SectionWrapper } from '../styles';

interface DueDateSectionProps {
  children: ReactNode;
}

export const DueDateSection = ({ children }: DueDateSectionProps) => (
  <SectionWrapper $withBottomSpace>
    <SectionHeader>
      <h3>Terminos y Plazos</h3>
      <p>Configura las reglas de vencimiento para tus clientes.</p>
    </SectionHeader>
    {children}
  </SectionWrapper>
);
