import { motion } from "framer-motion";
import styled from "styled-components";

export const Grid = styled(motion.ul)`
    position: relative;
    display: grid; 
    padding: 0;
    gap: 0.7em;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));

    ${(props) => {
        switch (props.padding) {
            case 'bottom':
                return `
                    padding-bottom: 2.75em;
                `;
            default:
                return '';
        }
    }}

    ${(props) => {
        switch (props.isRow) {
            case true:
                return `
                    grid-template-columns: 1fr;
                    transition: all 400ms ease-in-out;
                `;
            default:
                return '';
        }
    }}
`;
