import { Button } from '@heroui/react';
import styled from 'styled-components';

import { FileExcelOutlined } from '@/constants/icons/antd';

interface GeneralLedgerHeaderProps {
  exporting: boolean;
  periodLabel: string | null;
  onAuxiliary: () => void;
  onExport: () => void;
}

export const GeneralLedgerHeader = ({
  exporting,
  periodLabel,
  onAuxiliary,
  onExport,
}: GeneralLedgerHeaderProps) => (
  <PageHeader>
    <HeaderCopy>
      <SectionTitle>Libro Mayor</SectionTitle>
      <SectionText>
        Movimientos por cuenta contable{periodLabel ? ` — ${periodLabel}` : ''}
      </SectionText>
    </HeaderCopy>

    <HeaderActions>
      <Button variant="secondary" isPending={exporting} onPress={onExport}>
        <FileExcelOutlined />
        Exportar
      </Button>
      <Button variant="tertiary" onPress={onAuxiliary}>
        Auxiliar
      </Button>
    </HeaderActions>
  </PageHeader>
);

const PageHeader = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--ds-space-4);
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: clamp(1.5rem, 1.7vw, 1.8rem);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const SectionText = styled.p`
  margin: 6px 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
`;
