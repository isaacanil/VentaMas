import React, { useState } from "react";
import * as antd from "antd";
import { icons } from "../../../../../../constants/icons/icons";
import { back, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { MenuApp } from "../../../../../templates/MenuApp/MenuApp";
import { Outlet, useNavigate } from "react-router-dom";
const { Modal, Breadcrumb, Button } = antd;

const widthSize = "calc(100vw - 16px)";
const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr; 
  height: 100vh;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
  max-width: 1300px;
 width: ${widthSize};
 height: 2.4em;
  margin: 0 auto;
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  overflow-y: auto;
  gap: 1em;
  padding: 0.5em;
`

const StyledBreadcrumb = styled(Breadcrumb)`
  flex-grow: 1;
`;

const BackButton = styled(Button)`
  margin-right: 8px;
`;
const ContentContainer = styled.div`
 max-width: 1300px;
 width: ${widthSize};
  margin: 0 auto;
`;

export default function WarehouseLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentView, selectedWarehouse, selectedShelf, selectedRowShelf, selectedSegment, breadcrumbs } = useSelector(selectWarehouse);

  const handleBack = () => {
    dispatch(back());
    navigate(-1)
  };

  return (
    <Container>
      <MenuApp sectionName={selectedWarehouse?.name} />
      <Wrapper>
        <Header>
          {breadcrumbs.length == 1 && (
            <BackButton key="backToList" onClick={handleBack} icon={icons.arrows.chevronLeft} >
              Volver a la lista
            </BackButton>
          )}
          {breadcrumbs.length > 1 && (
            <BackButton key="back" onClick={handleBack} size="small" icon={icons.arrows.chevronLeft} />
          )}
          {breadcrumbs.length > 1 && (
            <StyledBreadcrumb>
              {breadcrumbs.map((crumb, index) => (
                <Breadcrumb.Item key={index}>{crumb.title}</Breadcrumb.Item>
              ))}
            </StyledBreadcrumb>
          )}
        </Header>
        <ContentContainer>
          <Outlet />
        </ContentContainer>
      </Wrapper>
    </Container>

  );
}
