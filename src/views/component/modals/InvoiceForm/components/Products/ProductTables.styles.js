import { Table as AntTable } from 'antd';
import styled from 'styled-components';

export const StyledProductTable = styled(AntTable)`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .ant-table {
    background: transparent;
  }

  .ant-table-thead > tr > th {
    background: #ffffffff !important;
    color: #374151;
    font-weight: 600;
    font-size: 13px;
    border-bottom: 1px solid #dadbdbff;
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f3f4f6;
    font-size: 14px;
    color: #1f2937;
    border: 1px solid transparent;
  }

  .ant-table-tbody > tr:hover > td {
    background: rgba(204, 204, 204, 0.2) !important;
    // border: 1px solid #dbeafe !important;
  }
  .ant-table-tbody > tr:hover {
    background: #ffffffff !important;
    border: 1px solid #dbeafe !important;
  }
`;
