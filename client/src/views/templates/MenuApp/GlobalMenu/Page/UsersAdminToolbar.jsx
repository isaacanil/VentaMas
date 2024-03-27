import React from 'react'
import styled from 'styled-components'
import { SearchInput } from '../../../system/Inputs/SearchInput'
import { FaSearch } from 'react-icons/fa'
import { FormattedValue } from '../../../system/FormattedValue/FormattedValue'
import { useMatch } from 'react-router-dom'
import ROUTES_NAME from '../../../../../routes/routesName'
import { useMatchRouteByName } from '../useMatchRouterByName'
import * as antd from 'antd'
import { icons } from '../../../../../constants/icons/icons'
const { Button } = antd
import { useDispatch } from 'react-redux'
import { toggleSignUpUser } from '../../../../../features/modals/modalSlice'
const UsersAdminToolbar = ({ side = 'left', searchData, setSearchData }) => {
    const { USERS_LIST } = ROUTES_NAME.SETTING_TERM
    const dispatch = useDispatch()
    const handleOpenModal = () => {
        dispatch(toggleSignUpUser({isOpen: true}))
    }
    const matchWithUsers = useMatch("/users/list")
    return (
        matchWithUsers ? (
            <Container>
                {/* {side === 'left' && (
                    <Group>
                        <SearchInput
                            deleteBtn
                            icon={<FaSearch />}
                            placeholder='Buscar ...'
                            bgColor={'white'}
                            value={searchData}
                            onChange={(e) => setSearchData(e.target.value)}
                        />
                    </Group>
                )} */}
                {
                    side === 'right' && (
                       <Button 
                       onClick={handleOpenModal}
                        icon={icons.operationModes.add}
                       >
                        Usuario
                       </Button>
                    )
                }
            </Container>

        ) : null

    )
}

export default UsersAdminToolbar

const Container = styled.div``
const SectionName = styled.div``
const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4em;
 
`