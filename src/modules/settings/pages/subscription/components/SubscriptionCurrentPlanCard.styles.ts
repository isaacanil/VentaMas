import { Button } from 'antd';
import styled from 'styled-components';

export const Card = styled.section<{ $border: string; $glow: string }>`
  position: relative;
  display: grid;
  gap: 18px;
  overflow: hidden;
  padding: 20px 24px;
  border: 1px solid ${(p) => p.$border};
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);

  @media (max-width: 720px) {
    padding: 16px;
    border-radius: 10px;
  }
`;

export const CardGlow = styled.div`
  display: none;
`;

export const HeroGrid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
  gap: 24px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const HeroContent = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

export const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const PlanName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  line-height: 1.3;
  font-weight: 600;
`;

export const StatusBadge = styled.span<{ $background: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  background: ${(p) => p.$background};
  color: ${(p) => p.$color};
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
`;

export const HelperText = styled.p`
  margin: 0;
  max-width: 44ch;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
`;

export const PriceRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PriceValue = styled.strong`
  color: #0f172a;
  font-size: clamp(1.9rem, 4vw, 2.4rem);
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 700;
`;

export const PriceCycle = styled.span`
  padding-bottom: 5px;
  color: #94a3b8;
  font-size: 1.05rem;
  line-height: 1;
`;

export const HeroAside = styled.div`
  display: grid;
  gap: 10px;
  justify-items: end;
  align-self: center;

  @media (max-width: 900px) {
    justify-items: start;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  min-width: min(100%, 280px);
`;

export const PrimaryActionButton = styled(Button)<{
  $background: string;
  $color: string;
}>`
  &.ant-btn {
    height: 40px;
    padding-inline: 16px;
    border: none;
    border-radius: 8px;
    background: ${(p) => p.$background};
    color: ${(p) => p.$color};
    font-weight: 700;
    box-shadow: none;
  }

  &.ant-btn:hover,
  &.ant-btn:focus {
    background: ${(p) => p.$background} !important;
    color: ${(p) => p.$color} !important;
    opacity: 0.94;
  }
`;

export const SecondaryActionButton = styled(Button)`
  &.ant-btn {
    height: 40px;
    border-radius: 8px;
    border-color: #e2e8f0;
    background: #f8fafc;
    color: #334155;
    font-weight: 600;
    box-shadow: none;
  }

  &.ant-btn:hover,
  &.ant-btn:focus {
    border-color: #cbd5e1 !important;
    background: #f1f5f9 !important;
    color: #0f172a !important;
  }
`;

export const NextBillingText = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: #0f172a;
    font-weight: 600;
  }
`;
