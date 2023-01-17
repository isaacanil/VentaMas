import styled from "styled-components";

export const Grid = styled('div')`
    position: relative;
    display: grid; 
    gap: 0.7em;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    transition: all 400ms ease-in-out;
    ${(props ) => {
        switch (props.padding) {
            case 'bottom':
                return`
                    padding-bottom: 2.75em;
                `
        
            default:
                break;
        }
    }}
    ${(props)=>{
        switch (props.isRow) {
            case true:
                return`
                grid-template-columns: 1fr;
                transition: all 400ms ease-in-out;
                
                `
                break;
            
            default:
                break;
        }
    }}
    
`