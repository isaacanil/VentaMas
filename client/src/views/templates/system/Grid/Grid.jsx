import styled from "styled-components";

export const Grid = styled('div')`
    position: relative;
    display: grid; 
    
    gap: 0.7em;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));


`