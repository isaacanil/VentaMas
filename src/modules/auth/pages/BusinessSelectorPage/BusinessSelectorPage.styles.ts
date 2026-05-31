import styled from 'styled-components';

import { PageLayout } from '@/components/layout/PageShell';

export type SubscriptionTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

export type InviteFeedbackType = 'success' | 'error' | 'info';

export const Page = styled(PageLayout)`
  background: linear-gradient(180deg, #f7fafc 0%, #eef2f7 100%);
`;

export const HubToolbar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: flex-start;
  padding: 0.65rem 1rem;
  background: #fff;
  border-bottom: 1px solid #e4e7ec;
`;

export const HubToolbarTitle = styled.h1`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #101828;
  white-space: nowrap;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: min(960px, 100%);
  padding: 1.5rem 1rem 2rem;
  margin: 0 auto;
  overflow: auto;
`;

export const Header = styled.div`
  display: grid;
  gap: 0.35rem;
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #475467;
`;

export const SubscriptionWidget = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
`;

export const SubscriptionWidgetLeft = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
`;

export const SubscriptionWidgetTitle = styled.span`
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  font-size: 0.88rem;
  font-weight: 700;
  color: #101828;
`;

export const SubscriptionInfoIcon = styled.span`
  display: inline-grid;
  width: 1.1rem;
  height: 1.1rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #667085;
  cursor: help;
  background: #f2f4f7;
  border-radius: 999px;
  place-items: center;
`;

export const SubscriptionWidgetPlan = styled.span`
  font-size: 0.8rem;
  color: #475467;
`;

export const SubscriptionWidgetRight = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

export const SubscriptionWidgetBtn = styled.button`
  min-height: 1.85rem;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #344054;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: #f2f4f7;
    border-color: #98a2b3;
  }
`;

export const SubscriptionHint = styled.div<{
  $tone?: 'warning' | 'danger' | 'info';
}>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.85rem;
  font-size: 0.8rem;
  color: ${({ $tone }) => ($tone === 'danger' ? '#7f1d1d' : '#475467')};
  background: ${({ $tone }) => {
    if ($tone === 'danger') return '#fef2f2';
    if ($tone === 'info') return '#eff6ff';
    return '#fffbeb';
  }};
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === 'danger') return '#fecaca';
      if ($tone === 'info') return '#bfdbfe';
      return '#fde68a';
    }};
  border-radius: 10px;
`;

export const SubscriptionHintButton = styled.button`
  min-height: 1.95rem;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #344054;
  cursor: pointer;
  background: #fff;
  border: 1px solid #98a2b3;
  border-radius: 8px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: #f8fafc;
    border-color: #667085;
  }
`;

export const BusinessActionsWidget = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
`;

export const BusinessActionsLeft = styled.div`
  display: grid;
  gap: 0.2rem;
`;

export const BusinessActionsTitle = styled.h2`
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #101828;
`;

export const BusinessActionsText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #475467;
`;

export const BusinessActionsRight = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

export const BusinessActionPrimary = styled.button`
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: #5ca3d8;
  border: 1px solid #5ca3d8;
  border-radius: 8px;
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(0.95);
  }
`;

export const BusinessActionSecondary = styled.button`
  min-height: 2rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #344054;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: #f2f4f7;
    border-color: #98a2b3;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export const BusinessActionTooltipAnchor = styled.span`
  display: inline-flex;
`;

export const BusinessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.9rem;
`;

export const BusinessCard = styled.button<{
  $active: boolean;
  $disabled: boolean;
}>`
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: #fff;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(16, 24, 40, 0.28)' : '#d0d5dd')};
  border-radius: 12px;
  box-shadow: ${({ $active }) =>
    $active ? '0 6px 16px rgba(16, 24, 40, 0.08)' : 'none'};
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: ${({ $disabled }) => ($disabled ? '#d0d5dd' : '#98a2b3')};
    box-shadow: ${({ $disabled }) =>
      $disabled ? 'none' : '0 10px 24px rgba(16, 24, 40, 0.08)'};
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'translateY(-1px)')};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: space-between;
`;

export const BusinessName = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #101828;
`;

export const BusinessTitle = styled.div`
  display: grid;
  gap: 0.1rem;
`;

export const BusinessId = styled.span`
  font-size: 0.72rem;
  font-weight: 500;
  color: #667085;
`;

export const CurrentBadge = styled.span`
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0b4a6f;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 999px;
`;

export const MetaRow = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  justify-content: space-between;
`;

export const MetaLabel = styled.span`
  font-size: 0.83rem;
  color: #667085;
`;

export const MetaValue = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  color: #344054;
`;

export const StatusPill = styled.span<{ $active: boolean }>`
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $active }) => ($active ? '#085d3a' : '#912018')};
  background: ${({ $active }) => ($active ? '#dcfae6' : '#fee4e2')};
  border: 1px solid ${({ $active }) => ($active ? '#abefc6' : '#fecdca')};
  border-radius: 999px;
`;

export const SubscriptionPill = styled.span<{ $tone: SubscriptionTone }>`
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $tone }) => {
    if ($tone === 'danger') return '#991b1b';
    if ($tone === 'warning') return '#92400e';
    if ($tone === 'info') return '#0c4a6e';
    if ($tone === 'success') return '#14532d';
    return '#344054';
  }};
  background: ${({ $tone }) => {
    if ($tone === 'danger') return '#fee2e2';
    if ($tone === 'warning') return '#fef3c7';
    if ($tone === 'info') return '#e0f2fe';
    if ($tone === 'success') return '#dcfce7';
    return '#f2f4f7';
  }};
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === 'danger') return '#fecaca';
      if ($tone === 'warning') return '#fde68a';
      if ($tone === 'info') return '#bae6fd';
      if ($tone === 'success') return '#bbf7d0';
      return '#d0d5dd';
    }};
  border-radius: 999px;
`;

export const JoinByCodeModalForm = styled.form`
  display: grid;
  gap: 0.7rem;
`;

export const JoinByCodeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.55rem;
  align-items: center;

  @media (width <= 420px) {
    grid-template-columns: 1fr;
  }
`;

export const JoinByCodeInput = styled.input`
  width: 100%;
  min-height: 2.25rem;
  padding: 0.5rem 0.65rem;
  font-size: 0.86rem;
  color: #101828;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 9px;

  &:focus {
    border-color: #5ca3d8;
    box-shadow: 0 0 0 3px rgb(92 163 216 / 20%);
    outline: none;
  }
`;

export const JoinByCodeButton = styled.button`
  min-height: 2.25rem;
  padding: 0.5rem 0.85rem;
  font-size: 0.83rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: #5ca3d8;
  border: 1px solid #5ca3d8;
  border-radius: 9px;
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(0.95);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export const JoinByCodeFeedback = styled.p<{ $type: InviteFeedbackType }>`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ $type }) => {
    if ($type === 'success') return '#085d3a';
    if ($type === 'info') return '#0b4a6f';
    return '#912018';
  }};
`;

export const EmptyState = styled.div`
  display: grid;
  gap: 0.4rem;
  padding: 1.2rem;
  background: #fff;
  border: 1px dashed #d0d5dd;
  border-radius: 12px;
`;

export const EmptyTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #101828;
`;

export const EmptyText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #667085;
`;
