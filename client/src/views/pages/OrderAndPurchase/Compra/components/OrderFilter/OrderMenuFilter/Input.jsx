
import React, { useRef } from 'react'
import { MdClose } from 'react-icons/md'
import styled from 'styled-components'

export const Input = ({data, onChange, fn}) => {
  const ref = useRef()
  const handleDeleteText = () => {
    fn()
    ref.current.value = ''

  }
  return (
    <Container>
        <input type="text" ref={ref} onChange={onChange} placeholder={`Buscar ${data.name}`}/>
        <div onClick={handleDeleteText}>
          <MdClose/>
        </div>
    </Container>
  )
}
const Container = styled.div`
    width: 100%;
    display: flex;
    height: 2em;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    padding: 0 1em;
    border-radius: 6px;
    input{
        border: none;
        outline: none;
    }
    div{
      
      height: 1.2em;
      width: 1.2em;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--White2);
    }
`