import styled from 'styled-components';

export const Stack = styled.div`
  display: grid;
  gap: 16px;
`;

export const Field = styled.div`
  display: grid;
  gap: 6px;
`;

export const FieldLabel = styled.span`
  color: #64748b;
  font-size: 0.83rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

export const PlanLabel = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 0;
`;

export const PlanLabelName = styled.span`
  color: inherit;
  font-size: 0.88rem;
  font-weight: 600;
`;

export const PlanLabelCode = styled.span`
  color: #94a3b8;
  font-family: monospace;
  font-size: 0.72rem;
  font-weight: 400;
`;
