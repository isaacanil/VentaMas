import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import React from 'react';
import styled from 'styled-components';

import Toolbar from './Toolbar/Toolbar';

const theme = {
  paragraph: 'editor-paragraph',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
  },
};

function onError(error) {
  console.error(error);
}

function MyEditor() {
  const initialConfig = {
    namespace: 'MyEditor',
    theme,
    onError,
  };

  return (
    <MainContainer>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarContainer>
          <Toolbar />
        </ToolbarContainer>
        
        <ScrollContainer>
          <EditorSheet>
            <RichTextPlugin
              contentEditable={<StyledContentEditable />}
              placeholder={<Placeholder>Empieza a escribir...</Placeholder>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
          </EditorSheet>
        </ScrollContainer>
      </LexicalComposer>
    </MainContainer>
  );
}

export default MyEditor;

// --- Styles ---

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f3f4f6; /* Light gray background like a desktop */
`;

const ToolbarContainer = styled.div`
  z-index: 10;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgb(0 0 0 / 2%);
`;

const ScrollContainer = styled.div`
  flex: 1;
  padding: 40px 20px;
  overflow-y: auto;
`;

const EditorSheet = styled.div`
  position: relative;
  width: 100%;
  max-width: 850px; /* A4 width approx */
  min-height: 1100px; /* A4 height approx */
  padding: 60px 80px;
  margin: 0 auto;
  background-color: white;
  border-radius: 2px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%), 0 1px 3px rgb(0 0 0 / 2%);
  
  /* Lexical Theme Styles injected directly via nested selectors or global class names could be used too */
  .editor-paragraph {
    margin-bottom: 1em;
  }
  .editor-text-bold {
    font-weight: bold;
  }
  .editor-text-italic {
    font-style: italic;
  }
  .editor-text-underline {
    text-decoration: underline;
  }
  .editor-text-strikethrough {
    text-decoration: line-through;
  }
`;

const StyledContentEditable = styled(ContentEditable)`
  min-height: 100%;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
  outline: none;
`;

const Placeholder = styled.div`
  position: absolute;
  top: 60px; /* Matching padding-top of EditorSheet */
  left: 80px; /* Matching padding-left of EditorSheet */
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 16px;
  color: #9ca3af;
  pointer-events: none;
  user-select: none;
`;
