import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FormattedValue } from '../../../../../templates/system/FormattedValue/FormattedValue'
import { Modal } from '../../../../../component/modals/Modal'
import { InputV4 } from '../../../../../templates/system/Inputs/InputV4'
import Select from '../../../../../templates/system/SelectV3/SelectV3'
import { nanoid } from 'nanoid'
import ElemLabel from '../../../../../templates/system/ElemLabel/ElemLabel'
import { icons } from '../../../../../../constants/icons/icons'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../../features/auth/userSlice'
import { generateEmail } from '../../../../../../firebase/Auth/fbSignUpWithUsernameAndPassoword/functions/randomEmail'
import { fbSignUpUserAccount } from '../../../../../../firebase/Auth/fbSignUpWithUsernameAndPassoword/fbSignUpWithUsernameAndPassword'
import { validationRules } from '../../../../../templates/system/Inputs/validationRules'
import PasswordStrengthIndicator from '../../../../../templates/system/Form/PasswordStrengthIndicator'
import { useNavigate } from 'react-router-dom'
import { SelectSignUpUserModal, toggleSignUpUser } from '../../../../../../features/modals/modalSlice'
import { Button } from '../../../../../templates/system/Button/Button'
import { DateTime } from 'luxon'
import { fbSignUp } from '../../../../../../firebase/Auth/fbAuthV2/fbSignUp'
import { Timestamp } from 'firebase/firestore'

const formIcon = icons.forms

const SignUp = () => {

    const userInfo = useSelector(selectUser)

    const signUpModal = useSelector(SelectSignUpUserModal)
    const { isOpen } = signUpModal;
    const navigate = useNavigate()

    console.log(userInfo.businessID)
    const [user, setUser] = useState({
        name: '',
        password: '',
        role: '',
        id: '',
        businessID: undefined,
        createAt: ""
    })

    const [rol, setRol] = useState('')

    const rolOptions = [
        { id: 'role_admin', label: 'Admin' },
        { id: 'role_manager', label: 'Gerente' },
        { id: 'role_cashier', label: 'Cajero' },
        { id: 'role_buyer', label: 'Comprador' },
    ]

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setUser({
            ...user,
            [name]: value,
        })

    }
  
    const handleSubmit = async () => {
        // Verifica si businessID está disponible.
        if (!userInfo.businessID) {
            alert("Business ID is missing");  // Mostrar algún mensaje al usuario o manejar de otra manera.
            return;  // Detén la función si businessID no está presente.
        }
        const createAt = Timestamp.now();

        // Crea un nuevo objeto user con los datos actualizados.

        let updatedUser = {
            ...user,
            businessID: userInfo.businessID,
            role: rol.id,
            createAt,
            id: nanoid(10),
        };

        // Crea un nuevo usuario con los datos actualizados.

        try {
            await fbSignUp(updatedUser, navigate);
        } catch (error) {
            console.error(error)
        }


        setUser({
            name: '',
            password: '',
            role: '',
            id: '',
            businessID: undefined,
            createAt: ""
        });
        setRol('');

    }


    return (

        <Container>
            <Header>
            </Header>
            <Body>
                <InputV4
                    icon={formIcon.user}
                    value={user.name}
                    label='Nombre de Usuario'
                    type='text'
                    placeholder='Nombre de Usuario'
                    name='name'
                    errorMessage={'Nombre de usuario es requerido'}
                    validate={user.name === ''}
                    onChange={handleInputChange}
                />
                <ElemLabel label={'Rol'}>
                    <Select
                        title="Seleccionar opción"
                        options={rolOptions}
                        optionsLabel="label"
                        value={rol}
                        onChange={setRol}
                    />
                </ElemLabel>
                <InputV4
                    icon={formIcon.password}
                    label='Password'
                    value={user.password}
                    type='password'
                    placeholder='Password'
                    name='password'
                    onChange={handleInputChange}
                />
                <PasswordStrengthIndicator password={user.password} confirmPassword={user.confirmPassword} />
            </Body>
            <Footer>
                <Button
                    title={'Guardar'}
                    bgcolor={'primary'}
                    borderRadius={'light'}
                    onClick={handleSubmit}
                />
            </Footer>
            {JSON.stringify(user)}
        </Container>


    )
}

export default SignUp
const Container = styled.div`
max-width: 600px;
`
const Header = styled.div``
const Body = styled.div`
padding: 1.8em 1.5em;
display: grid;
gap: 1em;
`
const Footer = styled.div`
    display: flex;
    justify-content: end;
    padding: 0 1em;
`
const Group = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
`