import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { updateUser } from '../../../../../../../../../features/usersManagement/usersManagementSlice';
import { Row } from '../../../../../../../../templates/system/Table/Row';

export const Item = ({ data, num, colWidth }) => {
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const handleEditUser = () => {
    navigate('/users/update-user/' + data.user.id);
    dispatch(updateUser(data.user));
  };
  const renamedAbilities = (role) => {
    switch (role) {
      case 'owner':
        return 'Dueño';
      case 'admin':
        return 'Admin';
      case 'buyer':
        return 'Compras';
      case 'cashier':
        return 'Cajero';
      case 'manager':
        return 'Gerente';
      case 'dev':
        return 'Desarrollador';
    }
  };
  return (
    <Container onClick={handleEditUser} role={data?.user?.role}>
      <Row col={colWidth}>
        <Col>{num + 1}</Col>
        <Col>{data?.user?.name}</Col>
        <Col>
          <Role role={data?.user?.role}>
            {renamedAbilities(data?.user?.role)}
          </Role>
        </Col>
        <Col>{data?.user?.active ? 'Activo' : 'inactivo'}</Col>
        {/* <Col>
          {abilities.can("delete", "User") && (
            <Button
              width={'icon32'}
              color={'danger'}
              title={icons.operationModes.delete}
              onClick={handleDeleteUser}
            />
          )}
        </Col> */}
      </Row>
    </Container>
  );
};

const Role = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 120px;
  height: 2em;
  padding: 0 1em;
  font-weight: 600;
  color: ${(props) => {
    switch (props.role) {
      case 'owner':
        return `#0072F5`;
      case 'admin':
        return `#9750DD;`;
      case 'buyer':
        return `#17C964;`;
      case 'cashier':
        return `#F5A524;`;
      case 'manager':
        return `#F31260;`;
      case 'dev':
        return `#f312bb;`;
      default:
    }
  }};
  text-transform: capitalize;
  background-color: ${(props) => {
    switch (props.role) {
      case 'owner':
        return `#d1dfee`;
      case 'admin':
        return `#ddd4e7;`;
      case 'buyer':
        return `#cfe7da;`;
      case 'cashier':
        return `#e2d1b5;`;
      case 'manager':
        return `#e9c8d3;`;
      case 'dev':
        return `#ecd8e8;`;
      default:
    }
  }};
  border: 2px solid
    ${(props) => {
      switch (props.role) {
        case 'owner':
          return `#0072F5`;
        case 'admin':
          return `#9750DD;`;
        case 'buyer':
          return `#17C964;`;
        case 'cashier':
          return `#F5A524;`;
        case 'manager':
          return `#F31260;`;
        case 'dev':
          return `#f312bb;`;
        default:
      }
    }};
  border-radius: 100px;
`;
const Container = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 3em;
  padding: 0 1em;
  font-size: 14px;

  :hover {
    background-color: var(--white-2);
  }
`;
const Col = styled.div`
  width: 100%;
  padding: 0 0.4em;
  ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `;
      case 'left':
        return `
          text-align: left;
          `;
      default:
        break;
    }
  }}
  ${(props) => {
    switch (props.align) {
      case 'right':
        return `
        display: flex;
        justify-content: flex-end;
          text-align: right;
        `;
      case 'left':
        return `
          text-align: left;
          `;
      default:
        break;
    }
  }}
`;
