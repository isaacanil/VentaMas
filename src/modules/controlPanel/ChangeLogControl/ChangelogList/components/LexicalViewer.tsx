import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { FC } from 'react';

const theme = {
  paragraph: 'editor-paragraph',
};

interface LexicalViewerProps {
  content?: string;
}

function onError(error: Error): void {
  console.error(error);
}

export const LexicalViewer: FC<LexicalViewerProps> = ({ content }) => {
  const isLexical = typeof content === 'string' && content.includes('"root":');

  if (!isLexical) {
    return (
      <div>(Contenido antiguo no compatible con el nuevo visualizador)</div>
    );
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
