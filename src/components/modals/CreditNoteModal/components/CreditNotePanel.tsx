import {
  EyeOutlined,
  DownOutlined,
  RightOutlined,
  CalendarOutlined,
} from '@/constants/icons/antd';
import { Button } from 'antd';
import React, { useState, memo } from 'react';
import styled, { css, type DefaultTheme } from 'styled-components';

import { formatDate } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import { getTotalPrice } from '@/utils/pricing';

import type { CreditNoteRecord } from '@/types/creditNote';
import type { TimestampLike } from '@/utils/date/types';

type CreditNoteViewRecord = CreditNoteRecord & {
  date?: TimestampLike;
  currency?: string;
};

interface CreditNotePanelProps {
  creditNote: CreditNoteViewRecord;
  onNavigateNote?: (
    note: CreditNoteViewRecord,
    e?: React.MouseEvent<HTMLElement>,
  ) => void;
  isExpanded?: boolean;
  isMobile?: boolean;
}

type CreditNoteTheme = DefaultTheme & {
  primary?: { color?: string };
  background?: { primary?: string; secondary?: string };
  border?: { color?: string; light?: string };
  text?: { primary?: string; secondary?: string };
};

const CreditNotePanel = memo(
  ({
    creditNote,
    onNavigateNote,
    isExpanded = false,
    isMobile = false,
  }: CreditNotePanelProps) => {
    const [expanded, setExpanded] = useState(isExpanded);

    const creditNoteTotal = (creditNote.items || []).reduce(
      (total, item) => total + getTotalPrice(item),
      0,
    );

    const creditNoteDate = creditNote.date || creditNote.createdAt;

    const handleToggle = () => {
      setExpanded(!expanded);
    };

    const handleViewClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onNavigateNote?.(creditNote, e);
    };

    const currency =
      typeof creditNote.currency === 'string' ? creditNote.currency : undefined;
    const formattedTotal = `${currency && !['DOP', '$'].includes(currency) ? `${currency} ` : ''}${formatPrice(creditNoteTotal)}`;

    return (
      <PanelContainer isExpanded={expanded}>
        <PanelHeader
          onClick={handleToggle}
          isMobile={isMobile}
          isExpanded={expanded}
        >
          <HeaderLeft>
            <TitleAndDate>
              <PanelTitle>NC {creditNote.ncf || creditNote.id}</PanelTitle>
              {creditNoteDate && (
                <DateInfo>
                  <CalendarOutlined />
                  <span>{formatDate(creditNoteDate)}</span>
                </DateInfo>
              )}
            </TitleAndDate>
          </HeaderLeft>
          <HeaderRight>
            <TotalText>{formattedTotal}</TotalText>
            <ViewButton
              type="text"
              icon={<EyeOutlined />}
              onClick={handleViewClick}
              size={isMobile ? 'small' : 'middle'}
            />
            <ExpandIcon>
              {expanded ? <DownOutlined /> : <RightOutlined />}
            </ExpandIcon>
          </HeaderRight>
        </PanelHeader>

        {expanded && (
          <PanelContent>
            {!isMobile && (
              <ItemsListHeader>
                <HeaderColumn flex={3}>Descripción</HeaderColumn>
                <HeaderColumn align="center">Cantidad</HeaderColumn>
                <HeaderColumn align="right">Precio Unit.</HeaderColumn>
                <HeaderColumn align="right">Importe</HeaderColumn>
              </ItemsListHeader>
            )}
            <ItemsList>
              {(creditNote.items || []).map((item, index) => (
                <ItemRow key={item.id ?? index} isMobile={isMobile}>
                  <ItemColumn flex={isMobile ? 1 : 3}>
                    {isMobile && <ColumnLabel>Descripción:</ColumnLabel>}
                    <span>{item.name}</span>
                  </ItemColumn>
                  <ItemColumn align={isMobile ? 'right' : 'center'}>
                    {isMobile && <ColumnLabel>Cantidad:</ColumnLabel>}
                    <span>
                      {typeof item.amountToBuy === 'number'
                        ? item.amountToBuy
                        : 1}
                    </span>
                  </ItemColumn>
                  <ItemColumn align="right">
                    {isMobile && <ColumnLabel>Precio Unit.:</ColumnLabel>}
                    <span>{formatPrice(getTotalPrice(item, true, false))}</span>
                  </ItemColumn>
                  <ItemColumn align="right">
                    {isMobile && <ColumnLabel>Importe:</ColumnLabel>}
                    <span>{formatPrice(getTotalPrice(item))}</span>
                  </ItemColumn>
                </ItemRow>
              ))}
            </ItemsList>
            <TotalSection>
              <TotalLabel>Total General</TotalLabel>
              <TotalValue>{formattedTotal}</TotalValue>
            </TotalSection>
          </PanelContent>
        )}
      </PanelContainer>
    );
  },
);

CreditNotePanel.displayName = 'CreditNotePanel';

interface PanelContainerProps {
  isExpanded?: boolean;
}

interface PanelHeaderProps {
  isMobile?: boolean;
  isExpanded?: boolean;
}

interface HeaderColumnProps {
  flex?: number;
  align?: 'left' | 'right' | 'center';
}

interface ItemRowProps {
  isMobile?: boolean;
}

interface ItemColumnProps {
  flex?: number;
  align?: 'left' | 'right' | 'center';
  isMobile?: boolean;
}

const PanelContainer = styled.div<PanelContainerProps>`
  border: 1px solid
    ${(props) => (props.theme as CreditNoteTheme)?.border?.color || '#e8e8e8'};
  border-radius: 8px;
  background-color: ${(props) =>
    (props.theme as CreditNoteTheme)?.background?.primary || '#fff'};
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);

  ${({ isExpanded, theme }) =>
    isExpanded &&
    css`
      border-color: ${(theme as CreditNoteTheme)?.primary?.color || '#1890ff'};
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    `}

  &:last-child {
    margin-bottom: 0;
  }
`;

const PanelHeader = styled.div<PanelHeaderProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ isMobile }) => (isMobile ? '8px 12px' : '12px 16px')};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) =>
      (props.theme as CreditNoteTheme)?.background?.secondary || '#fafafa'};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
`;

const TitleAndDate = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DateInfo = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.secondary || '#666'};
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ExpandIcon = styled.span`
  min-width: 12px;
  font-size: 12px;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.secondary || '#666'};
  transition: transform 0.2s ease;
`;

const PanelTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.primary || '#333'};
`;

const TotalText = styled.span`
  font-family: monospace;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.primary || '#333'};
`;

const ViewButton = styled(Button)`
  padding: 4px;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.secondary || '#666'};

  &:hover {
    color: ${(props) =>
      (props.theme as CreditNoteTheme)?.primary?.color || '#1890ff'};
    background-color: transparent;
  }
`;

const PanelContent = styled.div`
  background-color: ${(props) =>
    (props.theme as CreditNoteTheme)?.background?.primary || '#fff'};
`;

const ItemsListHeader = styled.div`
  display: flex;
  padding: 8px 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.secondary || '#666'};
  text-transform: uppercase;
  border-top: 1px solid
    ${(props) => (props.theme as CreditNoteTheme)?.border?.color || '#f0f0f0'};
`;

const HeaderColumn = styled.div<HeaderColumnProps>`
  flex: ${({ flex }) => flex || 1};
  text-align: ${({ align }) => align || 'left'};
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
`;

const ItemRow = styled.div<ItemRowProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid
    ${(props) => (props.theme as CreditNoteTheme)?.border?.light || '#f0f0f0'};

  &:last-child {
    border-bottom: none;
  }

  ${({ isMobile }) =>
    isMobile &&
    css`
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
      padding: 12px 0;
    `}
`;

const ItemColumn = styled.div<ItemColumnProps>`
  flex: ${({ flex }) => flex || 1};
  text-align: ${({ align }) => align || 'left'};
  font-size: 0.85rem;
  color: #434343;

  ${({ isMobile }) =>
    isMobile &&
    css`
      display: flex;
      justify-content: space-between;
      text-align: right;

      & > span:last-child {
        font-weight: 500;
      }
    `}
`;

const ColumnLabel = styled.span`
  font-weight: 500;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.secondary || '#666'};
`;

const TotalSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-weight: 600;
  background-color: ${(props) =>
    (props.theme as CreditNoteTheme)?.background?.secondary || '#fafafa'};
  border-top: 1px solid
    ${(props) => (props.theme as CreditNoteTheme)?.border?.color || '#f0f0f0'};
`;

const TotalLabel = styled.span`
  font-size: 0.9rem;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.primary || '#333'};
`;

const TotalValue = styled.span`
  font-family: monospace;
  font-size: 1.1rem;
  color: ${(props) =>
    (props.theme as CreditNoteTheme)?.text?.primary || '#333'};
`;

export { CreditNotePanel };
