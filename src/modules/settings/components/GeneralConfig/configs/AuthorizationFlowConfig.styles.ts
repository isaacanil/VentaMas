import { Typography } from 'antd';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

export const Page = styled.div`
  display: grid;
  gap: 1.6em;
  padding: 1em;
`;

export const Head = styled.div`
  display: grid;
  width: 100%;
`;

export const Heading = styled(Title).attrs({ level: 3 })`
  && {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }
`;

export const Description = styled(Paragraph)`
  && {
    margin: 0;
    color: rgb(0 0 0 / 65%);
    font-size: 16px;
    line-height: 1.5;
  }
`;
