import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { formatLots, formatUnits } from './nodeName.helpers';
import type {
  TreeConfig,
  TreeNodeData,
  TreeNodeDetail,
  TreeNodeTheme,
  TreeStockSummary,
} from '../types';

const NameContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding-right: 8px;
  margin-left: 8px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const TitleText = styled.span`
  display: inline-flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #1f2933;
  white-space: nowrap;
`;

const ThemeTag = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 2px 8px;
  margin-top: 2px;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.2;
  color: ${({ $color }) => $color || '#0f172a'};
  background-color: ${({ $background }) =>
    $background || 'rgba(22, 119, 255, 0.16)'};
  border-radius: 999px;
`;

const DetailLine = styled.span`
  font-size: 0.72rem;
  font-weight: ${({ $variant }) => ($variant === 'actual' ? 600 : 400)};
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
`;

type NodeNameProps = {
  title: string;
  isMatch?: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  searchTerm?: string;
  config?: TreeConfig<TreeNodeData>;
  matchedStockCount?: number;
  stockSummary?: TreeStockSummary | null;
  stockSummaryLoading?: boolean;
  renderHighlightedText: (text: string, highlight: string) => React.ReactNode;
  themeStyles?: TreeNodeTheme | null;
  extraDetails?: TreeNodeDetail[] | TreeNodeDetail | string | null;
  tooltipDetails?: TreeNodeData['tooltipDetails'];
};

type SummaryMeta = {
  details: TreeNodeDetail[];
  tooltipLines: string[];
  directLabel: string | null;
  directEmpty: boolean;
};

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
  themeStyles,
  extraDetails = [],
  tooltipDetails = [],
}: NodeNameProps) => {
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

  const summaryMeta = useMemo<SummaryMeta>(() => {
    if (!config?.showLocationStockSummary) {
      return {
        details: [],
        tooltipLines: [],
        directLabel: null,
        directEmpty: false,
      };
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
      return {
        details: [],
        tooltipLines: [],
        directLabel: null,
        directEmpty: false,
      };
    }

    const totalLots = Number.isFinite(stockSummary.totalLots)
      ? stockSummary.totalLots
      : null;
    const directLots = Number.isFinite(stockSummary.directLots)
      ? stockSummary.directLots
      : null;
    const totalUnits = Number.isFinite(stockSummary.totalUnits)
      ? stockSummary.totalUnits
      : null;
    const directUnits = Number.isFinite(stockSummary.directUnits)
      ? stockSummary.directUnits
      : null;

    const childLots =
      totalLots !== null && directLots !== null
        ? Math.max(totalLots - directLots, 0)
        : null;
    const childUnits =
      totalUnits !== null && directUnits !== null
        ? Math.max(totalUnits - directUnits, 0)
        : null;

    // Check if all values are 0
    const allZero =
      (totalLots === 0 || totalLots === null) &&
      (totalUnits === 0 || totalUnits === null) &&
      (directLots === 0 || directLots === null) &&
      (directUnits === 0 || directUnits === null);

    if (allZero) {
      return {
        details: [],
        tooltipLines: [],
        directLabel: null,
        directEmpty: false,
      };
    }

    const details: TreeNodeDetail[] = [];
    const tooltipLines: string[] = [];

    const buildLine = (
      label: string,
      lotsValue: number | null,
      unitsValue: number | null,
    ): string | null => {
      const parts = [];
      if (Number.isFinite(lotsValue) && lotsValue > 0)
        parts.push(formatLots(lotsValue));
      const unitLabel = formatUnits(unitsValue);
      if (unitLabel && unitsValue > 0) parts.push(unitLabel);
      if (parts.length) return `${label}: ${parts.join(' · ')}`;
      return null;
    };

    const totalLine = buildLine('Inventario total', totalLots, totalUnits);
    if (totalLine) tooltipLines.push(totalLine);

    const directLabel = Number.isFinite(directLots)
      ? formatLots(directLots)
      : null;
    const directEmpty = Number.isFinite(directLots)
      ? (directLots ?? 0) <= 0
      : false;

    const directLine = buildLine('Nivel actual', directLots, directUnits);
    if (directLine) tooltipLines.push(directLine);

    if (Number.isFinite(childLots) && (childLots ?? 0) > 0) {
      details.push({
        type: 'children',
        text: `Subniveles: ${formatLots(childLots)}`,
      });
    }

    const childLine = buildLine('Subniveles', childLots, childUnits);
    if (childLine) tooltipLines.push(childLine);

    const shouldHideDetails = Boolean(config?.disableStockSummaryDetails);
    const shouldHideTooltipLines = Boolean(config?.disableStockSummaryTooltip);

    return {
      details: shouldHideDetails ? [] : details,
      tooltipLines: shouldHideTooltipLines ? [] : tooltipLines,
      directLabel,
      directEmpty,
    };
  }, [
    config?.disableStockSummaryDetails,
    config?.disableStockSummaryTooltip,
    config?.showLocationStockSummary,
    stockSummary,
    stockSummaryLoading,
  ]);

  const tooltipDetailsNormalized = useMemo<string[]>(() => {
    if (!tooltipDetails) return [];
    const list = Array.isArray(tooltipDetails)
      ? tooltipDetails
      : [tooltipDetails];
    return list
      .map((detail) => {
        if (detail === null || detail === undefined) return null;
        if (typeof detail === 'string') return detail;
        if (typeof detail === 'number' || typeof detail === 'boolean')
          return String(detail);
        if (
          detail &&
          typeof detail === 'object' &&
          typeof detail.text === 'string'
        ) {
          return detail.text;
        }
        return null;
      })
      .filter(Boolean);
  }, [tooltipDetails]);

  const tooltipLines = tooltipDetailsNormalized.length
    ? tooltipDetailsNormalized
    : summaryMeta.tooltipLines;

  const tooltipContent = tooltipLines?.length ? (
    <div style={{ display: 'grid', gap: 2 }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      {tooltipLines.map((line, idx) => (
        <div key={`${line}-${idx}`}>{line}</div>
      ))}
    </div>
  ) : (
    title
  );

  const normalizedExtraDetails = useMemo<TreeNodeDetail[]>(() => {
    if (!extraDetails) return [];
    if (Array.isArray(extraDetails)) {
      return extraDetails
        .filter(Boolean)
        .map((detail) => {
          if (typeof detail === 'string') {
            return { text: detail, type: 'default' };
          }
          if (detail && typeof detail === 'object') {
            return {
              text: detail.text,
              type: detail.type || 'default',
            };
          }
          return null;
        })
        .filter(Boolean) as TreeNodeDetail[];
    }
    if (typeof extraDetails === 'string') {
      return [{ text: extraDetails, type: 'default' }];
    }
    if (extraDetails && typeof extraDetails === 'object') {
      return [
        {
          text: (extraDetails as TreeNodeDetail).text,
          type: (extraDetails as TreeNodeDetail).type || 'default',
        },
      ];
    }
    return [];
  }, [extraDetails]);

  const detailLines = [
    ...(summaryMeta.details || []),
    ...normalizedExtraDetails,
  ];

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
  extraDetails: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          text: PropTypes.string,
          type: PropTypes.string,
        }),
      ]),
    ),
    PropTypes.string,
    PropTypes.shape({
      text: PropTypes.string,
      type: PropTypes.string,
    }),
  ]),
  tooltipDetails: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.shape({
          text: PropTypes.string,
        }),
      ]),
    ),
    PropTypes.string,
    PropTypes.number,
    PropTypes.shape({
      text: PropTypes.string,
    }),
  ]),
};

export default NodeName;
