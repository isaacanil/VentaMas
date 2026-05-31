import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const CardNetBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid rgb(13 148 136 / 20%);
  border-radius: 12px;
  background: #ffffff;
`;

export const CardNetIconWrap = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgb(13 148 136 / 10%);
  color: #0d9488;
  font-size: 1.25rem;
`;

export const CardNetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const CardNetTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
`;

export const VerifiedBadge = styled.span`
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid rgb(13 148 136 / 25%);
  background: rgb(13 148 136 / 10%);
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 600;
`;

export const CardNetDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.5;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
`;

export const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SavedCardRow = styled.div<{ $default: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid ${(p) => (p.$default ? 'rgb(13 148 136 / 30%)' : '#e2e8f0')};
  border-radius: 12px;
  background: #ffffff;
`;

export const BrandBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 52px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #0d9488;
`;

export const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const CardInfoTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
`;

export const DefaultBadge = styled.span`
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid rgb(13 148 136 / 25%);
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 600;
`;

export const CardInfoSub = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.78rem;
`;

export const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

export const ActionPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

export const ActionPanelTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const ActionPanelDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.5;
`;

export const ActionList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: #374151;
  font-size: 0.82rem;
  line-height: 1.6;
`;

export const ActionItem = styled.li``;

export const SecuritySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

export const SecurityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const SecurityFeatureBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

export const SecurityFeatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0d9488;
  font-size: 0.85rem;
`;

export const SecurityFeatureTitle = styled.span`
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 500;
`;

export const SecurityFeatureDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.4;
`;
