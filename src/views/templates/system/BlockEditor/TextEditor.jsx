import { Editor, EditorState } from 'draft-js';
import React, { useState } from 'react';
import 'draft-js/dist/Draft.css';
import styled from 'styled-components';

import Toolbar from './Toolbar/Toolbar';

function MyEditor() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(),
  );
  const handleClearEditorState = () =>
    setEditorState(() => EditorState.createEmpty());

  return (
    <Container>
      <Toolbar
        onClear={handleClearEditorState}
        editorState={editorState}
        setEditorState={setEditorState}
      />
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
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1em;
`;
const EditorWrapper = styled.div`
  display: grid;
  width: 100%;
  max-width: 600px;
  height: 100%;
  min-height: 200px;
  padding: 2em;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 0 2px 4px rgb(0 0 0 / 10%);
`;
