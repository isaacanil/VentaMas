// Toolbar.js
import React from 'react';
import { RichUtils, convertToRaw } from 'draft-js';
import styled from 'styled-components';
import { fbAddChangelog } from '../../../../../firebase/AppUpdate/fbAddAppUpdate';
import { useNavigate } from 'react-router-dom';
import { icons } from '../../../../../constants/icons/icons';
import { DropdownMenu } from '../../DropdownMenu/DropdowMenu';

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
    const headingList = [
        {
            text: 'H1',
            action: () => toggleBlockType('header-one'),
            isActive: isBlockTypeActive('header-one')
        },
        {
            text: 'H2',
            action: () => toggleBlockType('header-two'),
            isActive: isBlockTypeActive('header-two')
        },
        {
            text: 'H3',
            action: () => toggleBlockType('header-three'),
            isActive: isBlockTypeActive('header-three')
        },
        {
            text: 'H4',
            action: () => toggleBlockType('header-four'),
            isActive: isBlockTypeActive('header-four')
        },
        {
            text: 'H5',
            action: () => toggleBlockType('header-five'),
            isActive: isBlockTypeActive('header-five')
        },
        {
            text: 'H6',
            action: () => toggleBlockType('header-six'),
            isActive: isBlockTypeActive('header-six')
        }
    ]

    return (
        <ToolbarWrapper>
            <StyledButton
                onClick={() => handleClose(editorState)}
            >
                {icons.arrows.replyAll}
                Salir
            </StyledButton>
            <StyledButton
                onClick={() => handleSubmit(editorState)}
            >
                {icons.editingActions.save}
                Guardar
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('STRIKETHROUGH')}
                isActive={isInlineStyleActive('STRIKETHROUGH')}
                size="small"
            >
                {icons.fontStyles.strikeThrough}Tachado
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('BOLD')}
                isActive={isInlineStyleActive('BOLD')}
                size="small"
            >
                {icons.fontStyles.bold} Negrita
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('ITALIC')}
                isActive={isInlineStyleActive('ITALIC')}
                size="small"
            >
                {icons.fontStyles.italic}
                Cursiva
            </StyledButton>
            <StyledButton
                onClick={() => toggleInlineStyle('UNDERLINE')}
                isActive={isInlineStyleActive('UNDERLINE')}
                size="small"

            >
                {icons.fontStyles.underline}
                Subrayado
            </StyledButton>
            <DropdownMenu
                options={headingList}
                customButton={
                    <StyledButton
                        size="small"
                    >
                        {icons.fontStyles.heading}
                        Títulos
                    </StyledButton>
                }
            />
            <div>
                <StyledButton
                    onClick={() => toggleBlockType('unordered-list-item')}
                    isActive={isBlockTypeActive('unordered-list-item')}
                    size="small"
                >
                    {icons.fontStyles.ul}

                </StyledButton>
                <StyledButton
                    onClick={() => toggleBlockType('ordered-list-item')}
                    isActive={isBlockTypeActive('ordered-list-item')}
                    size="small"
                >
                    {icons.fontStyles.ol}

                </StyledButton>
            </div>

            <StyledButton
                onClick={() => toggleBlockType('blockquote')}
                isActive={isBlockTypeActive('blockquote')}
                size="small"
            >
                {icons.fontStyles.quoteLeft}
                Cita
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
                size="small"
            >
                {icons.fontStyles.paragraph}
                Párrafo
            </StyledButton>
           
        </ToolbarWrapper>
    );
};

export default Toolbar;

const ToolbarWrapper = styled.div`
    display: flex;
    gap: 10px;
    background-color: #f5f5f5;
    padding: 2px 12px;
    height: 3em;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StyledButton = styled.button`
   display: grid;
    border: 1px solid #ccc;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: ${props => {

        switch (props.size) {
            case 'small':
                return '12px';
            case 'medium':
                return '16px';
            case 'large':
                return '18px';
            default:
                return '16px';
        }

    }};
    svg{
        font-size: 16px;
    }

    background-color: ${props => props.isActive ? '#007BFF' : 'transparent'};
    color: ${props => props.isActive ? 'white' : 'black'};

    &:hover {
        background-color: ${props => props.isActive ? '#0056b3' : '#e0e0e0'};
    }

    &:active {
        background-color: #d0d0d0;
    }
`;