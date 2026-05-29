import {
  faCheck,
  faEllipsisV,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, Input, Switch, Tag, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { ActionDefinition } from '../types';
import type {
  AiBusinessSeedingEnvironment,
  AiBusinessSeedingEnvironmentId,
} from '../utils/environment';
import type { MenuProps } from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

const BottomBar = styled.div`
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  gap: 2rem;
  z-index: 8;
`;

const InputContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 12px;
  max-width: 800px;
`;

interface InputWrapperProps {
  $isTestMode: boolean;
}

const InputWrapper = styled.div<InputWrapperProps>`
  flex: 1;
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 8px;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  border: 1px solid ${(props) => (props.$isTestMode ? '#faad14' : '#d9d9d9')};
  transition: all 0.2s;

  &:focus-within {
    background: white;
    border-color: ${(props) => (props.$isTestMode ? '#faad14' : '#1890ff')};
    box-shadow: ${(props) =>
    props.$isTestMode
      ? '0 0 0 2px rgba(250, 173, 20, 0.1)'
      : '0 0 0 2px rgba(24, 144, 255, 0.1)'};
  }
`;

const StyledTextArea = styled(TextArea)`
  && {
    border: none;
    background: transparent;
    resize: none;
    box-shadow: none;
    padding: 8px 12px;
    font-size: 15px;
    line-height: 1.5;

    &:focus {
      box-shadow: none;
    }
  }
`;

const MenuRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 190px;
`;

const MenuRowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CurrentCheck = styled(FontAwesomeIcon)`
  color: #1677ff;
  font-size: 11px;
`;

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
  onClear: () => void;
  currentEnvironment: AiBusinessSeedingEnvironment;
  environmentOptions: AiBusinessSeedingEnvironment[];
  onSelectEnvironment: (environmentId: AiBusinessSeedingEnvironmentId) => void;
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
  onClear,
  currentEnvironment,
  environmentOptions,
  onSelectEnvironment,
  canClear = false,
}) => {
  const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.preventDefault();
    domEvent.stopPropagation();

    if (key === 'test-mode') {
      setIsTestMode(!isTestMode);
      return;
    }

    if (key === 'clear-chat') {
      onClear();
      return;
    }

    if (key.startsWith('environment-')) {
      onSelectEnvironment(
        key.replace(
          'environment-',
          '',
        ) as AiBusinessSeedingEnvironmentId,
      );
      return;
    }

    if (key.startsWith('action-')) {
      onToggleAction(key.replace('action-', ''));
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'header-environment',
      label: (
        <Text type="secondary" style={{ fontSize: 10, fontWeight: 'bold' }}>
          AMBIENTE
        </Text>
      ),
      disabled: true,
    },
    ...environmentOptions.map((environment) => ({
      key: `environment-${environment.id}`,
      label: (
        <MenuRow>
          <MenuRowLeft>
            <Text style={{ fontSize: 12 }}>{environment.label}</Text>
            {environment.id === currentEnvironment.id ? (
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                Actual
              </Tag>
            ) : null}
          </MenuRowLeft>
          {environment.id === currentEnvironment.id ? (
            <CurrentCheck icon={faCheck} />
          ) : null}
        </MenuRow>
      ),
    })),
    { type: 'divider' },
    {
      key: 'test-mode',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'space-between',
            minWidth: 120,
          }}
        >
          <Text style={{ fontSize: 12 }}>Modo Prueba</Text>
          <Switch
            size="small"
            checked={isTestMode}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'clear-chat',
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 150,
          }}
        >
          <Text style={{ fontSize: 12, color: '#ff4d4f' }}>
            Limpiar conversación
          </Text>
        </div>
      ),
      disabled: !canClear,
    },
    { type: 'divider' },
    {
      key: 'header-skills',
      label: (
        <Text type="secondary" style={{ fontSize: 10, fontWeight: 'bold' }}>
          HABILIDADES
        </Text>
      ),
      disabled: true,
    },
    ...Object.values(actions).map((action) => ({
      key: `action-${action.id}`,
      label: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'space-between',
            minWidth: 150,
            cursor: 'pointer',
          }}
        >
          <Text style={{ fontSize: 12 }}>{action.name}</Text>
          <Switch
            size="small"
            checked={enabledActions.includes(action.id)}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      ),
    })),
  ];

  return (
    <BottomBar>
      <InputContainer>
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          trigger={['click']}
          placement="topLeft"
        >
          <Button
            type="text"
            size="large"
            icon={<FontAwesomeIcon icon={faEllipsisV} />}
            style={{ color: '#999', marginBottom: '4px' }}
            title="Más opciones"
          />
        </Dropdown>
        <InputWrapper $isTestMode={isTestMode}>
          <StyledTextArea
            placeholder="Escribe tu solicitud..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey && prompt) {
                e.preventDefault();
                onAnalyze();
              }
            }}
          />
        </InputWrapper>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<FontAwesomeIcon icon={faPaperPlane} />}
          onClick={() => onAnalyze()}
          loading={loading}
          disabled={!prompt}
          style={{
            marginBottom: '4px',
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          }}
        />
      </InputContainer>
    </BottomBar>
  );
};

export default ChatInput;
