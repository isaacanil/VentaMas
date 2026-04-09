import styled from 'styled-components';

import type { AccountingEventType } from '@/types/accounting';

export interface AccountingEventCoverageItem {
  activeProfilesCount: number;
  description: string;
  eventType: AccountingEventType;
  label: string;
  moduleLabel: string;
  totalProfilesCount: number;
}

interface AccountingEventCoverageListProps {
  items: AccountingEventCoverageItem[];
  selectedEventType: AccountingEventType;
  onSelect: (eventType: AccountingEventType) => void;
}

const getCoverageLabel = ({
  activeProfilesCount,
  totalProfilesCount,
}: AccountingEventCoverageItem) => {
  if (activeProfilesCount > 0) {
    return `${activeProfilesCount} activo${activeProfilesCount === 1 ? '' : 's'}`;
  }

  if (totalProfilesCount > 0) {
    return 'Solo inactivos';
  }

  return 'Sin configurar';
};

const getCoverageTone = ({
  activeProfilesCount,
  totalProfilesCount,
}: AccountingEventCoverageItem) => {
  if (activeProfilesCount > 0) {
    return 'ready';
  }

  if (totalProfilesCount > 0) {
    return 'warning';
  }

  return 'idle';
};

export const AccountingEventCoverageList = ({
  items,
  selectedEventType,
  onSelect,
}: AccountingEventCoverageListProps) => {
  const readyEventsCount = items.filter((item) => item.activeProfilesCount > 0).length;

  return (
    <Panel>
      <Header>
        <HeaderCopy>
          <Title>Eventos contables</Title>
          <Description>
            {readyEventsCount} de {items.length} eventos con cobertura activa.
          </Description>
        </HeaderCopy>
      </Header>

      <List>
        {items.map((item) => {
          const tone = getCoverageTone(item);
          const selected = item.eventType === selectedEventType;

          return (
            <RowButton
              key={item.eventType}
              type="button"
              $selected={selected}
              $tone={tone}
              onClick={() => onSelect(item.eventType)}
            >
              <RowBody>
                <RowHeading>
                  <strong>{item.label}</strong>
                  <span>{item.moduleLabel}</span>
                </RowHeading>
              </RowBody>

              <RowAside>
                <CoverageLabel>{getCoverageLabel(item)}</CoverageLabel>
              </RowAside>
            </RowButton>
          );
        })}
      </List>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  flex-shrink: 0;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-secondary);
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const RowButton = styled.button<{
  $selected: boolean;
  $tone: 'idle' | 'ready' | 'warning';
}>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: ${(props) =>
    props.$selected ? 'var(--ds-color-interactive-selected-bg)' : 'transparent'};
  box-shadow: inset 3px 0 0
    ${(props) => {
      if (props.$selected) {
        return 'var(--ds-color-interactive-selected-border)';
      }

      if (props.$tone === 'ready') {
        return 'var(--ds-color-state-success)';
      }

      if (props.$tone === 'warning') {
        return 'var(--ds-color-state-warning)';
      }

      return 'transparent';
    }};
  text-align: left;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    background: ${(props) =>
      props.$selected
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-interactive-hover-bg)'};
  }
`;

const RowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const RowHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }

  span {
    font-size: var(--ds-font-size-xs);
    color: var(--ds-color-text-secondary);
  }
`;

const RowAside = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-end;
  text-align: right;
`;

const CoverageLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;
