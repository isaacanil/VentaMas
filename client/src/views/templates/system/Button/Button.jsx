
import styled from 'styled-components'



export const Button = styled.button`
  //border
  border-radius: 100px;
  border: 1px solid #00000030;
  height: 2em;
  display: flex;
  align-items: center;
  //container
  //background-color: #2a2b2b;
  background-color: ${props => props.delete ? "#d13737" : "black"};
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
 ${(props) => {
    switch (props.color) {
      case "error":
        return `
            background-color: #d34343;
            color: white;
            Justify-content: center;
            min-height: 1.8em;
            min-width: 1.8em;
            padding: 0;
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
        background-color: #409ae4;
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
  
  
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: 1em;
`

