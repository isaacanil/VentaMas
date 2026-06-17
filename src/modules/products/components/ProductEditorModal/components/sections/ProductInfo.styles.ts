import styled from 'styled-components';

export const FieldWithAction = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) min-content;
  gap: 0.2em;

  .ant-form-item {
    min-width: 0;
  }
`;
