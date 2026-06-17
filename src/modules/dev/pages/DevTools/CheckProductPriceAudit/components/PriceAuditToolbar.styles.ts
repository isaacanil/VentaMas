import styled from 'styled-components';

type CountBadgeTone = 'success' | 'danger';
type FilterTone = 'equal' | 'mismatch' | 'all';
type ActionTone = 'dark' | 'sky' | 'blue';

const countBadgeColors: Record<CountBadgeTone, { background: string; color: string }> = {
  success: {
    background: '#eafaf1',
    color: '#0f7a3e',
  },
  danger: {
    background: '#fdecea',
    color: '#b71c1c',
  },
};

const filterBackgrounds: Record<FilterTone, string> = {
  equal: '#f0fdf4',
  mismatch: '#fef2f2',
  all: '#f8fafc',
};

const actionButtonColors: Record<ActionTone, { background: string; color: string }> = {
  dark: {
    background: '#111827',
    color: 'white',
  },
  sky: {
    background: '#0ea5e9',
    color: 'white',
  },
  blue: {
    background: '#0b5cff',
    color: 'white',
  },
};

export const ToolbarRoot = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 8px 0 16px;
`;

export const CountGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const CountBadge = styled.span<{ $tone: CountBadgeTone }>`
  padding: 4px 8px;
  color: ${({ $tone }) => countBadgeColors[$tone].color};
  background: ${({ $tone }) => countBadgeColors[$tone].background};
  border-radius: 6px;
`;

export const TotalCount = styled.span`
  margin-left: 8px;
  color: #555;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

export const FilterButton = styled.button<{ $active: boolean; $tone: FilterTone }>`
  padding: 6px 10px;
  background: ${({ $active, $tone }) => ($active ? filterBackgrounds[$tone] : 'white')};
  border: 1px solid #ddd;
  border-radius: 6px;
`;

export const ActionButton = styled.button<{ $tone: ActionTone }>`
  padding: 6px 10px;
  color: ${({ $tone }) => actionButtonColors[$tone].color};
  background: ${({ $tone }) => actionButtonColors[$tone].background};
  border: 1px solid #ddd;
  border-radius: 6px;
`;
