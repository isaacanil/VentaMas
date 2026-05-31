import { DatePicker, Input } from 'antd';
import styled from 'styled-components';

const { RangePicker } = DatePicker;

export const HeaderContainer = styled.div`
  margin-bottom: 24px;
`;

export const HeaderStats = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

export const StatBox = styled.div<{ $tone: 'total' | 'pending' | 'reserved' }>`
  min-width: 80px;
  padding: 6px 12px;
  border-radius: 4px;
  background: ${({ $tone }) =>
    $tone === 'pending' ? '#fff7e6' : $tone === 'reserved' ? '#e6f7ff' : '#fafafa'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'pending' ? '#ffd591' : $tone === 'reserved' ? '#91d5ff' : '#f0f0f0'};
`;

export const StatValue = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

export const StatLabel = styled.div`
  font-size: 11px;
  color: #8c8c8c;
`;

export const FiltersWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
`;

export const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
`;

export const Label = styled.span`
  font-size: 11px;
  color: #8c8c8c;
`;

export const SearchInput = styled(Input)`
  width: 180px;
`;

export const RangeInput = styled(RangePicker)`
  width: auto;
`;

export const SelectControl = styled.div`
  width: 160px;

  .ant-select {
    width: 100%;
  }
`;

export const ExportAction = styled.div`
  margin-left: auto;
`;
