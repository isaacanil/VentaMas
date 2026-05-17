import { Button } from '@heroui/react';
import styled from 'styled-components';

import { VmTooltip } from '@/components/heroui';
import { FileExcelOutlined, InfoCircleOutlined } from '@/constants/icons/antd';

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
      <TitleRow>
        <SectionTitle>Libro Mayor</SectionTitle>
        <VmTooltip>
          <HeaderTooltipTrigger aria-label="Ayuda sobre el Libro Mayor">
            <InfoCircleOutlined aria-hidden />
          </HeaderTooltipTrigger>
          <VmTooltip.Content showArrow placement="right">
            <VmTooltip.Arrow />
            Muestra movimientos contables por cuenta, con saldo inicial, debitos,
            creditos y saldo acumulado segun los filtros activos.
          </VmTooltip.Content>
        </VmTooltip>
      </TitleRow>
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

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: clamp(1.5rem, 1.7vw, 1.8rem);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const HeaderTooltipTrigger = styled(VmTooltip.Trigger)`
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-secondary);
  cursor: help;
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);

  &:hover {
    color: var(--ds-color-text-primary);
    border-color: var(--ds-color-border-strong);
  }

  &:focus-visible {
    border-color: var(--ds-color-border-focus);
    outline: none;
    box-shadow: 0 0 0 3px rgb(22 119 255 / 24%);
  }
`;

const SectionText = styled.p`
  margin: 6px 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-normal);
`;
