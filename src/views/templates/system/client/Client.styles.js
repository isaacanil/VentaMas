import { css } from 'styled-components';

export const clientGridTemplate = '45px  1fr 120px 120px';

export const clientGridTemplateWithActions = `${clientGridTemplate} 60px`;

export const clientHeaderStyles = css`
  display: grid;
  grid-template-columns: ${clientGridTemplateWithActions};
  column-gap: 0.5em;
  align-items: center;
  padding: 0.65em 1em;
  border-radius: 10px;
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  font-size: 0.86rem;
  font-weight: 700;
  color: #475569;

  .actions-col {
    justify-self: end;
  }
`;
