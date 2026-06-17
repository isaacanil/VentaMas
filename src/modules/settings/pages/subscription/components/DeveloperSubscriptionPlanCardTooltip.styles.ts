import styled from 'styled-components';

export const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

export const TooltipSectionTitle = styled.p`
  margin: 0;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(255 255 255 / 50%);
`;

export const TooltipRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const TooltipRowIcon = styled.span`
  width: 14px;
  text-align: center;
  font-size: 11px;
  color: rgb(255 255 255 / 55%);
  flex-shrink: 0;
`;

export const TooltipRowLabel = styled.span`
  flex: 1;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 80%);
`;

export const TooltipRowValue = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffffff;
`;

export const TooltipDivider = styled.hr`
  margin: 2px 0;
  border: none;
  border-top: 1px solid rgb(255 255 255 / 12%);
`;

export const TooltipModuleList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
`;

export const TooltipModuleItem = styled.span`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 85%);

  svg {
    font-size: 9px;
    color: #34d399;
    flex-shrink: 0;
  }
`;
