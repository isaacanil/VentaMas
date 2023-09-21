import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'
import { InputV4 } from '../../../../../../templates/system/Inputs/GeneralInput/InputV4'
import { nanoid } from 'nanoid'
import ElemLabel from '../../../../../../templates/system/ElemLabel/ElemLabel'
import { icons } from '../../../../../../../constants/icons/icons'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../../../../../features/auth/userSlice'
import { useNavigate } from 'react-router-dom'
import { SelectSignUpUserModal, toggleSignUpUser } from '../../../../../../../features/modals/modalSlice'
import { Button, ButtonGroup } from '../../../../../../templates/system/Button/Button'
import { DateTime } from 'luxon'
import { fbSignUp } from '../../../../../../../firebase/Auth/fbAuthV2/fbSignUp'
import { Timestamp } from 'firebase/firestore'
import { ErrorMessage } from '../../../../../../templates/ErrorMassage/ErrorMassage'
import { ErrorComponent } from '../../../../../../templates/system/ErrorComponent/ErrorComponent'
import { clear, selectUserManager, setErrors, updateUser } from '../../../../../../../features/usersManagement/usersManagementSlice'
import { ChangePassword } from './ChangePassword/ChangePassword'
import { Select } from '../../../../../../templates/system/Select/Select'
import { fbUpdateUser } from '../../../../../../../firebase/Auth/fbAuthV2/fbUpdateUser'

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
const getRol = (id) => {
    switch (id) {
        case 'admin':
            return 'Administrador'
        case 'manager':
            return 'Gerente'
        case 'cashier':
            return 'Cajero'
        case 'buyer':
            return 'Comprador'
        default:
            return ''
    }
}
const EditUser = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isOpenChangePassword, setIsOpenChangePassword] = useState(false)
    const { user, errors } = useSelector(selectUserManager)
    const userInfo = useSelector(selectUser);

    const handleIsOpenChangePassWord = () => {
        setIsOpenChangePassword(!isOpenChangePassword)
    }

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

        if (!user.role) {
            errors.role = 'Rol es requerido';
        }
        if (passwordErrors.length > 0) {
            errors.password = passwordErrors;

        } else {

        }
        return errors;
    };

    const handleInputChange = (value) => {
        dispatch(updateUser(value))
    }

    const handleClear = () => {
        dispatch(clear())
        setErrors({})
    }
    console.log('user', user)
    const handleSubmit = async () => {
        const errors = validateUser(user);

        // Crea un nuevo objeto user con los datos actualizados

        if (Object.keys(errors).length === 0) {
            // Crea un nuevo usuario con los datos actualizados.
            try {
                await fbUpdateUser(user.id, user);
                handleClear();
                navigate('/users/list');
            } catch (error) {
                console.error(error)
                setErrors({ firebase: error.message })
                return;
            }
        } else {
            setErrors(errors);
        }
    }
    const role = getRol(user.role)
    return (
        <Fragment>
            <Container>
                <Header>
                    <h3>Actualizando <a href="mailto:"></a> {user.name}</h3>
                </Header>
                <Body>
                    <InputV4
                        icon={formIcon.user}
                        value={user.name.toLowerCase()}
                        label='Nombre de Usuario'
                        type='text'
                        placeholder='Nombre de Usuario'
                        errorMessage={errors.name}
                        validate={errors.name}
                        onChange={(e) => handleInputChange({ ["name"]: e.target.value })}
                    />
                    <Select
                        title="Rol"
                        data={rolOptions}
                        optionsLabel="label"
                        displayKey={'label'}
                        value={role}
                        maxWidth='full'

                        onChange={(e) => handleInputChange({ ["role"]: e.target.value?.id })}
                    />
                    <ElemLabel
                        children={
                            <Button
                                tooltipDescription={user.active ? 'desactivar' : 'activar'}
                                tooltipPlacement={'top'}
                                title={!user.active ? 'activar' : 'desactivar'}
                                bgcolor={!user.active ? 'gray' : 'error'}
                                borderRadius={'light'}
                                onClick={() => handleInputChange({ ["active"]: !user.active })}
                            />
                        }
                        label={'Estado del usuario ' + (user.active ? 'activo' : 'inactivo')}
                    />
                    <ElemLabel
                        children={
                            <Button
                                title={'Cambiar Contraseña'}
                                bgcolor={'gray'}
                                borderRadius={'light'}
                                onClick={handleIsOpenChangePassWord}
                            />
                        }
                        label={'Cambiar Contraseña'}
                    />
                    {/* <InputV4
                    icon={formIcon.password}
                    label='Password'
                    value={user.password}
                    size='medium'
                    type='password'
                    placeholder='Password'
                    name='password'
                    errorMessage={errors.password}
                    validate={errors.password}
                    onChange={(e) => handleInputChange({["password"]: e.target.value})}
                /> */}
                    {/* <PasswordStrengthIndicator password={user.password} confirmPassword={user.confirmPassword} /> */}

                    <ErrorComponent errors={errors.firebase}></ErrorComponent>

                </Body>
                <Footer>
                    <ButtonGroup>

                        <Button
                            title={'Cancelar'}
                            bgcolor={'gray'}
                            borderRadius={'light'}
                            onClick={handleSubmit}
                        />
                        <Button
                            title={'Guardar'}
                            bgcolor={'primary'}
                            borderRadius={'light'}
                            onClick={handleSubmit}
                        />

                    </ButtonGroup>
                </Footer>

            </Container>
            <ChangePassword
                isOpen={isOpenChangePassword}
                setIsOpen={setIsOpenChangePassword}
                user={user}
                onClose={handleIsOpenChangePassWord}
            />
        </Fragment>

    )
}

export default EditUser
const Container = styled.div`
max-width: 600px;
`
const Header = styled.div`
h3{
    padding: 1em;
}
`
const Body = styled.div`
padding: 1.8em 1.5em;
display: grid;
grid-template-columns: 1fr;
gap: 1.8em;
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