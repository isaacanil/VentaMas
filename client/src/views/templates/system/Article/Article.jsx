import styled from "styled-components";
import Typography from "../Typografy/Typografy";
import Section from "./Section";
import PropTypes from 'prop-types';

const Article = ({ title, sections, }) => {
    return (
        <Container>
            <Typography variant="h1">{title}</Typography>
            {sections.map((section, index) => (
                <Section key={index} title={section.title} rawText={section.rawText} />
            ))}
        </Container>
    );
};

Article.propTypes = {
    title: PropTypes.string.isRequired,
    sections: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            rawText: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default Article;

const Container = styled.article`
    margin-bottom: 2rem;
    display: grid;
    gap: 0.6rem;
    padding: 1.2em;


`