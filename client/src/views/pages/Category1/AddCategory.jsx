import React, { Fragment } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { InputText, Textarea } from '../../templates/system/Inputs/Input'
import { v4 } from 'uuid'

import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { fbAddCategory } from '../../../firebase/categories/fbAddCategory'
import { addNotification } from '../../../features/notification/NotificationSlice'
import { InputV4 } from '../../templates/system/Inputs/InputV4'
export const AddCategory = () => {

    const [catName, setCatName] = useState('')
    const [error, setError] = useState({})
    let Category = {
        id: v4(),
        name: catName
    }
    console.log(Category)
    const dispatch = useDispatch()
    const user = useSelector(selectUser)
    const validate = () => {
        let errors = {}
        if (catName === '') {
            errors.catName = 'El nombre de la categoría no puede estar vacío'
        }
        return errors
    }
    const handleSubmit = (e) => {
        const errors = validate()
        if (Object.keys(errors).length > 0) {
            dispatch(addNotification({
                message: 'El nombre de la categoría no puede estar vacío',
                type: 'error',
                visible: true
            }))
            return
        } else {
            setError(errors)
        }
        fbAddCategory(Category, user)
        e.preventDefault()
        console.log('click')
        setCatName('')
    }

    return (
        <Form>
            <FormBody>
                <Group>
                    <label htmlFor="">Nombre:</label>
                    <InputV4
                        name='name'
                        placeholder='Nombre de la Categoría'
                        onChange={(e) => setCatName(e.target.value)}
                        value={catName}
                        error={error.catName}
                    />
                </Group>
            </FormBody>
            <FormFooter>
                <Button onClick={handleSubmit}>Guardar</Button>
            </FormFooter>
        </Form>
    )
}

const Form = styled.div`
    background-color: rgb(218, 216, 216);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.150);
    padding: 1em;
    display: grid;
    width: 100%;
    
    gap: 1em;
    border-radius: var(--border-radius);
`

const FormBody = styled.form`
    display: grid;
    gap: 0.8em;
`
const FormFooter = styled.footer`
    display: grid;
    justify-items: right;
`

const Button = styled.button`
    display: flex;
    height: 1.8em;
    align-items: center;
    background-color: rgb(66,165,245);
    gap: 0.4em;
    color: #e6e6e6;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 100px;
    padding: 0 0.6em;
    font-weight: 650;
    svg{
        width: 1em;
        fill: #313131;
    }
    span{
        font-weight: 500;
    }


`
const Group = styled.div`
    display: grid;
    gap: 0.4em;
    grid-template-columns: 1fr;
    background-color: rgb(230, 230, 230);
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    padding: 0.4em 0.6em;
    label{
        color: #646464;
        font-weight: 600;
    }

`
