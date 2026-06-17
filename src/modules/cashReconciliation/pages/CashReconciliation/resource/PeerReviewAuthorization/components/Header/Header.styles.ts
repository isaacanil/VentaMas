import { Typography } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

export const HeaderContainer = styled.div`
  display: grid;
  gap: 1.4em;
`;

export const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 1.2em;
  padding-right: 0.5em;
`;

export const TitleContainer = styled.div`
  width: calc(100% - 2.5em);
`;

export const HeaderTitle = styled(Title)`
  && {
    margin: 0;
    font-weight: 500;
  }
`;

export const HeaderDescription = styled(Text)`
  font-size: 0.9rem;
  line-height: 1.5;
`;
