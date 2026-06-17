import styled from 'styled-components';

import type { AdvancedTableColumn } from '../../types/AdvancedTableTypes';
import type { TableRow } from '../../types/ColumnTypes';

export const ExpanderButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--gray-7);
  cursor: pointer;
  background: transparent;
  border: none;

  &:hover {
    color: var(--gray-9);
  }
`;

export const ExpandedRow = styled.div`
  grid-column: 1 / -1;
  padding: 8px 12px;
  background: #fafafa;
  border-right: 2px solid var(--gray-3);
  border-bottom: 1px dashed var(--gray-3);
  border-left: 2px solid var(--gray-3);
`;

type StyledColumn = AdvancedTableColumn<TableRow>;

export const Row = styled.div<{ $columns: StyledColumn[] }>`
  position: relative;
  display: grid;
  grid-template-columns: ${(props) => {
    if (!props.$columns.length) return '1fr';

    const template = props.$columns.map((col) => {
      const minWidth = col.minWidth || '100px';
      const maxWidth = col.maxWidth || '1fr';

      return `minmax(${minWidth}, ${maxWidth})`;
    });

    const value = template.join(' ');
    return value || '1fr';
  }};
  gap: 0.6em;
  align-items: center;
  width: 100%;
  min-width: fit-content;

  &[data-border='on'] {
    border-bottom: 1px solid var(--row-border-color, #f0f0f0);
  }
`;
