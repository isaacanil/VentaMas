import styled from 'styled-components';

export const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 720px;
`;

export const TitleIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgb(13 148 136 / 10%);
  color: #0f766e;
  font-size: 14px;
  margin-right: 10px;
  flex-shrink: 0;
  vertical-align: middle;
`;

export const PageTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  display: flex;
  align-items: center;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;

export const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 20px;
`;

export const LoadingText = styled.p`
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  text-align: center;
`;

export const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #f1f5f9;
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-size: 22px;
`;

export const EmptyTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
`;

export const EmptyDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  max-width: 420px;
`;
