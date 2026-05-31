import { Typography } from 'antd';
import styled from 'styled-components';

const { Paragraph: AntParagraph, Title: AntTitle } = Typography;

export const Page = styled.div`
  display: grid;
  gap: var(--ds-space-5);
  min-height: 100%;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-page);
`;

export const Head = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

export const Grid = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

export const PageTitle = styled(AntTitle)`
  &.ant-typography {
    margin: 0;
  }
`;

export const PageDescription = styled(AntParagraph)`
  &.ant-typography {
    margin: 0;
    color: var(--ds-color-text-secondary);
  }
`;
