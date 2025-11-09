import { Form, Input, Button } from 'antd';
import styled from 'styled-components';

import { DatePicker } from '../../../../../../../../../components/common/DatePicker';

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
  margin-bottom: 24px;
  min-height: 400px;
  display: grid;
  grid-template-rows: min-content min-content 1fr;

  border-radius: 8px;
  background-color: #fff;
`;

export const Title = styled.h2`
  margin-bottom: 1em;
  font-size: 1.1em;
  font-weight: 600;
`;

export const TitleSection = styled.div`
  /* padding: 1em 0; */
`;

export const SearchContainer = styled(Form)`
  display: grid;
  grid-template-columns: repeat(5, min-content);
  align-items: end;
  gap: 16px;
`;

export const SearchInput = styled(Input)`
  width: 240px;

  .ant-input-prefix {
    color: #8c8c8c;
    margin-right: 8px;

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
    background: #e8e8e8;
    border-color: #d9d9d9;
    color: #ff4d4f;
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
  justify-content: flex-end;
  gap: 6px;
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
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  
  .anticon {
    font-size: 14px;
  }
`;

export const ExpirationDateText = styled.span<{ $expired: boolean }>`
  color: ${({ $expired }) => ($expired ? '#cf1322' : 'inherit')};
  font-weight: ${({ $expired }) => ($expired ? 600 : 400)};
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
  color: #8c8c8c;
  font-size: 0.9em;
  display: inline-block;
`;
