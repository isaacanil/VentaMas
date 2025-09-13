import React from 'react';
import styled from 'styled-components';
import { Tag, Tooltip } from 'antd';

// ===== Formatting Helpers =====
export function formatNumber(n) {
  const num = Number(n ?? 0);
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(num);
}

export function formatDate(d) {
  if (!d) return '';
  try {
    let date;
    if (d instanceof Date) date = d; else if (d?.toDate) date = d.toDate();
    else if (typeof d === 'object' && typeof d.seconds === 'number') date = new Date(d.seconds * 1000);
    else date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return ''; }
}

export function formatInputDate(d) {
  if (!d) return '';
  try {
    let date;
    if (d instanceof Date) date = d;
    else if (d?.toDate) date = d.toDate();
    else if (typeof d === 'object' && typeof d.seconds === 'number') date = new Date(d.seconds * 1000);
    else if (typeof d === 'string') {
      // ISO directo
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      // dd/mm/yyyy → yyyy-mm-dd
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        const [dd, mm, yyyy] = d.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      // yyyy/mm/dd → yyyy-mm-dd (por si acaso)
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) {
        const [yyyy, mm, dd] = d.split('/');
        return `${yyyy}-${mm}-${dd}`;
      }
      // fallback
      date = new Date(d);
    } else {
      date = new Date(d);
    }
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  } catch { return ''; }
}

export function shortenLocationPath(path) {
  if (!path || typeof path !== 'string') return path;
  if (!path.includes('/')) return path;
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return truncateSegment(parts[0]);
  const MAX_SEG_LEN = 14;
  const first = truncateSegment(parts[0], MAX_SEG_LEN);
  const last = truncateSegment(parts[parts.length - 1], MAX_SEG_LEN);
  if (parts.length <= 2) return `${first}/${last}`;
  return `${first}/.../${last}`;
}

function truncateSegment(seg, limit = 14) {
  if (!seg) return '';
  if (seg.length <= limit) return seg;
  if (limit <= 1) return '…';
  return seg.slice(0, limit - 1) + '…';
}

// ===== Editors / Users Helpers =====
export function getTsMs(ts) {
  if (!ts) return 0;
  try {
    if (ts?.toDate) return ts.toDate().getTime();
    if (typeof ts === 'object' && typeof ts.seconds === 'number') return ts.seconds * 1000;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  } catch { return 0; }
}

export function formatUpdatedAt(ts) {
  try {
    if (!ts) return 'Actualizado recientemente';
    const date = ts?.toDate ? ts.toDate() : new Date(ts?.seconds ? ts.seconds * 1000 : ts);
    if (!date || isNaN(date.getTime())) return 'Actualizado recientemente';
    return `Últ. ed.: ${date.toLocaleString('es-PE')}`;
  } catch { return 'Actualizado recientemente'; }
}

export const Diff = styled.span`
  color: ${({ $value }) => $value === 0 ? '#374151' : ($value > 0 ? '#059669' : '#dc2626')};
  font-weight: ${({ $value }) => $value !== 0 ? 600 : 400};
`;

// Contenedor de tags reutilizable
export const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

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
  if (loading) return <span style={{ opacity: .6, fontSize: 11 }}>Cargando…</span>;
  if (!editors?.length) return <span>-</span>;
  const shown = editors.slice(0, 3);
  const extra = editors.length - shown.length;
  return (
    <EditorsInline>
      {shown.map(e => (
        <Tooltip key={e.uid} title={formatUpdatedAt(e.updatedAt)}>
          <UserBadge>{e.name}</UserBadge>
        </Tooltip>
      ))}
      {extra > 0 && <Tooltip title={editors.slice(3).map(e => e.name).join(', ')}><ExtraEditors>+{extra}</ExtraEditors></Tooltip>}
    </EditorsInline>
  );
}

export { Tag, Tooltip };

// ===== Summary Bar Component =====
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
      {stats.map((s, idx) => (
        <div key={idx} style={{ minWidth: 120 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', opacity: .65, fontWeight: 600 }}>{s.label}</div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
