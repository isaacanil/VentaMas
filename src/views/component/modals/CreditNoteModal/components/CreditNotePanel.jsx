import {
  EyeOutlined,
  DownOutlined,
  RightOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import React, { useState, memo } from 'react';
import styled, { css } from 'styled-components';

import { formatPrice } from '@/utils/format';

import DateUtils from '@/utils/date/dateUtils';
import { getTotalPrice } from '@/utils/pricing';


const CreditNotePanel = memo(
  ({ creditNote, onNavigateNote, isExpanded = false, isMobile = false }) => {
    const [expanded, setExpanded] = useState(isExpanded);

    const creditNoteTotal = (creditNote.items || []).reduce(
      (total, item) => total + getTotalPrice(item),
      0,
    );

    const creditNoteDate = creditNote.date || creditNote.createdAt;

    const handleToggle = () => {
      setExpanded(!expanded);
    };

    const handleViewClick = (e) => {
      e.stopPropagation();
      onNavigateNote?.(creditNote, e);
    };

    const formattedTotal = `${creditNote.currency && !['DOP', '$'].includes(creditNote.currency) ? `${creditNote.currency} ` : ''}${formatPrice(creditNoteTotal)}`;

    return (
      <PanelContainer isMobile={isMobile} isExpanded={expanded}>
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
                  <span>{DateUtils.formatLuxonDate(creditNoteDate)}</span>
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
          <PanelContent isMobile={isMobile}>
            {!isMobile && (
              <ItemsListHeader>
                <HeaderColumn flex={3}>Descripción</HeaderColumn>
                <HeaderColumn align="center">Cantidad</HeaderColumn>
                <HeaderColumn align="right">Precio Unit.</HeaderColumn>
                <HeaderColumn align="right">Importe</HeaderColumn>
              </ItemsListHeader>
            )}
            <ItemsList>
              {(creditNote.items || []).map((item) => (
                <ItemRow key={item.id} isMobile={isMobile}>
                  <ItemColumn flex={isMobile ? 1 : 3}>
                    {isMobile && <ColumnLabel>Descripción:</ColumnLabel>}
                    <span>{item.name}</span>
                  </ItemColumn>
                  <ItemColumn align={isMobile ? 'right' : 'center'}>
                    {isMobile && <ColumnLabel>Cantidad:</ColumnLabel>}
                    <span>{item.amountToBuy || 1}</span>
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

const PanelContainer = styled.div`
  border: 1px solid ${(props) => props.theme?.border?.color || '#e8e8e8'};
  border-radius: 8px;
  background-color: ${(props) => props.theme?.background?.primary || '#fff'};
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);

  ${(props) =>
    props.isExpanded &&
    css`
      border-color: ${props.theme?.primary?.color || '#1890ff'};
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    `}

  &:last-child {
    margin-bottom: 0;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) => (props.isMobile ? '8px 12px' : '12px 16px')};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) =>
      props.theme?.background?.secondary || '#fafafa'};
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
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ExpandIcon = styled.span`
  min-width: 12px;
  font-size: 12px;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
  transition: transform 0.2s ease;
`;

const PanelTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

const TotalText = styled.span`
  font-family: monospace;
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

const ViewButton = styled(Button)`
  padding: 4px;
  color: ${(props) => props.theme?.text?.secondary || '#666'};

  &:hover {
    color: ${(props) => props.theme?.primary?.color || '#1890ff'};
    background-color: transparent;
  }
`;

const PanelContent = styled.div`
  background-color: ${(props) => props.theme?.background?.primary || '#fff'};
`;

const ItemsListHeader = styled.div`
  display: flex;
  padding: 8px 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
  text-transform: uppercase;
  border-top: 1px solid ${(props) => props.theme?.border?.color || '#f0f0f0'};
`;

const HeaderColumn = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'left'};
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${(props) => props.theme?.border?.light || '#f0f0f0'};

  &:last-child {
    border-bottom: none;
  }

  ${(props) =>
    props.isMobile &&
    css`
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
      padding: 12px 0;
    `}
`;

const ItemColumn = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'left'};
  font-size: 0.85rem;
  color: #434343;

  ${(props) =>
    props.isMobile &&
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
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const TotalSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-weight: 600;
  background-color: ${(props) =>
    props.theme?.background?.secondary || '#fafafa'};
  border-top: 1px solid ${(props) => props.theme?.border?.color || '#f0f0f0'};
`;

const TotalLabel = styled.span`
  font-size: 0.9rem;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

const TotalValue = styled.span`
  font-family: monospace;
  font-size: 1.1rem;
  color: ${(props) => props.theme?.text?.primary || '#333'};
`;

export { CreditNotePanel };
