import React from 'react'
import styled from 'styled-components'
import { useMatch } from 'react-router-dom'
import { Button } from 'antd'
import { icons } from '../../../../../constants/icons/icons'
import { useDispatch } from 'react-redux'
import { toggleSignUpUser } from '../../../../../features/modals/modalSlice'

const UsersAdminToolbar = ({ side = 'left' }) => {
    const dispatch = useDispatch()

    const handleOpenModal = () =>  dispatch(toggleSignUpUser({isOpen: true}))
    
    const matchWithUsers = useMatch("/users/list")

    return (
        matchWithUsers ? (
            <Container>
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