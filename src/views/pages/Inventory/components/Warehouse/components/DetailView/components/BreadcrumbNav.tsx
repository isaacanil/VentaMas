// @ts-nocheck
import { Breadcrumb } from 'antd';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { navigateToBreadcrumb } from '@/features/warehouse/warehouseSlice';

const StyledBreadcrumb = styled(Breadcrumb)`
  margin-bottom: 16px;
`;

const BreadcrumbLink = styled.span`
  color: #1890ff;
  cursor: pointer;
`;

type BreadcrumbItem = {
  title: string;
};

type BreadcrumbNavProps = {
  breadcrumbs?: BreadcrumbItem[];
};

export const BreadcrumbNav = ({ breadcrumbs = [] }: BreadcrumbNavProps) => {
  const dispatch = useDispatch();

  if (!breadcrumbs.length) return null;

  const items = breadcrumbs.map((item, index) => ({
    title: (
      <BreadcrumbLink onClick={() => dispatch(navigateToBreadcrumb(index))}>
        {item.title}
      </BreadcrumbLink>
    ),
  }));

  return <StyledBreadcrumb items={items} />;
};
