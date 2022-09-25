import styled from "styled-components";

export const Grid = styled('div')`
    position: relative;
    display: grid; 
    
    gap: 0.50em;
  

    ${(props) => {
        switch (props.columns) {
            case "1":
                return`
                grid-template-columns:  1fr;
                `;
            case "2":
                return `
            grid-template-columns: repeat(2, 1fr);

          `;
            case "3":
                return `
            grid-template-columns: repeat(3, 1fr);
            `
            case "4":
                return `
            grid-template-columns: repeat(4, 1fr);
            width: 100%;
            @media (max-width: 980px) {
                grid-template-columns: repeat(3, 1fr)
            }
            @media (max-width: 700px) {
                grid-template-columns: repeat(2, 1fr)
            }
            @media (max-width: 400px) {
                grid-template-columns: repeat(1, 1fr)
            }

            
            `

            default:
                return `
            
          `
        }
    }}

`