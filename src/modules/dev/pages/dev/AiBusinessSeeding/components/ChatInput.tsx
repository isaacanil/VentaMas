import {
  faComments,
  faGear,
  faEllipsisV,
  faPaperPlane,
  faStore,
  faTrash,
  faVial,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import {
  VmButton,
  VmChip,
  VmPopover,
  VmSwitch,
  VmTextArea,
} from '@/components/heroui';

import type { ActionDefinition } from '../types';
import type { AiBusinessSeedingEnvironment } from '../utils/environment';

const BottomBar = styled.div`
  z-index: 8;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0.8rem clamp(1rem, 3vw, 2rem);
  background: var(--ds-color-bg-surface, #fff);
  border-top: 1px solid var(--ds-color-border-default, #e0e0e0);
`;

const InputContainer = styled.div`
  width: min(100%, 920px);
`;

const AssistantMenuPopover = styled(VmPopover.Content)`
  z-index: 470;
  width: min(320px, calc(100vw - 32px));
  max-height: min(520px, calc(100vh - 150px));
  padding: 0;
  overflow: auto;
`;

const AssistantMenu = styled(VmPopover.Dialog)`
  display: grid;
  gap: 2px;
  padding: 6px;
  outline: none;
`;

const MenuButton = styled(VmButton)`
  && {
    height: 32px;
    min-width: 32px;
    padding: 0 10px;
    color: var(--ds-color-text-secondary, #64748b);
    border-radius: 999px;
    background: var(--ds-color-bg-subtle, #f8fafc);
  }
`;

const MenuActionButton = styled.button<{ $danger?: boolean }>`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  min-width: 230px;
  gap: 10px;
  padding: 9px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${({ $danger }) =>
    $danger
      ? 'var(--ds-color-state-danger, #dc2626)'
      : 'var(--ds-color-text-primary, #111827)'};
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:hover,
  &:focus-visible {
    background: ${({ $danger }) =>
      $danger ? 'rgb(220 38 38 / 8%)' : 'var(--ds-color-bg-subtle, #f8fafc)'};
    outline: none;
  }

  &:disabled {
    color: var(--ds-color-text-disabled, #9ca3af);
    cursor: not-allowed;
    opacity: 0.72;
  }
`;

const MenuSwitchRow = styled.div`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  min-width: 230px;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 12px;
`;

const MenuIcon = styled.span<{ $tone?: 'accent' | 'danger' | 'warning' }>`
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: ${({ $tone }) => {
    if ($tone === 'danger') return 'var(--ds-color-state-danger, #dc2626)';
    if ($tone === 'warning') return 'var(--ds-color-state-warning, #d97706)';
    return 'var(--ds-color-action-primary, #1677ff)';
  }};
  background: ${({ $tone }) => {
    if ($tone === 'danger') return 'rgb(220 38 38 / 10%)';
    if ($tone === 'warning') return 'rgb(217 119 6 / 12%)';
    return 'rgb(22 119 255 / 10%)';
  }};
  font-size: 11px;
`;

const MenuLabelStack = styled.span`
  display: grid;
  min-width: 0;
  gap: 2px;
`;

const MenuLabel = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-primary, #111827);
  font-size: var(--ds-font-size-sm, 13px);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuMeta = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-muted, #6b7280);
  font-size: 11px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuHeader = styled.span`
  display: block;
  padding: 8px 8px 4px;
  color: var(--ds-color-text-muted, #6b7280);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const MenuSwitch = styled(VmSwitch)`
  justify-self: end;
`;

const ComposerSurface = styled.div<{ $isTestMode: boolean }>`
  display: grid;
  gap: 8px;
  width: 100%;
  padding: 10px 10px 8px 14px;
  background: var(--ds-color-bg-surface, #fff);
  border: 1px solid
    ${({ $isTestMode }) =>
      $isTestMode
        ? 'var(--ds-color-state-warning, #f59e0b)'
        : 'var(--ds-color-border-default, #d9e2f2)'};
  border-radius: 22px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:focus-within {
    border-color: ${({ $isTestMode }) =>
      $isTestMode
        ? 'var(--ds-color-state-warning, #f59e0b)'
        : 'var(--ds-color-border-focus, #1890ff)'};
    box-shadow: ${({ $isTestMode }) =>
      $isTestMode
        ? '0 0 0 3px rgb(245 158 11 / 18%)'
        : '0 0 0 3px rgb(24 144 255 / 14%)'};
  }
`;

const PromptTextArea = styled(VmTextArea)`
  && {
    width: 100%;
    min-width: 0;
    min-height: 30px;
    max-height: 144px;
    padding: 4px 2px 2px;
    overflow-y: hidden;
    color: var(--ds-color-text-primary, #111827);
    font: inherit;
    font-size: 15px;
    line-height: 1.45;
    resize: none;
    background: transparent;
    border: 0;
    box-shadow: none;
    outline: none;
  }
`;

const ComposerFooter = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  gap: 10px;
`;

const ComposerControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-width: 0;
  gap: 6px;

  @media (max-width: 520px) {
    gap: 5px;
  }
`;

const StatusChip = styled(VmChip)`
  && {
    min-height: 26px;
    padding-inline: 9px;
    color: var(--ds-color-text-secondary, #475569);
    font-size: 11px;
    font-weight: 700;
  }
`;

const SendButton = styled(VmButton)`
  && {
    width: 40px;
    min-width: 40px;
    height: 40px;
    border-radius: 999px;
    box-shadow: 0 10px 22px rgb(31 111 235 / 22%);
  }
`;

const MAX_PROMPT_HEIGHT = 144;

interface ChatInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  loading: boolean;
  isTestMode: boolean;
  setIsTestMode: (value: boolean) => void;
  actions: Record<string, ActionDefinition>;
  enabledActions: string[];
  onToggleAction: (actionId: string) => void;
  onAnalyze: () => void;
  onOpenSettings: () => void;
  onClear: () => void;
  targetEnvironment: AiBusinessSeedingEnvironment;
  canClear?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  prompt,
  setPrompt,
  loading,
  isTestMode,
  setIsTestMode,
  actions,
  enabledActions,
  onToggleAction,
  onAnalyze,
  onOpenSettings,
  onClear,
  targetEnvironment,
  canClear = false,
}) => {
  const promptAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const enabledActionsCount = enabledActions.length;

  const resizePromptArea = React.useCallback(() => {
    const promptArea = promptAreaRef.current;
    if (!promptArea) return;

    promptArea.style.height = 'auto';
    const nextHeight = Math.min(promptArea.scrollHeight, MAX_PROMPT_HEIGHT);
    promptArea.style.height = `${nextHeight}px`;
    promptArea.style.overflowY =
      promptArea.scrollHeight > MAX_PROMPT_HEIGHT ? 'auto' : 'hidden';
  }, []);

  React.useLayoutEffect(() => {
    resizePromptArea();
  }, [prompt, resizePromptArea]);

  const handleSubmit = () => {
    if (!prompt.trim() || loading) return;
    onAnalyze();
  };

  const syncPromptValue = (value: string) => {
    setPrompt(value);
    requestAnimationFrame(resizePromptArea);
  };

  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    syncPromptValue(event.currentTarget.value);
  };

  const handlePromptInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    syncPromptValue(event.currentTarget.value);
  };

  return (
    <BottomBar>
      <InputContainer>
        <ComposerSurface $isTestMode={isTestMode}>
          <PromptTextArea
            ref={promptAreaRef}
            aria-label="Solicitud del asistente"
            placeholder="Escribe tu solicitud..."
            rows={1}
            value={prompt}
            onChange={handlePromptChange}
            onInput={handlePromptInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && prompt.trim()) {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />

          <ComposerFooter>
            <ComposerControls>
              <VmPopover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <MenuButton
                  aria-label="Mas opciones"
                  isIconOnly
                  onPress={() => setIsMenuOpen(!isMenuOpen)}
                  size="sm"
                  title="Mas opciones"
                  variant="tertiary"
                >
                  <FontAwesomeIcon icon={faEllipsisV} />
                </MenuButton>

                <AssistantMenuPopover placement="top start">
                  <AssistantMenu aria-label="Opciones del asistente">
                    <MenuActionButton
                      disabled={loading}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                    >
                      <MenuIcon>
                        <FontAwesomeIcon icon={faGear} />
                      </MenuIcon>
                      <MenuLabelStack>
                        <MenuLabel>Configuracion</MenuLabel>
                        <MenuMeta>Destino, conexion y diagnostico</MenuMeta>
                      </MenuLabelStack>
                    </MenuActionButton>

                    <MenuHeader>Flujo</MenuHeader>

                    <MenuSwitchRow>
                      <MenuIcon $tone="warning">
                        <FontAwesomeIcon icon={faVial} />
                      </MenuIcon>
                      <MenuLabelStack>
                        <MenuLabel>Modo Prueba</MenuLabel>
                        <MenuMeta>
                          {isTestMode ? 'Simula sin escribir' : 'Ejecuta real'}
                        </MenuMeta>
                      </MenuLabelStack>
                      <MenuSwitch
                        aria-label="Modo Prueba"
                        isSelected={isTestMode}
                        onChange={setIsTestMode}
                      />
                    </MenuSwitchRow>

                    <MenuHeader>Habilidades</MenuHeader>

                    {Object.values(actions).map((action) => (
                      <MenuSwitchRow key={action.id}>
                        <MenuIcon>
                          <FontAwesomeIcon
                            icon={action.id === 'chat' ? faComments : faStore}
                          />
                        </MenuIcon>
                        <MenuLabel>{action.name}</MenuLabel>
                        <MenuSwitch
                          aria-label={action.name}
                          isSelected={enabledActions.includes(action.id)}
                          onChange={() => onToggleAction(action.id)}
                        />
                      </MenuSwitchRow>
                    ))}

                    <MenuActionButton
                      $danger
                      disabled={!canClear}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onClear();
                      }}
                    >
                      <MenuIcon $tone="danger">
                        <FontAwesomeIcon icon={faTrash} />
                      </MenuIcon>
                      <MenuLabel>Limpiar conversacion</MenuLabel>
                    </MenuActionButton>
                  </AssistantMenu>
                </AssistantMenuPopover>
              </VmPopover>

              <StatusChip
                color={
                  targetEnvironment.id === 'production' ? 'danger' : 'accent'
                }
                variant="soft"
              >
                <VmChip.Label>Destino {targetEnvironment.label}</VmChip.Label>
              </StatusChip>

              <StatusChip color="default" variant="soft">
                <VmChip.Label>{enabledActionsCount} acciones</VmChip.Label>
              </StatusChip>

              {isTestMode ? (
                <StatusChip color="warning" variant="soft">
                  <VmChip.Label>Prueba activa</VmChip.Label>
                </StatusChip>
              ) : null}
            </ComposerControls>

            <SendButton
              aria-label="Enviar solicitud"
              isDisabled={!prompt.trim() || loading}
              isIconOnly
              isPending={loading}
              onPress={handleSubmit}
              size="md"
              variant="primary"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </SendButton>
          </ComposerFooter>
        </ComposerSurface>
      </InputContainer>
    </BottomBar>
  );
};

export default ChatInput;
