import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
import { MdClose } from "react-icons/md"
import { useDispatch } from "react-redux"
import styled from "styled-components"

export const SearchClient = ({ name, icon, type, text, ref, size, title, label, clearInputWhen, required, focusColor, labelColor, value, onChange, fn, readOnly, onFocus }) => {
    const dispatch = useDispatch()
    const handleReset = () => {
        fn ? fn() : null
    }

    return (
        <Container ref={ref}>
            <Icon>{icon}</Icon>
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
                    <FontAwesomeIcon icon={faXmark} />
                </Button>
            </ButtonContainer>
        </Container>
    )
}
const Container = styled.div`
    //border: 2px solid black;
    border-radius: 4px;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
    align-content: center;
    gap: 0 10px;
    width: 100%;
    height: 2em;
 
    min-width: 180px;
    padding: 2px 6px ;
    background-color: white;
    position: relative;
    border: 1px solid #41414140;
   
   

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
    color: #464646;
    background-color: transparent;
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
        max-width: 100%;
        width: calc(100% - 0.2em);
    
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
    align-self: center;
`
const Icon = styled.div`
  
    height: 1.2em;
    width: 1.2em;
    display: flex;
    font-size: 16px;
    align-items: center;
    justify-content: center;
    padding: 0;
    align-self: flex-end;
    pointer-events: painted;
    border: 0;
    color: #464646;
    
`