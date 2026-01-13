import { Breadcrumb, Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { back, selectWarehouse } from '@/features/warehouse/warehouseSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

const widthSize = 'calc(100vw - 16px)';
const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  width: ${widthSize};
  max-width: 1300px;
  height: 2.4em;
  margin: 0 auto;
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 1em;
  padding: 0.5em;
  overflow-y: auto;
`;

const StyledBreadcrumb = styled(Breadcrumb)`
  flex-grow: 1;
`;

const BackButton = styled(Button)`
  margin-right: 8px;
`;
const ContentContainer = styled.div`
  width: ${widthSize};
  max-width: 1300px;
  margin: 0 auto;
`;

interface BreadcrumbItem {
  title: string;
}

export default function WarehouseLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedWarehouse, breadcrumbs } = useSelector(
    selectWarehouse,
  ) as ReturnType<typeof selectWarehouse>;

  const handleBack = () => {
    dispatch(back());
    navigate(-1);
  };

  return (
    <Container>
      <MenuApp sectionName={selectedWarehouse?.name} />
      <Wrapper>
        <Header>
          {breadcrumbs.length === 1 && (
            <BackButton
              key="backToList"
              onClick={handleBack}
              icon={icons.arrows.chevronLeft}
            >
              Volver a la lista
            </BackButton>
          )}
          {breadcrumbs.length > 1 && (
            <BackButton
              key="back"
              onClick={handleBack}
              size="small"
              icon={icons.arrows.chevronLeft}
            />
          )}
          {breadcrumbs.length > 1 && (
            <StyledBreadcrumb>
              {(breadcrumbs as BreadcrumbItem[]).map((crumb, index) => (
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

