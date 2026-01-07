// @ts-nocheck
import styled from 'styled-components';

export const SummaryContainer = styled.div`
  position: relative;
  padding: 0 10px;
  border-radius: 5px;
`;

export const LineItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0;

  &:first-child {
    border-bottom: 1px solid #ccc;
  }

  &:last-child {
    padding: 0;
    border-top: 1px solid #ccc;
  }
`;

export const DiscountInputContainer = styled.div`
  display: grid;
  gap: 4px;
  justify-items: end;
  min-width: 170px;
`;

export const AuthorizationNote = styled.span`
  font-size: 0.75rem;
  color: ${({ $tone }) => ($tone === 'warning' ? '#d48806' : '#595959')};
`;

export const TotalLine = styled(LineItem)`
  /* This is the total line in the invoice summary */
`;

export const TotalLabel = styled.span`
  display: grid;
  align-content: center;
  height: 2.4em;
  font-size: 1.2em;
  font-weight: bold;
`;

export const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
`;

export const ActionButton = styled.button`
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  background-color: #007bff;
  border: none;
  border-radius: 5px;

  &:disabled {
    cursor: not-allowed;
    background-color: #8a8a8a;

    &:hover {
      background-color: #585858;
    }
  }

  &:not(:disabled):hover {
    background-color: #0056b3;
  }
`;
