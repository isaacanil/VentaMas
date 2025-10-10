
import styled from "styled-components";

import Typography from "../Typografy/Typografy";

import parseText from "./parseText";
import renderText from "./renderText";

const Section = ({title, rawText}) => {
    const parsedText = parseText(rawText);
    return (
        <Container >
            {title && <Typography variant="h3" >{title}</Typography>}
            {renderText(parsedText)}
        </Container>
    );
};

export default Section;

const Container = styled.section`
    margin-bottom: 2rem;
    display: grid;
    gap: 0.6rem;
  
   
`