import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { fbAddChangelog } from '@/firebase/AppUpdate/fbAddAppUpdate';

const Toolbar = () => {
  const [editor] = useLexicalComposerContext();
  const navigate = useNavigate();

  const handleSave = () => {
    editor.update(() => {
      const json = editor.getEditorState().toJSON();
      const jsonString = JSON.stringify(json);
      fbAddChangelog(jsonString);
    });
  };

  const handleClose = () => {
    navigate('/home');
  };

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  return (
    <ToolbarWrapper>
      <ButtonGroup>
        <StyledButton onClick={handleClose} title="Salir">
          {icons.arrows.replyAll}
          <span>Salir</span>
        </StyledButton>
        <PrimaryButton onClick={handleSave} title="Guardar cambios">
          {icons.editingActions.save}
          <span>Guardar</span>
        </PrimaryButton>
      </ButtonGroup>

      <Divider />

      <ButtonGroup>
        <IconButton onClick={() => formatText('bold')} title="Negrita">
          {icons.fontStyles.bold}
        </IconButton>
        <IconButton onClick={() => formatText('italic')} title="Cursiva">
          {icons.fontStyles.italic}
        </IconButton>
        <IconButton onClick={() => formatText('underline')} title="Subrayado">
          {icons.fontStyles.underline}
        </IconButton>
        <IconButton onClick={() => formatText('strikethrough')} title="Tachado">
          {icons.fontStyles.strikeThrough}
        </IconButton>
      </ButtonGroup>
    </ToolbarWrapper>
  );
};

export default Toolbar;

const ToolbarWrapper = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  height: 100%;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
`;

const StyledButton = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: all 0.2s ease;

  svg {
    font-size: 14px;
  }

  &:hover {
    color: #111827;
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const PrimaryButton = styled(StyledButton)`
  color: white;
  background-color: #2563eb;
  border: 1px solid #2563eb;

  &:hover {
    color: white;
    background-color: #1d4ed8;
    border-color: #1d4ed8;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #4b5563;
  cursor: pointer;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;

  svg {
    font-size: 16px;
  }

  &:hover {
    color: #111827;
    background-color: #f3f4f6;
  }

  &:active {
    background-color: #e5e7eb;
  }
`;