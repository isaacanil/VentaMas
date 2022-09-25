
import styled from 'styled-components'

const Input = styled.input`
  background: #f3f3f3;
  border-radius: 100px;
  height: 1.7em;
  padding: 0 0.5em;
  //min-width: 200px;
  font-size: 18px;
  border: 1px solid rgba(0, 0, 0, 0.188);
`

export const InputText = styled(Input).attrs({
  type: 'text'

  })`
  
  &:hover{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.100);
    border: 1px solid rgba(0, 0, 0, 0.200);
  }
  &:focus{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.200);
    border: 1px solid rgba(0, 0, 0, 0.300);
   outline:  none;
  }
  ${(props)=> {
      switch(props.size){
        case 'small': 
        return`
          width: 8em;
        `
        case 'medium':
          return`
          width: 12em;`
        default: 
        return null
      }
  }}


`
export const InputPassword = styled(Input).attrs({
  type: 'password'

  })`
  background: #f3f3f3;
  border-radius: 100px;
  padding: 0.2em 0.6em;
  min-width: 200px;
  font-size: 1.1em;
  border: 1px solid rgba(0, 0, 0, 0.188);
  &:hover{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.200);
    border: 1px solid rgba(0, 0, 0, 0.300);
  }
  &:focus{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.200);
    border: 1px solid rgba(0, 0, 0, 0.300);
   outline:  none;
   
  }

`

