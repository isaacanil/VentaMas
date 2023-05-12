import React, { Fragment } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MenuApp } from '../../templates/MenuApp/MenuApp'
import { InputText, Textarea } from '../../templates/system/Inputs/Input'
import { v4 } from 'uuid'

import { useSelector } from 'react-redux'
import { selectUser } from '../../../features/auth/userSlice'
import { fbAddCategory } from '../../../firebase/categories/fbAddCategory'
export const AddCategory = () => {
  
    const [catName, setCatName] = useState('')
    let Category = {
        id: v4(),
        name: catName
    }
    console.log(Category)
    
    const user = useSelector(selectUser)
    
    const handleSubmit = (e) => {
        fbAddCategory( Category, user )
        e.preventDefault()
        console.log('click')
        setCatName('')
    }

    return (
        <Form>
            <FormBody>
                <Group>
                    <label htmlFor="">Nombre:</label>
                    <InputText
                        name='name'
                        placeholder='Nombre de la Categoría'
                        onChange={(e) => setCatName(e.target.value)} 
                        value={catName}/>
                </Group>
            </FormBody>
            <FormFooter>
                <Button onClick={handleSubmit}>Guardar</Button>
            </FormFooter>
        </Form>
    )
}
const Container = styled.div`
   // background-color: rgb(200, 209, 221);
 
`


const Form = styled.div`
    background-color: rgb(218, 216, 216);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.150);
    padding: 1em;
    display: grid;
    width: 100%;
    
    gap: 1em;
    border-radius: 10px;
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
