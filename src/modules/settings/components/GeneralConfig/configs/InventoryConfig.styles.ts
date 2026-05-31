import { Select, Typography } from 'antd';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

export const Page = styled.div`
  display: grid;
  gap: 1.6em;
  padding: 1em;
`;

export const Head = styled.div`
  display: grid;
  gap: 0.4em;
`;

export const Heading = styled(Title).attrs({ level: 3 })`
  && {
    margin: 0;
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

export const SectionCard = styled.section`
  display: grid;
  gap: 1.2em;
  padding: 18px;
  border: 1px solid #e5e9f2;
  border-radius: 12px;
  background-color: #fdfdfd;
`;

export const SectionHeader = styled.div`
  display: grid;
  gap: 0.4em;
`;

export const SectionTitle = styled(Text).attrs({ strong: true })`
  && {
    color: #1f2933;
    font-size: 16px;
  }
`;

export const SectionDescription = styled(Paragraph)`
  && {
    margin: 0;
    color: rgb(31 41 51 / 60%);
    font-size: 14px;
  }
`;

export const OptionContent = styled.div`
  display: grid;
  gap: 4px;
`;

export const SelectorContainer = styled.div`
  display: grid;
  gap: 0.6em;
`;

export const StyledSelect = styled(Select)`
  && {
    width: 100%;
  }

  && .ant-select-selector {
    padding: 12px;
    border-color: #e5e9f2;
    border-radius: 10px;
  }

  && .ant-select-selection-item {
    display: grid;
    gap: 2px;
    line-height: 1.3;
  }

  && .ant-select-item-option-content {
    display: grid;
    gap: 4px;
    line-height: 1.35;
  }
`;

export const OptionLabel = styled.span`
  color: #1f2933;
  font-weight: 600;
`;

export const OptionMeta = styled.span`
  color: rgb(31 41 51 / 58%);
  font-size: 13px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
`;

export const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

export const ActionHelper = styled(Text)`
  && {
    margin: 0;
    color: rgb(31 41 51 / 60%);
    font-size: 14px;
  }
`;
