
import styled from 'styled-components'

export const Button = ({type, bgcolor, color, title, startIcon, endIcon, onClick, width, variant }) => {
  
    return (
      <Container 
        bgcolor={bgcolor}
        color={color}
        onClick={onClick}
        width={width}
        variant={variant}
        >
          {startIcon ? startIcon : null}
          {title}
          {endIcon ? endIcon : null}
      </Container>
    )
}

export const Container = styled.button`
  //border
  border-radius: 100px;
  border: 1px solid #00000030;
  height: 2em;
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 0.4em;
  //container
  //background-color: #2a2b2b;
 
  svg{
    font-size: 1.2em;
  }
  //padding
  padding: 0 1em;
  //contain

  /*font */
  color: black;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
 
  cursor: pointer;
  transition: border-color 0.25s;
  
  &:hover{
    background-color: #d6d6d6;
    
    color: black;
  }
  &:focus, &:focus-visible{
    outline: 4px auto -webkit-focus-ring-color;
    
  }
  ${props => {
    switch (props.type) {
      case "delete": 
      return `
        background-color: #d13737;
      ` 
      default:
        break;
    }
  }}
 ${(props) => {
    switch (props.bgcolor) {
      case "error":
        return `
            background-color: #d34343;
            color: white;
            Justify-content: center;
          
           
            &:hover{
              background-color: #b10505;
              color: white
            }
          `
      case "black":
        return `
        background-color: #020202;
            color: white;
            padding: 0;
            display: flex;
            justify-content: center;
            border-radius: 0;
            min-height: 100%;
            min-width: 2em;
            &:hover{
              background-color: #1f1f1f;
              color: white
            }
          
        `
      case "gray":
        return `
            background-color: #8d8d8d;
            color: white;
            
           
           
          `
      case "primary":
        return `
        background-color: #42a5f5;
        color: white;
        &:hover{
                background-color: #4589d8;
              
              color: white
            }
            `
      default:
        return `
            background-color: white;
          `
    }
  }}
  
  ${(props) => {
    switch (props.width) {
      case "100":
        return `
           width: 100%;
          `;
      case "auto":
        return `
              width: auto;
            `
      case "icon32":
        return`
          min-width: 32px;
          max-width: 32px;
          min-height: 32px;
          max-height: 32px;
          display: grid;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          font-size: 18px;
        `
        case "icon24":
        return`
          min-width: 24px;
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        `
      default:
        return `
            width: auto;
          `
    }
  }}
   ${(props) => {
    switch (props.height) {
      case "small":
        return `
           height: 1.6em;

          `;
      case "auto":
        return `
              width: auto;
            `
      default:
        return `
            width: auto;
          `
    }
  }}
   ${(props) => {
    switch (props.variant) {
      case "contained":
        return `
           outline: none;
            border: none;

          `;
      case "auto":
        return `
              width: auto;
            `
      default:
        return `
            width: auto;
          `
    }
  }}
   ${(props) => {
    switch (props.color) {
      case "gray-dark":
        return `
           color: #4b4b4b;

          `;
      case "auto":
        return `
              width: auto;
            `
      default:
        return `
            width: auto;
          `
    }
  }}
  
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: 1em;
`

