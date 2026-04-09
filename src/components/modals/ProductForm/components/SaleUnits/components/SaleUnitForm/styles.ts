import styled from 'styled-components';

export const FormContainer = styled.div``;

export const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1em;
  width: 100%;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1em;
  align-items: end;
`;

export const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1em;
  align-content: start;
  margin-top: 20px;
`;

export const Card = styled.div`
  width: 100%;
  padding: 8px 16px;
  background-color: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 2px rgb(0 0 0 / 15%);
`;

export const CardTitle = styled.h3`
  margin-bottom: 8px;
  font-size: 1rem;
`;

export const IconContainer = styled.div`
  margin-bottom: 8px;
`;

export const OptionTitle = styled.span`
  margin-right: 16px;
  font-weight: 550;
`;

export const OptionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
