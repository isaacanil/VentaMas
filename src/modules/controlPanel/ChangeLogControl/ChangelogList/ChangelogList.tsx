import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import React, { Fragment } from 'react';
import styled from 'styled-components';

import { useGetChangelogs } from '@/firebase/AppUpdate/useGetChangeogs';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

const theme = {
  paragraph: 'editor-paragraph',
};

interface ChangelogEntry {
  id?: string;
  content?: string;
  createdAt?: Date;
}

interface ChangelogItem {
  changelog: ChangelogEntry;
}

interface LexicalViewerProps {
  content?: string;
}

function onError(error: Error): void {
  console.error(error);
}

const LexicalViewer: React.FC<LexicalViewerProps> = ({ content }) => {
  // Basic check to see if content is likely Lexical JSON (has "root")
  // If not, it might be old DraftJS data or invalid.
  // This is a naive check to prevent immediate crashes on old data.
  const isLexical = typeof content === 'string' && content.includes('"root":');

  if (!isLexical) {
    return <div>(Contenido antiguo no compatible con el nuevo visualizador)</div>;
  }

  const initialConfig = {
    namespace: 'ChangelogViewer',
    theme,
    onError,
    editable: false,
    editorState: content,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable readOnly />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
};

export const ChangelogList = () => {
  const { changelogs, error } = useGetChangelogs();

  if (error) {
    return (
      <Container>
        <Wrapper>
          <h1>Ventamax — Notas del lanzamiento</h1>
          <p>
            No se pudieron cargar las notas de la versión. Intenta nuevamente.
          </p>
        </Wrapper>
      </Container>
    );
  }

  return (
    <Fragment>
      <MenuApp />
      <Container>
        <Wrapper>
          <h1>Ventamax — Notas del lanzamiento</h1>
          <br />
          {(changelogs as ChangelogItem[])
            .sort((a, b) => {
              const aDate = a?.changelog?.createdAt ?? new Date(0);
              const bDate = b?.changelog?.createdAt ?? new Date(0);
              return bDate.getTime() - aDate.getTime();
            })
            .map(({ changelog }, index) => (
              <EditorWrapper key={changelog?.id ?? index}>
                <LexicalViewer content={changelog.content} />
              </EditorWrapper>
            ))}
        </Wrapper>
      </Container>
    </Fragment>
  );
};
const Container = styled.div`
  width: 100%;
  height: calc(100vh - 2.75em);
`;
const Wrapper = styled.div`
  width: 100%;
  max-width: 900px;
  padding: 1em;
  margin: 0 auto;
  overflow: auto;

  h1 {
    margin-left: 0;
  }

  h2 {
    margin-left: 0;
  }
`;
const EditorWrapper = styled.div`
  margin-bottom: 6em;

  &:last-child {
    margin-bottom: 0;
  }
`;

