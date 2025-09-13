import React from 'react';
import styled from 'styled-components';
import { Breadcrumb } from 'antd';
import { useDispatch } from 'react-redux';
import { navigateToBreadcrumb } from '../../../../../../../../features/warehouse/warehouseSlice';

const StyledBreadcrumb = styled(Breadcrumb)`
  margin-bottom: 16px;
`;

const BreadcrumbLink = styled.span`
  cursor: pointer;
  color: #1890ff;
`;

export const BreadcrumbNav = ({ breadcrumbs }) => {
  const dispatch = useDispatch();

  const items = breadcrumbs.map((item, index) => ({
    title: (
      <BreadcrumbLink onClick={() => dispatch(navigateToBreadcrumb(index))}>
        {item.title}
      </BreadcrumbLink>
    )
  }));

  return breadcrumbs.length > 0 ? (
    <StyledBreadcrumb items={items} />
  ) : null;
};
