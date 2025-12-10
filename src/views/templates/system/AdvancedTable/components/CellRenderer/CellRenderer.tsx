import React from 'react';
import styled from 'styled-components';

import DateUtils from '../../../../../../utils/date/dateUtils';
import { Badge } from '../../../../../component/Badge/Badge';
import { BadgeDate } from '../../../../../component/Badge/BadgeDate';
import { EnhancedDateDisplay } from '../../../../../component/Badge/BadgeDateStatus';
import { StatusBadge } from '../../../../../component/Badge/StatusBadge';
import { NoteButton } from '../../../../../component/NoteViewButton/NoteViewButton';
import { ShowFiles } from '../../../../../component/ShowFileButton/ShowFileButton';

import type { CellType } from '../../types/ColumnTypes';
import type { ImgHTMLAttributes, ReactNode } from 'react';

import { formatPrice } from '@/utils/format';

type FormatOption = 'price' | 'percentage' | 'currency';

type RendererProps = ImgHTMLAttributes<HTMLImageElement> & {
  locale?: string;
  render?: (value: unknown) => ReactNode;
};

interface CellRendererProps {
  type?: CellType;
  value?: unknown;
  cellProps?: RendererProps;
  format?: FormatOption;
}

const toNumber = (input: unknown): number => {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof input === 'boolean') return input ? 1 : 0;
  if (typeof input === 'bigint') return Number(input);
  return 0;
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint')
    return String(value);
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (value instanceof Date) return value.toISOString();
  return '';
};

const formatValue = (value: unknown, format?: FormatOption): string => {
  switch (format) {
    case 'price':
      return formatPrice(toNumber(value));
    case 'percentage':
      return `${toNumber(value).toFixed(2)}%`;
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(toNumber(value));
    default:
      return toText(value);
  }
};

const parseTimestamp = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const CellRenderer: React.FC<CellRendererProps> = ({
  type = 'text',
  value,
  cellProps,
  format,
}) => {
  switch (type) {
    case 'image': {
      const imageSrc = typeof value === 'string' ? value : '';
      return (
        <ImageContainer>
          <CellImage src={imageSrc} alt="cell-image" {...cellProps} />
        </ImageContainer>
      );
    }

    case 'number': {
      const locale = cellProps?.locale ?? 'es-MX';
      return <span>{toNumber(value).toLocaleString(locale)}</span>;
    }

    case 'status':
      return <StatusBadge status={toText(value)} />;

    case 'badge':
      return <Badge text={formatValue(value, format)} />;

    case 'custom':
      return typeof cellProps?.render === 'function' ? (
        cellProps.render(value)
      ) : (
        <span>{formatValue(value, format)}</span>
      );

    case 'date': {
      const timestamp = parseTimestamp(value);
      const dateTime =
        typeof timestamp === 'number'
          ? DateUtils.convertMillisToLuxonDate(timestamp)
          : null;
      return <BadgeDate dateTime={dateTime ?? null} />;
    }

    case 'dateStatus': {
      const timestamp = parseTimestamp(value);
      return <EnhancedDateDisplay timestamp={timestamp} />;
    }

    case 'note':
      return <NoteButton value={value} />;

    case 'file':
      return <ShowFiles value={Array.isArray(value) ? value : []} />;

    default:
      return <span>{formatValue(value, format)}</span>;
  }
};

const ImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
`;

const CellImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;
