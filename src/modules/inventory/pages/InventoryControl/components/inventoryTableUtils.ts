import styled from 'styled-components';
import {
  formatDate,
  formatInputDate,
  normalizeExpirationValue,
} from '@/utils/inventory/dates';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { getEffectiveCount, getPersistedCount } from '@/utils/inventory/counts';
import { formatNumber } from '@/utils/inventory/format';
import type {
  LocationNamesMap,
  ResolvingMap,
  TimestampLike,
} from '@/utils/inventory/types';

export { formatDate, formatInputDate, normalizeExpirationValue };
export { getEffectiveCount, getPersistedCount };
export { formatNumber };

export function resolveLocationDisplay(
  locKey: string | null | undefined,
  fallbackLabel: string | null | undefined,
  locationNamesMap: LocationNamesMap,
  resolvingLocations: ResolvingMap,
) {
  const key = locKey || '';
  const mapLabel = key ? locationNamesMap[key] : '';
  const resolvedFromMap = mapLabel && mapLabel !== key;
  const resolvedFromFallback =
    fallbackLabel && fallbackLabel !== key ? fallbackLabel : '';
  const resolvedLabel = resolvedFromMap ? mapLabel : resolvedFromFallback;
  const isLoading = !resolvedLabel && !!(key && resolvingLocations[key]);
  const label =
    resolvedLabel ||
    (isLoading ? 'Cargando ubicación...' : 'Ubicación sin nombre');
  return { label, isLoading };
}

export function shortenLocationPath(path?: string) {
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

function truncateSegment(seg: string, limit = 14) {
  if (!seg) return '';
  if (seg.length <= limit) return seg;
  if (limit <= 1) return '…';
  return seg.slice(0, limit - 1) + '…';
}

// ===== Editors / Users Helpers =====
export function getTsMs(ts: TimestampLike) {
  if (!ts) return 0;
  try {
    if (ts instanceof Date) {
      return ts.getTime();
    }
    if (
      typeof ts === 'object' &&
      'toDate' in ts &&
      typeof ts.toDate === 'function'
    ) {
      return ts.toDate().getTime();
    }
    if (
      typeof ts === 'object' &&
      'seconds' in ts &&
      typeof ts.seconds === 'number'
    ) {
      return ts.seconds * 1000;
    }
    if (typeof ts === 'string' || typeof ts === 'number') {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
  } catch {
    return 0;
  }
}

export function formatUpdatedAt(value: TimestampLike) {
  const timestamp = getTsMs(value);
  if (!timestamp) return 'Sin registro de edición';

  const date = new Date(timestamp);
  const dateText = formatLocaleDate(date, {
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

interface DiffProps {
  $value: number;
}

export const Diff = styled.span<DiffProps>`
  font-weight: ${({ $value }) => ($value !== 0 ? 600 : 400)};
  color: ${({ $value }) =>
    $value === 0 ? '#374151' : $value > 0 ? '#059669' : '#dc2626'};
`;

// Contenedor de tags reutilizable
export const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export { Tag, Tooltip } from 'antd';
export { EditorsList } from './inventoryTableComponents';
