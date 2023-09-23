import React, { useState } from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';
import Toolbar from './Toolbar/Toolbar';
import styled from 'styled-components';

function MyEditor() {
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const handleClearEditorState = () => setEditorState(() => EditorState.createEmpty());
    
    return (
        <Container>
            <Toolbar onClear={handleClearEditorState} editorState={editorState} setEditorState={setEditorState} />
            <EditorContainer>
                <EditorWrapper>
                    <Editor editorState={editorState} onChange={setEditorState} />
                </EditorWrapper>
            </EditorContainer>
        </Container>
    );
}

export default MyEditor;

const Container = styled.div`

    width: 100%;
   
`;
const EditorContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    padding: 1em;
    align-items: center;
    justify-content: center;
    gap: 20px;
`
const EditorWrapper = styled.div`
    width: 100%;
    max-width: 600px;
    height: 100%;
    min-height: 200px;
    display: grid;
    background-color: #fff;
    border-radius: 4px;
    padding: 2em;
    box-shadow: 0 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;

`