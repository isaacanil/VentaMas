import styled from 'styled-components';

export const QuickActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px;
  border: 1px solid ${(p) => (p.$danger ? 'rgb(220 38 38 / 20%)' : '#e2e8f0')};
  border-radius: 10px;
  background: ${(p) => (p.$danger ? 'rgb(254 242 242)' : '#f8fafc')};
  cursor: pointer;
  text-align: left;
  transition:
    background 0.12s,
    border-color 0.12s;
  color: #64748b;
  font-size: 0.8rem;

  &:hover {
    background: ${(p) => (p.$danger ? 'rgb(254 226 226)' : '#f1f5f9')};
    border-color: ${(p) => (p.$danger ? 'rgb(220 38 38 / 35%)' : '#cbd5e1')};
  }
`;

export const QuickActionLabel = styled.p<{ $danger?: boolean }>`
  margin: 0;
  color: ${(p) => (p.$danger ? '#dc2626' : '#0f172a')};
  font-size: 0.88rem;
  font-weight: 500;
`;

export const QuickActionDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.75rem;
`;
