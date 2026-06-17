import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { VmDropdown } from '@/components/heroui';

type ExpiredStyleProps = { $expired: boolean };
type HasBatchStyleProps = { $hasBatch: boolean };
type DiscountStyleProps = { $hasDiscount: boolean };

export type ProductActionMenuTone = 'warning' | 'success' | 'info' | 'neutral';

export const Container = styled.div<{ $expired: boolean }>`
  position: relative;
  display: grid;
  gap: 0.2em;
  width: 100%;
  height: min-content;
  padding: 0.4em;
  background-color: #fff;
  border: 1px solid
    ${(props: ExpiredStyleProps) =>
      props.$expired ? '#dc2626' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
`;

export const Row = styled.div`
  display: grid;
  align-items: center;
`;

export const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4em;
  align-items: center;
`;

export const TitleContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
  min-width: fit-content;
`;

export const PriceMetaRow = styled.div`
  min-height: 16px;
`;

export const OriginalPrice = styled.span`
  font-size: 11px;
  font-weight: 400;
  line-height: 1;
  color: #8c8c8c;
  text-decoration: line-through;
`;

export const SourcePriceNote = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  line-height: 1.2;
  color: #52606d;
`;

export const CommentPreview = styled.div`
  max-width: calc(100% - 8px);
  padding-left: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  line-height: 1;
  color: #8c8c8c;
  white-space: nowrap;
`;

export const SelectionWarning = styled.div`
  max-width: calc(100% - 8px);
  padding-left: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: #d97706;
  white-space: nowrap;
`;

export const TopBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
`;

export const LeftSlot = styled.div<{ $hasBatch: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${(props: HasBatchStyleProps) => (props.$hasBatch ? '0' : '2px')};
  align-items: flex-start;
  min-width: 0;
`;

export const RightCluster = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const BatchSummaryInteractive = styled.span<{ $expired: boolean }>`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13.2px;
  color: #1677ff;
  white-space: nowrap;
  cursor: pointer;

  &:hover,
  &:focus {
    outline: none;
  }

  .summary-text {
    display: inline-block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .batch-token {
    font-weight: 600;
    text-decoration: underline;
  }

  .separator {
    color: #64748b;
  }

  .expiration-text {
    font-weight: 600;
    color: ${(props: ExpiredStyleProps) =>
      props.$expired ? '#dc2626' : '#16a34a'};
  }
`;

export const NameStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const TitleRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
`;

export const TopActions = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const ProductActionMenuButton = styled(VmDropdown.Button)`
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  border-color: transparent;
  color: var(--ds-color-text-secondary);
  background: transparent;

  &:hover,
  &[data-hovered='true'] {
    color: var(--ds-color-text-primary);
    background: var(--ds-color-bg-subtle);
  }
`;

export const ProductActionMenuPopover = styled(VmDropdown.Popover)`
  min-width: 220px;
`;

export const ProductActionMenuItemLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
`;

export const ProductActionMenuItemIcon = styled.span<{
  $tone: ProductActionMenuTone;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  color: ${(props) => {
    if (props.$tone === 'warning') return 'var(--ds-color-state-warning-text)';
    if (props.$tone === 'success') return 'var(--ds-color-state-success-text)';
    if (props.$tone === 'info') return 'var(--ds-color-state-info-text)';
    return 'var(--ds-color-text-tertiary)';
  }};
`;

export const TitleLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: rgb(71 71 71);
  text-transform: capitalize;
  overflow-wrap: break-word;
`;

export const Price = styled.span<{ $hasDiscount: boolean }>`
  padding: 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props: DiscountStyleProps) =>
    props.$hasDiscount ? '#52c41a' : 'var(--gray-6)'};
  white-space: nowrap;
  background-color: var(--white-1);
`;

export const StatusIcon = styled(FontAwesomeIcon)<{ $expired: boolean }>`
  flex-shrink: 0;
  font-size: 12px;
  color: ${(props: ExpiredStyleProps) =>
    props.$expired ? '#dc2626' : '#16a34a'};
`;
