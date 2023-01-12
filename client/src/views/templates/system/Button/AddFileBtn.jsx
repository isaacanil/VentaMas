import React, { useRef } from 'react'
import styled from 'styled-components'
import { Button } from './Button'

export const AddFileBtn = ({ title, startIcon, endIcon, id, setFile, file  }) => {
    file ? title = 'Cambiar' : null
    file ? startIcon = null : null
    file ? endIcon = null : null
    return (
        <Container>
            <label htmlFor={id}>
                {startIcon ? startIcon : null}
                {title ? title : null}
                {endIcon ? endIcon : null}
                <input type="file" name=""  id={id} onChange={(e) => setFile(e.target.files[0])} accept="/imagen/*a"/>
            </label>
        </Container>
    )
}
const Container = styled.div`
    input{
        display: none;
    }
    label{
        display: flex;
        align-items: center;
        gap: 0.6em;
        border: 1px solid rgba(0, 0, 0, 0.226);
        padding: 0.2em 0.6em;
        border-radius: 8px;
        svg{
            font-size: 1.2em;
        }
    }
`
