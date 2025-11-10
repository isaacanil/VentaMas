import React from 'react';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import DateUtils from '../../../../../../utils/date/dateUtils';
import { Badge } from '../../../../../component/Badge/Badge';
import { BadgeDate } from '../../../../../component/Badge/BadgeDate';
import { EnhancedDateDisplay } from '../../../../../component/Badge/BadgeDateStatus';
import { StatusBadge } from '../../../../../component/Badge/StatusBadge';
import { NoteButton } from '../../../../../component/NoteViewButton/NoteViewButton';
import { ShowFiles } from '../../../../../component/ShowFileButton/ShowFileButton';



type CellType = import('../../types/ColumnTypes').CellType;

interface CellRendererProps {
  type?: CellType;
  value: any;
  cellProps?: Record<string, any>;
  format?: 'price' | 'percentage' | 'currency';
}

export const CellRenderer: React.FC<CellRendererProps> = ({
  type = 'text',
  value,
  cellProps = {},
  format
}) => {
  const formattedValue = () => {
    switch (format) {
      case 'price':
        return useFormatPrice(Number(value));
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'currency':
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
      default:
        return value;
    }
  };

  switch (type) {
    case 'image':
      return (
        <ImageContainer>
          <CellImage src={value} alt="cell-image" {...cellProps} />
        </ImageContainer>
      );

    case 'number':
      return <span>{Number(value).toLocaleString(cellProps.locale || 'es-MX')}</span>;

    case 'status':
      return <StatusBadge status={value} />;

    case 'badge':
      return <Badge text={formattedValue()} />;

    case 'custom':
      return cellProps.render ? cellProps.render(value) : value;

    case 'date':
      const dateTime = DateUtils.convertMillisToLuxonDate(value);
      return <BadgeDate dateTime={dateTime} />;

    case 'dateStatus':
      return <EnhancedDateDisplay timestamp={value} />;

    case 'note':
      return <NoteButton value={value} />;

    case 'file':
      return <ShowFiles value={value} />;

    default:
      return <span>{formattedValue()}</span>;
  }
};

const ImageContainer = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CellImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;
