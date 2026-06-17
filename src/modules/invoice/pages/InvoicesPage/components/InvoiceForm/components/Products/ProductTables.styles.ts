import React from 'react';
import { Table as AntTable, type TableProps } from 'antd';
import styled from 'styled-components';

import type { InvoiceProduct } from '@/types/invoice';

const ProductTableBase = (props: TableProps<InvoiceProduct>) =>
  React.createElement(
    AntTable as React.ComponentType<TableProps<InvoiceProduct>>,
    props,
  );

export const StyledProductTable = styled(ProductTableBase)`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .ant-table {
    background: transparent;
  }

  .ant-table-thead > tr > th {
    background: #ffff !important;
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
    background: rgb(204 204 204 / 20%) !important;

    /* border: 1px solid #dbeafe !important; */
  }

  .ant-table-tbody > tr:hover {
    background: #ffff !important;
    border: 1px solid #dbeafe !important;
  }
`;
