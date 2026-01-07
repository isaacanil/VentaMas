// @ts-nocheck
import styled from 'styled-components';

const BreadcrumbContainer = styled.nav`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #555;
`;

const BreadcrumbLink = styled.a`
  color: #0070f3;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 8px;
  color: #aaa;
`;

type BreadcrumbsProps = {
  currentPage: string;
};

export default function Breadcrumbs({ currentPage }: BreadcrumbsProps) {
  return (
    <BreadcrumbContainer>
      <BreadcrumbLink href="#">Home</BreadcrumbLink>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <span>{currentPage}</span>
    </BreadcrumbContainer>
  );
}
