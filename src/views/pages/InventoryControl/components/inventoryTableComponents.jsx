import { Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { formatUpdatedAt } from './inventoryTableUtils.js';

const UserBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #111827;
  font-size: 12px;
`;

const EditorsInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
`;

const ExtraEditors = styled.span`
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
`;

export function EditorsList({ editors, loading }) {
  if (loading) return <span style={{ opacity: 0.6, fontSize: 11 }}>Cargando…</span>;
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
        <Tooltip title={editors.slice(3).map((editor) => editor.name).join(', ')}>
          <ExtraEditors>+{extra}</ExtraEditors>
        </Tooltip>
      )}
    </EditorsInline>
  );
}

export function SummaryBar({ stats = [], justify = 'flex-start', style = {} }) {
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
