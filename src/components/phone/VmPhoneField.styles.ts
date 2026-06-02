import styled from 'styled-components';

export const PhoneFieldRoot = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const PhoneError = styled.span`
  color: var(--ds-color-danger-text, #b42318);
  font-size: var(--ds-font-size-xs);
`;
