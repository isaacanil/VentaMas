import { Card } from 'antd';
import styled from 'styled-components';

export const ContentWrapper = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  max-width: 1200px;
  padding: 0 1rem;
  margin: 2rem auto;
`;

export const StyledCard = styled(Card)`
  height: 100%;

  .ant-card-meta-title {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .ant-card-meta-description {
    line-height: 1.5;
    color: rgb(0 0 0 / 45%);
  }
`;
