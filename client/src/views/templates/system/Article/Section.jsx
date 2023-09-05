
import styled from "styled-components";
import parseText from "./parseText";
import renderText from "./renderText";
import Typography from "../Typografy/Typografy";

const Section = ({ title, rawText }) => {
    const parsedText = parseText(rawText);
    return (
        <Container >
            <Typography variant="h3" >{title}</Typography>
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