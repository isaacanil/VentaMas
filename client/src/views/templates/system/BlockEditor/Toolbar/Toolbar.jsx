// Toolbar.js
import React from 'react';
import { RichUtils, convertToRaw } from 'draft-js';
import styled from 'styled-components';
import { fbAddChangelog } from '../../../../../firebase/AppUpdate/fbAddAppUpdate';
import { useNavigate } from 'react-router-dom';

const Toolbar = ({ editorState, setEditorState, onClear }) => {
    const navigate = useNavigate();
    const toggleInlineStyle = (style) => {
        const newState = RichUtils.toggleInlineStyle(editorState, style);
        setEditorState(newState);
    };

    const toggleBlockType = (blockType) => {
        const newState = RichUtils.toggleBlockType(editorState, blockType);
        setEditorState(newState);
    };

    const isInlineStyleActive = (style) => {
        return editorState.getCurrentInlineStyle().has(style);
    };

    const isBlockTypeActive = (blockType) => {
        const block = RichUtils.getCurrentBlockType(editorState);
        return block === blockType;
    };

    const handleSubmit = async (editorState) => {
        try {
            const contentState = editorState.getCurrentContent();
            const rawContent = convertToRaw(contentState);
            const jsonString = JSON.stringify(rawContent);
            await fbAddChangelog(jsonString);

        } catch (error) {

        }
    }
    const handleClose = () => {
        navigate("/home")
        onClear()
    }

    return (
        <ToolbarWrapper>
            <StyledButton
                onClick={() => handleClose(editorState)}
            >
                Salir
            </StyledButton>
            <StyledButton
                onClick={() => handleSubmit(editorState)}

            >
                Guardar Información
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('STRIKETHROUGH')}
                isActive={isInlineStyleActive('STRIKETHROUGH')}
            >
                Tachado
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('BOLD')}
                isActive={isInlineStyleActive('BOLD')}
            >
                Negrita
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('ITALIC')}
                isActive={isInlineStyleActive('ITALIC')}
            >
                Cursiva
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('UNDERLINE')}
                isActive={isInlineStyleActive('UNDERLINE')}
            >
                Subrayado
            </StyledButton>
            <div>
                <StyledButton
                    onClick={() => toggleBlockType('unordered-list-item')}
                    isActive={isBlockTypeActive('unordered-list-item')}
                >
                    UL
                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('ordered-list-item')}
                    isActive={isBlockTypeActive('ordered-list-item')}
                >
                    OL
                </StyledButton>
            </div>

            <StyledButton
                onClick={() => toggleBlockType('blockquote')}
                isActive={isBlockTypeActive('blockquote')}
            >
                Cita
            </StyledButton>
            <StyledButton
                onClick={() => toggleBlockType('code-block')}
                isActive={isBlockTypeActive('code-block')}
            >
                Código
            </StyledButton>
            <StyledButton
                onClick={() => toggleBlockType('atomic')}
                isActive={isBlockTypeActive('atomic')}
            >
                Imagen
            </StyledButton>
            <StyledButton
                onClick={() => toggleBlockType('unstyled')}
                isActive={isBlockTypeActive('unstyled')}
            >
                Párrafo
            </StyledButton>
            <div>
                <StyledButton
                    onClick={() => toggleBlockType('header-one')}
                    isActive={isBlockTypeActive('header-one')}
                >
                    H1
                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('header-two')}
                    isActive={isBlockTypeActive('header-two')}
                >
                    H2
                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('header-three')}
                >
                    H3
                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('header-four')}
                    isActive={isBlockTypeActive('header-four')}
                >
                    H4
                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('header-five')}
                    isActive={isBlockTypeActive('header-five')}
                >
                    H5
                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('header-six')}
                    isActive={isBlockTypeActive('header-six')}
                >
                    H6
                </StyledButton>
            </div>
        </ToolbarWrapper>
    );
};

export default Toolbar;

const ToolbarWrapper = styled.div`
    display: flex;
    gap: 10px;
    background-color: #f5f5f5;
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StyledButton = styled.button`
   
    border: 1px solid #ccc;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

   

     background-color: ${props => props.isActive ? '#007BFF' : 'transparent'};
    color: ${props => props.isActive ? 'white' : 'black'};

    &:hover {
        background-color: ${props => props.isActive ? '#0056b3' : '#e0e0e0'};
    }

    &:active {
        background-color: #d0d0d0;
    }
`;