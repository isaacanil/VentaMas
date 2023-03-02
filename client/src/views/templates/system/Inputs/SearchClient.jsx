import { useState } from "react"
import { MdClose } from "react-icons/md"
import { useDispatch } from "react-redux"
import styled from "styled-components"

export const SearchClient = ({ name, type, text, ref, size, title, label, clearInputWhen, required, focusColor, labelColor, value, onChange, fn, readOnly, onFocus }) => {
   const dispatch = useDispatch()
    const handleReset = () => {
         fn ? fn() : null
    }
    
    return (
        <Container ref={ref}>
            <InputContainer>
                <input
                    name={name}
                    type={type}
                    value={clearInputWhen ? undefined : title}
                    required={required}
                    onChange={onChange}
                    readOnly={readOnly}
                    onFocus={onFocus}
                    autocomplete="off"
                />
                <label htmlFor="">{label}</label>
            </InputContainer>
            <ButtonContainer>
                <Button onClick={handleReset}>
                    <MdClose />
                </Button>
            </ButtonContainer>
        </Container>
    )
}
const Container = styled.div`
    //border: 2px solid black;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0 10px;
    width: 100%;
    max-width: 225px;
    min-width: 180px;
    padding: 0 6px 2px;
    background-color: white;
    position: relative;
    border: 1px solid #41414140;
    height: 2em;
    display: grid;
    align-items: center;

`
const Button = styled.button`
    height: 1.2em;
    width: 1.2em;
    display: flex;
    font-size: 17px;
    align-items: center;
    justify-content: center;
    padding: 0;
    pointer-events: painted;
    border: 0;
    z-index: 1000000;
    cursor: pointer;
    
`
const InputContainer = styled.div`
display: grid;
    label{
        height: min-content;
        max-height: min-content;
        min-height: min-content;
        line-height: 10px;
        font-size: 11px;
        margin: 0;
        padding: 0;
        position: absolute;
        top: -8px;
        left: 0;
        pointer-events: none;
        background-color: var(--color2);
        font-weight: 600;
        color: #202020;
        padding: 2px 4px;
        border-radius: 2px;
    }
    input{
        border: 0;
        outline: 0;
        width: calc(100% - 2.2em);
        position: absolute;
        bottom: 4px;
        font-size: 16px;
        padding: 0;
        background-color: transparent;
      
        :focus{
            outline: 0;
        }
    }
`
const ButtonContainer = styled.div`
    justify-self: end;
`