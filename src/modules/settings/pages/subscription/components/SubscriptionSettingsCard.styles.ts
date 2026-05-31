import styled, { keyframes } from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const PageHeaderText = styled.div``;

export const PageTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 600;
`;

export const PageDesc = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.85rem;
`;

export const Card = styled.div`
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

export const DangerCard = styled(Card)`
  border-color: rgb(220 38 38 / 25%);
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const PortalRow = styled(ToggleRow)``;

export const ToggleInfo = styled.div``;

export const ToggleLabel = styled.label`
  display: block;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
`;

export const ToggleDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  max-width: 52ch;
`;

export const FiscalBox = styled.div`
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

export const FiscalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const FiscalTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
`;

export const FiscalGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const FiscalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

export const FiscalKey = styled.span`
  color: #64748b;
  font-size: 0.82rem;
`;

export const FiscalVal = styled.span<{ $mono?: boolean }>`
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 500;
  ${(p) => p.$mono && 'font-family: monospace;'}
`;

export const DangerBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const DangerInfo = styled.div``;

export const DangerInfoTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
`;

export const DangerInfoDesc = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  max-width: 42ch;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
`;

export const CancelDoneBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px 16px;
  text-align: center;
  animation: ${fadeIn} 0.25s ease;
`;

export const CancelDoneIcon = styled.div`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgb(220 38 38 / 10%);
  color: #dc2626;
  font-size: 1.4rem;
`;

export const CancelDoneTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 600;
`;

export const CancelDoneDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 32ch;
`;

export const CancelConfirmBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 4px;
  text-align: center;
`;

export const CancelConfirmIcon = styled.div`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgb(220 38 38 / 10%);
  color: #dc2626;
  font-size: 1.2rem;
`;

export const CancelConfirmTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
`;

export const CancelConfirmDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 34ch;
`;

export const CancelConfirmFooter = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
`;
