import React from 'react'
import styled from 'styled-components'
import { Row } from '../../../../../../../../templates/system/Table/Row'
import { Button } from '../../../../../../../../templates/system/Button/Button'
import { icons } from '../../../../../../../../../constants/icons/icons'
import { fbDeleteUser } from '../../../../../../../../../firebase/users/fbDeleteUser'
import { useNavigate } from 'react-router-dom'
import { inspectUserAccess } from '../../../../../../../../../hooks/abilities/useAbilities'
import { selectAbilities } from '../../../../../../../../../features/abilities/abilitiesSlice'
import { useSelector } from 'react-redux'

export const Item = ({ data, num, colWidth }) => {
  const navigate = useNavigate()
  const { abilities } = inspectUserAccess();

  const handleDeleteUser = () => {
    fbDeleteUser(data.user.id)
  }
  const handleEditUser = () => {
    navigate('/users/create')
  }
  const renamedAbilities = (abilities) => {
    switch (abilities) {
      case 'owner':
        return 'Dueño'
      case 'admin':
        return 'Admin'
      case 'buyer':
        return 'Compras'
      case 'cashier':
        return 'Cajero'
      case 'manager':
        return 'Gerente'
    }
  }
  return (
    <Container onClick={handleEditUser} role={data?.user?.role}>
      <Row col={colWidth}>
        <Col>
          {num + 1}
        </Col>
        <Col>
          {data?.user?.name}
        </Col>
        <Col>
          <Role role={data?.user?.role}>
            {renamedAbilities(data?.user?.role)}
          </Role>
        </Col>
        <Col>
          {data?.user?.active ? "Activo" : "inactivo"}
        </Col>
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
  )
}

const Role = styled.div`
    height: 2em;
    max-width: 120px;
    border-radius: var(--border-radius);
    width: 100%;
  display: flex;
  text-transform: capitalize;
  align-items: center;
  padding: 0 1em;
  color: white;
    background-color: ${(props) => {
    switch (props.role) {
      case 'owner':
        return `#0072F5`
      case 'admin':
        return `#9750DD;`
      case 'buyer':
        return `#17C964;`
      case 'cashier':
        return `#F5A524;`
      case 'manager':
        return `#F31260;`
      default:
    }
  }};
      `
const Container = styled.div`
    height: 3em;
    width: 100%;
    padding: 0 1em;
    display: flex;

    align-items: center;
    font-size: 14px;
  
    :hover{
        background-color: var(--White2);
    }
`
const Col = styled.div`
width: 100%;
padding: 0 0.4em;
    ${(props) => {
    switch (props.text) {
      case 'right':
        return `
          text-align: right;
        `
      case 'left':
        return `
          text-align: left;
          `
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
        `
      case 'left':
        return `
          text-align: left;
          `
      default:
        break;
    }
  }}
`