import React from 'react'
import styled from 'styled-components'

export const Textarea = ({ onClick, onChange, value, placeholder }) => {
    return (
        <Container>
            <textarea
                name=""
                id=""
                cols="30"
                rows="0"
                value={value}
                onClick={onClick}
                onChange={onChange}
                placeholder={placeholder}

            ></textarea>
        </Container>
    )
}

const Container = styled.div`
    textarea{
        background-color: var(--White);
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.100);
        resize: none;
        height: 6em;
        padding: 0.5em;
        width: 100%;
        &:focus{
            outline:  1px solid rgba(0, 0, 0, 0.300);
            border: 1px solid rgba(0, 0, 0, 0.300);
        }
    ${(props) => (props.height ? `height: ${props.height};` : null)} 
    }
`