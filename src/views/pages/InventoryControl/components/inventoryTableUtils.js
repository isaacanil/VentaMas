import styled from 'styled-components';

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

export function formatUpdatedAt(value) {
  const timestamp = getTsMs(value);
  if (!timestamp) return 'Sin registro de edición';

  const date = new Date(timestamp);
  const dateText = date.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const timeText = date.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Actualizado el ${dateText} a las ${timeText}`;
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

export { Tag, Tooltip } from 'antd';
export { EditorsList } from './inventoryTableComponents.jsx';
