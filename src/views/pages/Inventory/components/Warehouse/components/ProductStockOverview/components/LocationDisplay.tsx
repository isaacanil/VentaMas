import {
  faArrowRight,
  faBox,
  faLayerGroup,
  faTable,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import type { LocationNamesMap } from '@/utils/inventory/types';

type LocationDisplayVariant = 'card' | 'inline';

type LocationDisplayProps = {
  location?: string | null;
  onClick?: () => void;
  locationNames?: LocationNamesMap;
  variant?: LocationDisplayVariant;
};

const getLocationIcon = (
  type: 'warehouse' | 'shelf' | 'row' | 'segment',
) => {
  switch (type) {
    case 'warehouse':
      return faWarehouse;
    case 'shelf':
      return faLayerGroup;
    case 'row':
      return faTable;
    case 'segment':
      return faBox;
    default:
      return faWarehouse;
  }
};

export const LocationDisplay = ({
  location,
  onClick,
  locationNames,
  variant = 'card',
}: LocationDisplayProps) => {
  // Ensure location is a string and provide a default value
  const locationString =
    typeof location === 'string' ? location : String(location ?? '');
  const formatLocationPart = (path: string) => {
    if (!path) return 'Ubicación no disponible';
    return locationNames?.[path] || 'Cargando...';
  };

  const fullLabel = locationNames?.[locationString] || null;
  const primaryLabel = formatLocationPart(locationString);
  const inlineLabel = fullLabel || primaryLabel;

  return (
    <LocationBadge onClick={onClick} $variant={variant}>
      <LocationPath $variant={variant}>
        <div className="location-content">
          {variant === 'inline' ? (
            <div className="location-segments">
              <span
                className={`segment-chip ${fullLabel ? 'full' : 'fallback'}`}
              >
                <FontAwesomeIcon
                  icon={getLocationIcon('segment')}
                  className="icon"
                />
                <span className="text">{inlineLabel}</span>
              </span>
            </div>
          ) : (
            <div className="location-segment">
              <FontAwesomeIcon
                icon={getLocationIcon('segment')}
                className="icon"
              />
              <span className="location-text">{primaryLabel}</span>
            </div>
          )}
        </div>
        <FontAwesomeIcon icon={faArrowRight} className="navigation-icon" />
      </LocationPath>
    </LocationBadge>
  );
};

const LocationPath = styled.div<{ $variant: LocationDisplayVariant }>`
  display: flex;
  flex-wrap: ${({ $variant }) => ($variant === 'inline' ? 'wrap' : 'nowrap')};
  gap: 8px;
  align-items: center;
  width: 100%;

  .location-content {
    flex: 1;
    min-width: 0;
  }

  .location-segment {
    display: flex;
    align-items: flex-start;
    padding: 4px 12px;
    font-size: 0.9rem;
    color: #1e293b;
    overflow-wrap: anywhere;
    white-space: normal;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;

    .icon {
      flex-shrink: 0;
      margin-top: 3px;
      margin-right: 6px;
      font-size: 0.85rem;
      color: #2563eb;
    }

    .location-text {
      flex: 1;
    }
  }

  .location-segments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .segment-chip {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    padding: 5px 10px;
    font-size: 0.8rem;
    color: #1e293b;
    background: #f1f5f9;
    border: 1px solid transparent;
    border-radius: 999px;

    &.fallback {
      background: #f8fafc;
    }

    &.full {
      background: #e2e8f0;
      border-color: #d4dbe5;
    }

    .icon {
      font-size: 0.7rem;
      color: #2563eb;
    }

    .text {
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
  }

  .navigation-icon {
    display: ${({ $variant }) => ($variant === 'inline' ? 'none' : 'block')};
    flex-shrink: 0;
    font-size: 0.9rem;
    color: #2563eb;
    transition: transform 0.2s ease;
  }
`;

const LocationBadge = styled.div<{ $variant: LocationDisplayVariant }>`
  position: relative;
  display: flex;
  flex-direction: ${({ $variant }) =>
    $variant === 'inline' ? 'row' : 'column'};
  gap: ${({ $variant }) => ($variant === 'inline' ? '8px' : '6px')};
  align-items: ${({ $variant }) =>
    $variant === 'inline' ? 'center' : 'flex-start'};
  padding: ${({ $variant }) => ($variant === 'inline' ? '6px 0' : '8px')};
  margin-top: ${({ $variant }) => ($variant === 'inline' ? '0' : 'auto')};
  font-size: 0.9rem;
  color: #1e293b;
  cursor: pointer;
  background: ${({ $variant }) =>
    $variant === 'inline' ? 'transparent' : '#ffffff'};
  border: ${({ $variant }) =>
    $variant === 'inline' ? 'none' : '1px solid #e2e8f0'};
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ $variant }) =>
      $variant === 'inline' ? 'transparent' : '#2563eb'};
    box-shadow: ${({ $variant }) =>
      $variant === 'inline'
        ? 'none'
        : '0 4px 12px rgba(37, 99, 235, 0.1)'};

    .navigation-icon {
      transform: translateX(4px);
    }
  }

  .location-content {
    display: flex;
    align-items: center;
    width: 100%;
  }
`;
