import { Form, Input, Button } from 'antd';
import styled from 'styled-components';

import { DatePicker } from '@/components/common/DatePicker';

const iconButtonStyles = `
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;

  .anticon,
  svg {
    font-size: 16px;
  }
`;

export const Container = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  min-height: 400px;
  margin-bottom: 24px;
  background-color: #fff;
  border-radius: 8px;
`;

export const Title = styled.h2`
  margin-bottom: 1em;
  font-size: 1.1em;
  font-weight: 600;
`;

export const TitleSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const TitleActions = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
`;

export const ToolbarButton = styled(Button)`
  ${iconButtonStyles};
`;

export const SearchContainer = styled(Form)`
  display: grid;
  grid-template-columns: repeat(5, min-content);
  gap: 16px;
  align-items: end;
`;

export const SearchInput = styled(Input)`
  width: 240px;

  .ant-input-prefix {
    margin-right: 8px;
    color: #8c8c8c;

    svg {
      font-size: 14px;
    }
  }
`;

export const StyledDatePicker = styled(DatePicker)`
  width: 230px;
`;

export const ClearButton = styled(Button)`
  ${iconButtonStyles};

  background: #f5f5f5;
  border: 1px solid #d9d9d9;

  &:hover {
    color: #ff4d4f;
    background: #e8e8e8;
    border-color: #d9d9d9;
  }
`;

export const SortButton = styled(Button)`
  ${iconButtonStyles};
`;

export const AdvancedFilterButton = styled(Button)`
  ${iconButtonStyles};
`;

export const ActionContainer = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

export const ActionButton = styled(Button)`
  &.ant-btn {
    padding: 4px 8px;

    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

export const MenuItemContent = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 2px 0;

  .anticon {
    font-size: 14px;
  }
`;

export const ExpirationDateText = styled.span<{ $expired: boolean }>`
  font-weight: ${({ $expired }) => ($expired ? 600 : 400)};
  color: ${({ $expired }) => ($expired ? '#cf1322' : 'inherit')};
`;

export const FilterModalContent = styled.div`
  display: grid;
  gap: 20px;
  padding-top: 8px;
`;

export const FilterSection = styled.div`
  display: grid;
  gap: 12px;
`;

export const FilterSectionTitle = styled.h3`
  margin: 0;
  font-size: 1em;
  font-weight: 600;
  color: #1f1f1f;
`;

export const FilterSelectContainer = styled.div`
  display: grid;
  gap: 8px;
  align-items: flex-start;
`;

export const MutedText = styled.span`
  display: inline-block;
  font-size: 0.9em;
  color: #8c8c8c;
`;

export const ProductNameCell = styled.span`
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProductNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
`;
