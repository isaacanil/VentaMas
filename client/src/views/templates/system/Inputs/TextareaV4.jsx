import React from 'react';
import styled from 'styled-components';

const Textarea = styled.textarea`
    width: 100%;
    height: 100px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
`;

function TextareaV4(props) {
    return (
        <Textarea
            name={props.name}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
        />
    );
}

export default TextareaV4;
