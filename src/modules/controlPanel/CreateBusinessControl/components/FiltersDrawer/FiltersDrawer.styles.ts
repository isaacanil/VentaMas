import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Space } from 'antd';
import styled from 'styled-components';

export const DrawerTitle = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const TitleIcon = styled(FontAwesomeIcon)`
  color: #1890ff;
`;

export const DrawerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FiltersSpace = styled(Space)`
  width: 100%;
`;

export const FilterControl = styled.div`
  .ant-select {
    width: 100%;
  }
`;

export const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #595959;
`;

export const LabelIcon = styled(FontAwesomeIcon)`
  margin-right: 8px;
`;

export const SortOption = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
