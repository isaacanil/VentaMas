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
            @media (max-width: 4000px) {
                grid-template-columns: repeat(6, 1fr)
            }
            @media (max-width: 2000px) {
                grid-template-columns: repeat(4, 1fr)
            }
            @media (max-width: 1400px) {
                grid-template-columns: repeat(3, 1fr)
            }
            @media (max-width: 1200px) {
                grid-template-columns: repeat(2, 1fr)
            }
            @media (max-width: 940px) {
                grid-template-columns: repeat(1, 1fr)
            }
            @media (max-width: 800px) {
                grid-template-columns: repeat(2, 1fr)
            }
            @media (max-width: 580px) {
                grid-template-columns: repeat(1, 1fr)
            }

            
            `

            default:
                return `
            
          `
        }
    }}

`