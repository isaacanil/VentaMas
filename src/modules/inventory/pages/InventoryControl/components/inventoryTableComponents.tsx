import { Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { formatUpdatedAt } from './inventoryTableUtils';

import type { InventoryEditorInfo } from '@/utils/inventory/types';

const UserBadge = styled.span`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  color: #111827;
  background: #f3f4f6;
  border-radius: 999px;
`;

const EditorsInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
`;

const ExtraEditors = styled.span`
  padding: 2px 6px;
  font-size: 11px;
  color: #374151;
  background: #e5e7eb;
  border-radius: 999px;
`;

interface EditorsListProps {
  editors?: InventoryEditorInfo[];
  loading?: boolean;
}

export function EditorsList({ editors, loading }: EditorsListProps) {
  if (loading)
    return <span style={{ opacity: 0.6, fontSize: 11 }}>Cargando…</span>;
  if (!editors?.length) return <span>-</span>;
  const shown = editors.slice(0, 3);
  const extra = editors.length - shown.length;
  return (
    <EditorsInline>
      {shown.map((editor) => (
        <Tooltip key={editor.uid} title={formatUpdatedAt(editor.updatedAt)}>
          <UserBadge>{editor.name}</UserBadge>
        </Tooltip>
      ))}
      {extra > 0 && (
        <Tooltip
          title={editors
            .slice(3)
            .map((editor) => editor.name)
            .join(', ')}
        >
          <ExtraEditors>+{extra}</ExtraEditors>
        </Tooltip>
      )}
    </EditorsInline>
  );
}

interface SummaryStat {
  label: string;
  value: React.ReactNode;
}
interface SummaryBarProps {
  stats?: SummaryStat[];
  justify?: React.CSSProperties['justifyContent'];
  style?: React.CSSProperties;
}

const EMPTY_SUMMARY_STATS: SummaryStat[] = [];
const EMPTY_STYLE: React.CSSProperties = {};

export function SummaryBar({
  stats = EMPTY_SUMMARY_STATS,
  justify = 'flex-start',
  style = EMPTY_STYLE,
}: SummaryBarProps) {
  if (!stats.length) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 32,
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '10px 14px',
        alignItems: 'stretch',
        justifyContent: justify,
        ...style,
      }}
    >
      {stats.map((stat, idx) => (
        <div key={idx} style={{ minWidth: 120 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.5px',
              opacity: 0.65,
              fontWeight: 600,
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
