import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { Tooltip } from 'antd';

const numberFormatter = new Intl.NumberFormat('es-ES');

const NameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  flex: 1;
  min-width: 0;
  padding-right: 8px;
`;

const TitleText = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LotBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: #f5f5f5;
  color: #344054;
  font-size: 0.75rem;
  line-height: 1.2;
  margin-left: auto;
`;

const NodeName = ({
  title,
  isMatch = false,
  children,
  isLoading = false,
  searchTerm,
  config,
  matchedStockCount = 0,
  stockSummary,
  stockSummaryLoading = false,
  renderHighlightedText
}) => {
  const renderContent = () => {
    if (isLoading) {
      return 'Cargando';
    }

    if (searchTerm) {
      return renderHighlightedText(title, searchTerm);
    }

    return title;
  };

  const renderMatchCount = () => {
    if (!config?.showMatchedStockCount || !matchedStockCount) {
      return null;
    }

    return ` (${matchedStockCount} producto(s) encontrado(s))`;
  };

  const summaryText = (() => {
    if (!config?.showLocationStockSummary) return null;
    if (stockSummaryLoading) return 'Calculando stock...';
    if (!stockSummary || (stockSummary.totalUnits === undefined && stockSummary.totalLots === undefined)) {
      return null;
    }

    const parts = [];

    if (typeof stockSummary.totalUnits === 'number') {
      parts.push(`${numberFormatter.format(stockSummary.totalUnits)} unidades`);
    }

    if (typeof stockSummary.totalLots === 'number') {
      parts.push(`${numberFormatter.format(stockSummary.totalLots)} lotes`);
    }

    if (!parts.length) {
      return null;
    }

    return parts.join(' · ');
  })();

  const tooltipText = summaryText ? `${title} — ${summaryText}` : title;

  const content = (
    <NameContainer isMatch={isMatch}>
      <TitleText>
        {renderContent()}
        {renderMatchCount()}
      </TitleText>
      {config?.showLocationStockSummary && (
        stockSummaryLoading ? (
          <LotBadge>...</LotBadge>
        ) : typeof stockSummary?.totalLots === 'number' ? (
          <LotBadge>{numberFormatter.format(stockSummary.totalLots)} lotes</LotBadge>
        ) : null
      )}
      {children}
    </NameContainer>
  );

  if (!tooltipText) {
    return content;
  }

  return (
    <Tooltip title={tooltipText} mouseEnterDelay={0.15}>
      {content}
    </Tooltip>
  );
};

NodeName.propTypes = {
  title: PropTypes.string.isRequired,
  isMatch: PropTypes.bool,
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  searchTerm: PropTypes.string,
  config: PropTypes.object,
  matchedStockCount: PropTypes.number,
  stockSummary: PropTypes.shape({
    totalUnits: PropTypes.number,
    totalLots: PropTypes.number,
  }),
  stockSummaryLoading: PropTypes.bool,
  renderHighlightedText: PropTypes.func,
};

export default NodeName;
