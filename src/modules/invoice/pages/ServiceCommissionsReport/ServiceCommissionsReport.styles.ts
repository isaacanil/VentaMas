import { ListBox } from '@heroui/react';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import {
  VmAlert,
  VmButton,
  VmCard,
  VmDateField,
  VmDateRangePicker,
  VmLabel,
  VmSelect,
  VmTable,
} from '@/components/heroui';

export const Page = styled(PageShell)`
  display: grid;
  grid-auto-rows: max-content;
  gap: var(--ds-space-5);
  padding: var(--ds-space-5);
  overflow-y: auto;
  background: var(--ds-color-bg-page);
`;

export const Header = styled.header`
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

export const HeaderTools = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  justify-items: end;

  @media (max-width: 860px) {
    justify-items: stretch;
    width: 100%;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (max-width: 860px) {
    width: 100%;
    justify-content: stretch;

    > * {
      flex: 1 1 180px;
    }
  }
`;

export const HeaderActionButton = styled(VmButton)``;

export const TitleBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

export const Title = styled.h1`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const Description = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(220px, 280px);
  gap: var(--ds-space-3);
  justify-content: flex-end;

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }
`;

export const FilterField = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

export const FilterLabel = styled(VmLabel)`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

export const DateRangeControl = styled(VmDateRangePicker)`
  width: 100%;
`;

export const DateGroup = styled(VmDateField.Group)`
  min-height: 38px;
`;

export const DateInputContainer = styled(VmDateField.InputContainer)`
  min-width: 0;
`;

export const CollaboratorSelect = styled(VmSelect)`
  width: 100%;
`;

export const CollaboratorListBox = styled(ListBox)`
  min-width: 260px;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: var(--ds-space-4);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled(VmCard)`
  padding: var(--ds-space-4);
`;

export const SummaryLabel = styled.div`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const SummaryValue = styled.div`
  margin-top: var(--ds-space-2);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const SummaryHint = styled.div`
  margin-top: var(--ds-space-1);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

export const ReportTableFrame = styled(VmCard)`
  min-width: 0;
  overflow: hidden;
`;

export const ReportTable = styled(VmTable)`
  width: 100%;
`;

export const ReportTableContent = styled(VmTable.Content)`
  min-width: 900px;
`;

export const ReportTableHeader = styled(VmTable.Header)`
  background: var(--ds-color-bg-subtle);
`;

export const TableText = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

export const TableTextStack = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const MutedText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const SmallMutedText = styled(MutedText)`
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

export const AmountCell = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-align: right;
`;

export const CommissionCell = styled(AmountCell)`
  color: var(--ds-color-state-success-text);
`;

export const TableState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  min-height: 96px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const Footer = styled(VmTable.Footer)`
  border-top: 1px solid var(--ds-color-border-subtle);
`;

export const FooterContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const FooterMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const ErrorAlert = styled(VmAlert)`
  border-color: var(--ds-color-state-danger);
  background: var(--ds-color-state-danger-subtle);
`;

export const ErrorTitle = styled(VmAlert.Title)`
  color: var(--ds-color-state-danger-text);
`;

export const ErrorDescription = styled(VmAlert.Description)`
  color: var(--ds-color-text-primary);
`;
