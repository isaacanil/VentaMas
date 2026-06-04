import { LexicalViewer } from '../LexicalViewer';

import { EditorWrapper } from './ChangelogListItem.styles';

interface ChangelogListItemProps {
  content?: string;
}

export const ChangelogListItem = ({ content }: ChangelogListItemProps) => (
  <EditorWrapper>
    <LexicalViewer content={content} />
  </EditorWrapper>
);
