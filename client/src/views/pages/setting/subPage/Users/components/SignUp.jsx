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
import { ErrorMessage } from '../../../../../templates/ErrorMassage/ErrorMassage'
import { ErrorComponent } from '../../../../../templates/system/ErrorComponent/ErrorComponent'

const formIcon = icons.forms
const EmptyUser = {
    name: '',
    password: '',
    role: '',
    id: '',
    businessID: undefined,
    createAt: ""
}
const EmptyRol = {
    id: '',
    label: ''
}

const SignUp = () => {
    const userInfo = useSelector(selectUser);
    const [errors, setErrors] = useState({});
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
        { id: 'admin', label: 'Admin' },
        { id: 'manager', label: 'Gerente' },
        { id: 'cashier', label: 'Cajero' },
        { id: 'buyer', label: 'Comprador' },
    ]
    const validateUser = (user) => {
        let errors = {};
        let passwordErrors = [];
        if (!user.name) {
            errors.name = 'Nombre de usuario es requerido';
        }
        if (!user.password) {
            passwordErrors.push('Password es requerido');
        } else {
            if (user.password.length < 8) {
                passwordErrors.push('La contraseña debe tener al menos 8 caracteres.');
            }
            if (!/[A-Z]/.test(user.password)) {
                passwordErrors.push('La contraseña debe tener al menos una letra mayúscula.');
            }
            if (!/[a-z]/.test(user.password)) {
                passwordErrors.push('La contraseña debe tener al menos una letra minúscula.');
            }
            if (!/\d/.test(user.password)) {
                passwordErrors.push('La contraseña debe tener al menos un número.');
            }
        }

        if (!rol.id) {
            errors.role = 'Rol es requerido';
        }
        if (passwordErrors.length > 0) {
            errors.password = passwordErrors;

        } else {

        }
        return errors;
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setUser({
            ...user,
            [name]: value,
        })

    }
    const handleClear = () => {
        setUser(EmptyUser)
        setRol(EmptyRol)
        setErrors({})

    }

    const handleSubmit = async () => {
        const errors = validateUser(user);
        const createAt = Timestamp.now();

        // Crea un nuevo objeto user con los datos actualizados.

        let updatedUser = {
            ...user,
            businessID: userInfo.businessID,
            role: rol.id,
            createAt,
            id: nanoid(10),
        };

        if (Object.keys(errors).length === 0) {
            // Crea un nuevo usuario con los datos actualizados.
            try {
                await fbSignUp(updatedUser);
                handleClear();
                navigate('/users/list')
            } catch (error) {
                console.error(error)
                setErrors({ firebase: error.message })

                return;
            }


        } else {
            setErrors(errors);
        }

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
                    errorMessage={errors.name}
                    validate={errors.name}
                    onChange={handleInputChange}
                />
                <ElemLabel label={'Rol'}>
                    <Select
                        title="Seleccionar opción"
                        options={rolOptions}
                        optionsLabel="label"
                        value={rol}
                        maxWidth='full'
                        onChange={setRol}
                    />
                </ElemLabel>
                <InputV4
                    icon={formIcon.password}
                    label='Password'
                    value={user.password}
                    size='medium'
                    type='password'
                    placeholder='Password'
                    name='password'
                    errorMessage={errors.password}
                    validate={errors.password}
                    onChange={handleInputChange}
                />
                {/* <PasswordStrengthIndicator password={user.password} confirmPassword={user.confirmPassword} /> */}

                <ErrorComponent errors={errors.firebase}></ErrorComponent>

            </Body>
            <Footer>
                <Button
                    title={'Guardar'}
                    bgcolor={'primary'}
                    borderRadius={'light'}
                    onClick={handleSubmit}
                />
            </Footer>

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
grid-template-columns: 1fr;
gap: 1em;
min-height: 340px;
align-items: start;
align-content: start;
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