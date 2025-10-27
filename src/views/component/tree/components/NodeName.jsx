import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const numberFormatter = new Intl.NumberFormat('es-ES');

export const formatLots = (value) => {
  if (!Number.isFinite(value)) return '0 lotes';
  const count = numberFormatter.format(value);
  return `${count} ${value === 1 ? 'lote' : 'lotes'}`;
};

const formatUnits = (value) => {
  if (!Number.isFinite(value)) return null;
  const count = numberFormatter.format(value);
  return `${count} ${value === 1 ? 'und.' : 'unds.'}`;
};

const NameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  flex: 1;
  min-width: 0;
  padding-right: 8px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const TitleText = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #1f2933;
  flex: 1;
`;

const ThemeTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  background-color: ${({ $background }) => $background || 'rgba(22, 119, 255, 0.16)'};
  color: ${({ $color }) => $color || '#0f172a'};
  line-height: 1.2;
  margin-top: 2px;
  align-self: flex-start;
`;

const DetailLine = styled.span`
  font-size: 0.72rem;
  line-height: 1.1;
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'actual':
        return '#1677ff';
      case 'actual-empty':
        return '#9ca3af';
      case 'children':
        return '#4f5b67';
      default:
        return '#667085';
    }
  }};
  font-weight: ${({ $variant }) => ($variant === 'actual' ? 600 : 400)};
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
  renderHighlightedText,
  themeStyles
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

  const summaryMeta = useMemo(() => {
    if (!config?.showLocationStockSummary) {
      return { details: [], tooltipLines: [], directLabel: null, directEmpty: false };
    }
    if (stockSummaryLoading) {
      return {
        details: [{ type: 'actual', text: 'Calculando stock...' }],
        tooltipLines: ['Inventario total: calculando…'],
        directLabel: '…',
        directEmpty: false,
      };
    }
    if (!stockSummary) {
      return { details: [], tooltipLines: [], directLabel: null, directEmpty: false };
    }

    const totalLots = Number.isFinite(stockSummary.totalLots) ? stockSummary.totalLots : null;
    const directLots = Number.isFinite(stockSummary.directLots) ? stockSummary.directLots : null;
    const totalUnits = Number.isFinite(stockSummary.totalUnits) ? stockSummary.totalUnits : null;
    const directUnits = Number.isFinite(stockSummary.directUnits) ? stockSummary.directUnits : null;

    const childLots =
      totalLots !== null && directLots !== null ? Math.max(totalLots - directLots, 0) : null;
    const childUnits =
      totalUnits !== null && directUnits !== null ? Math.max(totalUnits - directUnits, 0) : null;

    const details = [];
    const tooltipLines = [];

    const buildLine = (label, lotsValue, unitsValue, emptyText) => {
      const parts = [];
      if (Number.isFinite(lotsValue)) parts.push(formatLots(lotsValue));
      const unitLabel = formatUnits(unitsValue);
      if (unitLabel) parts.push(unitLabel);
      if (parts.length) return `${label}: ${parts.join(' · ')}`;
      return emptyText ? `${label}: ${emptyText}` : null;
    };

    const totalLine = buildLine('Inventario total', totalLots, totalUnits);
    if (totalLine) tooltipLines.push(totalLine);

    const hasDirectInfo = Number.isFinite(directLots) || Number.isFinite(directUnits);
    const hasChildInfo = Number.isFinite(childLots) || Number.isFinite(childUnits);

    const directLabel = Number.isFinite(directLots) ? formatLots(directLots) : null;
    const directEmpty = Number.isFinite(directLots) ? (directLots ?? 0) <= 0 : false;

    if (hasDirectInfo) {
      const directLine = buildLine(
        'Nivel actual',
        directLots,
        directUnits,
        'sin stock en este nivel'
      );
      if (directLine) tooltipLines.push(directLine);
    }

    if (Number.isFinite(childLots) && (childLots ?? 0) > 0) {
      details.push({ type: 'children', text: `Subniveles: ${formatLots(childLots)}` });
    }

    if (hasChildInfo) {
      const childLine = buildLine(
        'Subniveles',
        childLots,
        childUnits,
        'sin stock en subniveles'
      );
      if (childLine) tooltipLines.push(childLine);
    }

    if (!details.length && !tooltipLines.length) {
      tooltipLines.push('Sin stock registrado');
    }

    return {
      details,
      tooltipLines,
      directLabel,
      directEmpty,
    };
  }, [config?.showLocationStockSummary, stockSummary, stockSummaryLoading]);

  const tooltipContent = summaryMeta.tooltipLines?.length ? (
    <div style={{ display: 'grid', gap: 2 }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      {summaryMeta.tooltipLines.map((line, idx) => (
        <div key={`${line}-${idx}`}>{line}</div>
      ))}
    </div>
  ) : title;

  const detailLines = summaryMeta.details || [];

  const content = (
    <NameContainer isMatch={isMatch}>
      <TitleWrapper>
        <TitleText>
          {renderContent()}
          {renderMatchCount()}
        </TitleText>
        {themeStyles?.label && (
          <ThemeTag
            $background={themeStyles?.labelBackground}
            $color={themeStyles?.labelColor || themeStyles?.accentColor}
          >
            {themeStyles.label}
          </ThemeTag>
        )}
        {detailLines.map((detail, idx) => (
          <DetailLine key={`${detail.text}-${idx}`} $variant={detail.type}>
            {detail.text}
          </DetailLine>
        ))}
      </TitleWrapper>
      {children}
    </NameContainer>
  );

  if (!tooltipContent) {
    return content;
  }

  return (
    <Tooltip title={tooltipContent} mouseEnterDelay={0.15}>
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
    directUnits: PropTypes.number,
    directLots: PropTypes.number,
  }),
  stockSummaryLoading: PropTypes.bool,
  renderHighlightedText: PropTypes.func,
  themeStyles: PropTypes.shape({
    label: PropTypes.string,
    labelBackground: PropTypes.string,
    labelColor: PropTypes.string,
    accentColor: PropTypes.string,
  }),
};

export default NodeName;
