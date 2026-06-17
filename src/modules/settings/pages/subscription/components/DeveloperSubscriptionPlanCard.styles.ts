import { Button } from 'antd';
import styled from 'styled-components';

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(15 23 42 / 4%);
`;

export const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PlanCode = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.04em;
  text-transform: lowercase;
`;

export const StatusBadge = styled.span<{ $status: string }>`
  padding: 2px 9px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(p) => {
    if (p.$status === 'active') return 'rgb(13 148 136 / 10%)';
    if (p.$status === 'deprecated') return 'rgb(245 158 11 / 12%)';
    if (p.$status === 'retired') return 'rgb(239 68 68 / 10%)';
    if (p.$status === 'scheduled') return 'rgb(59 130 246 / 10%)';
    return 'rgb(148 163 184 / 12%)';
  }};
  color: ${(p) => {
    if (p.$status === 'active') return '#0f766e';
    if (p.$status === 'deprecated') return '#b45309';
    if (p.$status === 'retired') return '#b91c1c';
    if (p.$status === 'scheduled') return '#1d4ed8';
    return '#475569';
  }};
`;

export const CardNamePrice = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

export const CardMenuButton = styled(Button)`
  flex-shrink: 0;
  color: #94a3b8;

  &:hover {
    color: #0f172a !important;
  }
`;

export const PlanName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
`;

export const PriceRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
`;

export const PriceAmount = styled.strong`
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
`;

export const PricePeriod = styled.span`
  padding-bottom: 3px;
  color: #94a3b8;
  font-size: 0.85rem;
`;

export const Divider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid #f1f5f9;
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
`;

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

export const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

export const VersionIdChip = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  font-size: 0.7rem;
  color: #64748b;
  min-width: 0;
  max-width: 160px;
`;

export const VersionIdText = styled.span`
  font-family: monospace;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CopyButton = styled.button`
  display: grid;
  place-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 10px;
  flex-shrink: 0;

  &:hover {
    color: #0f766e;
  }
`;

export const VersionIdEmpty = styled.span`
  font-size: 0.72rem;
  color: #94a3b8;
`;

export const HistoryLink = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;

  &:hover {
    color: #0f766e;
  }
`;

export const InfoButton = styled.button`
  display: grid;
  place-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;

  &:hover {
    color: #0f766e;
  }
`;

export const DetailModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const DetailModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 4px;
`;

export const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const DetailSectionTitle = styled.p`
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
`;

export const DetailPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
`;

export const DetailPricePeriod = styled.span`
  font-size: 0.9rem;
  font-weight: 400;
  color: #94a3b8;
`;

export const DetailLimitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

export const DetailLimitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`;

export const DetailLimitIcon = styled.span`
  font-size: 13px;
  color: #64748b;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
`;

export const DetailLimitLabel = styled.span`
  flex: 1;
  font-size: 0.82rem;
  color: #475569;
`;

export const DetailLimitValue = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
`;

export const DetailChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const DetailChip = styled.span<{ $variant: 'module' | 'addon' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 500;
  background: ${(p) =>
    p.$variant === 'addon' ? 'rgb(99 102 241 / 8%)' : 'rgb(13 148 136 / 8%)'};
  color: ${(p) => (p.$variant === 'addon' ? '#4f46e5' : '#0f766e')};

  svg {
    font-size: 9px;
  }
`;

export const ModalVersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
`;

export const VersionRowContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
`;

export const VersionRowMain = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

export const VersionIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const VersionCode = styled.span`
  font-family: monospace;
  font-size: 0.78rem;
  color: #0f172a;
  font-weight: 600;
`;

export const VersionMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  color: #64748b;
`;

export const VersionFooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const VersionActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const VersionHint = styled.span`
  font-size: 0.72rem;
  color: #94a3b8;
  text-transform: lowercase;
`;

export const EmptyInline = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
`;

export const Muted = styled.span`
  color: #94a3b8;
`;
