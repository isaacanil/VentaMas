// components/Breadcrumbs.jsx
import React from "react";
import styled from "styled-components";

const BreadcrumbContainer = styled.nav`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #555;
`;

const BreadcrumbLink = styled.a`
  text-decoration: none;
  color: #0070f3;
  &:hover {
    text-decoration: underline;
  }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 8px;
  color: #aaa;
`;

export default function Breadcrumbs({ currentPage }) {
  return (
    <BreadcrumbContainer>
      <BreadcrumbLink href="#">Home</BreadcrumbLink>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <span>{currentPage}</span>
    </BreadcrumbContainer>
  );
}
