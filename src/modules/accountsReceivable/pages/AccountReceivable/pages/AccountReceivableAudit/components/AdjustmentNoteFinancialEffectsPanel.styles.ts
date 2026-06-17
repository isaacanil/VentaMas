import { Space, Typography } from 'antd';
import styled from 'styled-components';

const { Title } = Typography;

export const Header = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const SummaryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const ImpactTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

export const PanelTitle = styled(Title)`
  && {
    margin: 0;
  }
`;

export const FullWidthSpace = styled(Space)`
  width: 100%;
`;
