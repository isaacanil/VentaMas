import React, { useState } from 'react'
import { InputV4 } from '../../../../../../../templates/system/Inputs/InputV4'
import { icons } from '../../../../../../../../constants/icons/icons'
import styled from 'styled-components'
import { Button, ButtonGroup } from '../../../../../../../templates/system/Button/Button'
import { fbUpdateUserPassword } from '../../../../../../../../firebase/Auth/fbAuthV2/fbUpdateUser'
import { useDispatch } from 'react-redux'
import { addNotification } from '../../../../../../../../features/notification/notificationSlice'
const formIcon = icons.forms
export const ChangePassword = ({ user = null, isOpen = false, setIsOpen, onClose }) => {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [errors, setErrors] = useState({})
    const dispatch = useDispatch()
    const handleSubmit = async () => {
        console.log('submit', oldPassword, newPassword, user.id, user.name)
        try {
            await fbUpdateUserPassword(user.id, oldPassword, newPassword)
            onClose();
            dispatch(addNotification({
                title: 'Contraseña actualizada',
                message: 'La contraseña se actualizó correctamente',
                type: 'success'
            }))
        } catch (error) {
            console.log(error)
        }
    }

    return (
        isOpen &&
        <Backdrop>
            <Container>
                <Header>
                    <div>
                        <h3>Cambiar contraseña de {user.name}</h3>
                    </div>
                    <div>
                        <p>Para cambiar la contraseña, ingrese la contraseña antigua y la nueva contraseña.</p>
                    </div>
                </Header>
                <Body>
                    <InputV4
                        icon={formIcon.user}
                        value={oldPassword}
                        label='Contraseña antigua'
                        type='password'
                        size='large'
                        placeholder='Contraseña antigua'
                        errorMessage={errors.name}
                        validate={errors.name}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <InputV4
                        icon={formIcon.user}
                        label='Nueva contraseña'
                        type='password'
                        size='large'
                        placeholder='Nueva contraseña'
                        errorMessage={errors.name}
                        validate={errors.name}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </Body>
                <Footer>
                    <ButtonGroup>
                        <Button
                            title={'Cancela'}
                            bgcolor={'gray'}
                            borderRadius={'light'}
                            onClick={() => onClose()}
                        />
                        <Button
                            title={'Guardar'}
                            bgcolor={'primary'}
                            borderRadius={'light'}
                            onClick={() => handleSubmit()}
                        />
                    </ButtonGroup>
                </Footer>
            </Container>
        </Backdrop>
    )
}
const Backdrop = styled.div`
 width: 100%;
 height: calc(100vh - 2.75em);
    position: absolute;
    display: flex;
    justify-content: center;
   

`
const Header = styled.div`
    display: grid;
    gap: 0.8em;
`
const Body = styled.div`
    display: grid;
    align-content: start;
    gap: 1em;
`
const Container = styled.div`
    position: absolute;
    padding: 1em;
    border: 3px solid #779df0;
    border-radius: 4px;
    width: 100%;
    height: 400px;
    box-shadow: 0 0 10px 4px rgba(0,0,0,.3);
    max-width: 500px;
    background-color: white;
    grid-template-rows: min-content  1fr min-content;
    display: grid;
    align-content: start;
    gap: 1.4em;
`
const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    padding: 0 1em;
`
