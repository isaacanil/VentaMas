import { faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { App as AntApp, Input, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAiChat } from './hooks/useAiChat';
import AssistantSettingsModal from './components/AssistantSettingsModal';
import {
  AppContainer,
  BadgeText,
  BrandName,
  ChatColumn,
  ContentWrapper,
  EnvironmentBadge,
  Header,
  HeaderBadges,
  HeaderHomeButton,
  HeaderLeading,
  HeaderTitle,
  ModalContentStack,
  ScrollableChatContent,
  Workspace,
} from './AiBusinessSeeding.styles';
import ChatInput from './components/ChatInput';
import ConversationTurnView from './ConversationTurn';
import EmptyState from './components/EmptyState';
import {
  getAiBusinessSeedingExecutionSessionToken,
  getAiBusinessSeedingTargetSession,
  hasActiveAiBusinessSeedingTargetAuthSession,
  loginAiBusinessSeedingTarget,
} from './api/aiBusinessSeedingTargetSession';
import {
  getAiBusinessSeedingEnvironmentById,
  getCurrentAiBusinessSeedingEnvironment,
} from './utils/environment';
import {
  getStoredAiBusinessSeedingTargetEnvironmentId,
  storeAiBusinessSeedingTargetEnvironmentId,
} from './utils/targetEnvironmentPreference';

import type { ConversationTurn } from './types';
import type { AiBusinessSeedingEnvironmentId } from './utils/environment';

const { Text } = Typography;

const AiBusinessSeeding: React.FC = () => {
  const navigate = useNavigate();
  const { message: messageApi } = AntApp.useApp();
  const currentEnvironment = getCurrentAiBusinessSeedingEnvironment();
  const [targetEnvironmentId, setTargetEnvironmentId] =
    useState<AiBusinessSeedingEnvironmentId>(() =>
      getStoredAiBusinessSeedingTargetEnvironmentId(currentEnvironment.id),
    );
  const targetEnvironment =
    getAiBusinessSeedingEnvironmentById(targetEnvironmentId);
  const [, setTargetSessionVersion] = useState(0);
  const [targetLoginOpen, setTargetLoginOpen] = useState(false);
  const [targetLoginEnvironmentId, setTargetLoginEnvironmentId] =
    useState<AiBusinessSeedingEnvironmentId>('production');
  const [targetLoginUsername, setTargetLoginUsername] = useState('');
  const [targetLoginPassword, setTargetLoginPassword] = useState('');
  const [targetLoginLoading, setTargetLoginLoading] = useState(false);
  const [productionConfirmOpen, setProductionConfirmOpen] = useState(false);
  const [productionConfirmText, setProductionConfirmText] = useState('');
  const [assistantSettingsOpen, setAssistantSettingsOpen] = useState(false);

  const productionTargetSession =
    getAiBusinessSeedingTargetSession('production');
  const isProductionTargetConnected = Boolean(productionTargetSession);
  const productionTargetLabel =
    productionTargetSession?.displayName || productionTargetSession?.username;

  const {
    actions,
    prompt,
    setPrompt,
    loading,
    activeAction,
    actionData,
    logs,
    lastUserMessage,
    historyTurns,
    lastRecoverableError,
    isTestMode,
    setIsTestMode,
    enabledActions,
    executionSuccess,
    agentPhase,
    contentEndRef,
    handleToggleAction,
    handleCheckStatus,
    handleClear,
    handleApplyRecoverableSuggestion,
    handleAnalyze,
    handleExecute,
  } = useAiChat();

  const handleOpenTargetLogin = (
    environmentId: AiBusinessSeedingEnvironmentId,
  ) => {
    if (environmentId === currentEnvironment.id) {
      messageApi.info(`${currentEnvironment.label} ya usa la sesion actual.`);
      return;
    }

    setTargetLoginEnvironmentId(environmentId);
    setTargetLoginPassword('');
    setTargetLoginOpen(true);
  };

  const setPersistentTargetEnvironmentId = (
    environmentId: AiBusinessSeedingEnvironmentId,
  ) => {
    setTargetEnvironmentId(environmentId);
    storeAiBusinessSeedingTargetEnvironmentId(environmentId);
  };

  const handleSubmitTargetLogin = async () => {
    const username = targetLoginUsername.trim();
    if (!username || !targetLoginPassword) {
      messageApi.warning('Usuario y contrasena requeridos.');
      return;
    }

    setTargetLoginLoading(true);
    try {
      const session = await loginAiBusinessSeedingTarget({
        environmentId: targetLoginEnvironmentId,
        username,
        password: targetLoginPassword,
      });
      setTargetSessionVersion((version) => version + 1);
      setPersistentTargetEnvironmentId(targetLoginEnvironmentId);
      setTargetLoginOpen(false);
      setTargetLoginPassword('');
      messageApi.success(
        `Conectado a ${
          getAiBusinessSeedingEnvironmentById(targetLoginEnvironmentId).label
        } como ${session.displayName || session.username || username}.`,
      );
    } catch (error) {
      console.error(error);
      messageApi.error(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar el destino.',
      );
    } finally {
      setTargetLoginLoading(false);
    }
  };

  const executeAgainstSelectedTarget = async () => {
    const sessionToken = getAiBusinessSeedingExecutionSessionToken(
      targetEnvironment.id,
    );

    await handleExecute({
      targetEnvironmentId: targetEnvironment.id,
      targetLabel: targetEnvironment.label,
      sessionToken,
    });
  };

  const handleExecuteWithTarget = async () => {
    if (targetEnvironment.id === 'production') {
      const session = getAiBusinessSeedingTargetSession(targetEnvironment.id);
      const hasTargetSession =
        await hasActiveAiBusinessSeedingTargetAuthSession(
          targetEnvironment.id,
          session,
        );

      if (!hasTargetSession) {
        messageApi.warning(
          'Conecta una sesion de produccion antes de ejecutar en produccion.',
        );
        handleOpenTargetLogin(targetEnvironment.id);
        return;
      }

      if (!isTestMode) {
        setProductionConfirmText('');
        setProductionConfirmOpen(true);
        return;
      }
    }

    await executeAgainstSelectedTarget();
  };

  const handleConfirmProductionExecute = async () => {
    if (productionConfirmText.trim() !== 'PRODUCCION') return;
    setProductionConfirmOpen(false);
    setProductionConfirmText('');
    await executeAgainstSelectedTarget();
  };

  const handleSelectTargetEnvironment = (
    environmentId: AiBusinessSeedingEnvironmentId,
  ) => {
    if (environmentId === targetEnvironment.id) return;

    const nextEnvironment = getAiBusinessSeedingEnvironmentById(environmentId);
    if (nextEnvironment.id === 'production') {
      Modal.confirm({
        title: 'Usar produccion como destino',
        content:
          'La pantalla seguira en staging, pero la ejecucion de creacion llamara las Cloud Functions de produccion. Manten modo prueba hasta validar el borrador.',
        okText: 'Usar produccion',
        cancelText: 'Cancelar',
        okButtonProps: { danger: true },
        onOk: () => {
          setPersistentTargetEnvironmentId(nextEnvironment.id);
          setIsTestMode(true);
          if (!getAiBusinessSeedingTargetSession(nextEnvironment.id)) {
            handleOpenTargetLogin(nextEnvironment.id);
          }
        },
      });
      return;
    }

    setPersistentTargetEnvironmentId(nextEnvironment.id);
  };

  const handleToggleProductionTargetFromSettings = (isEnabled: boolean) => {
    const nextEnvironmentId: AiBusinessSeedingEnvironmentId = isEnabled
      ? 'production'
      : currentEnvironment.id;

    if (nextEnvironmentId === targetEnvironment.id) return;

    if (isEnabled) {
      setAssistantSettingsOpen(false);
    }

    handleSelectTargetEnvironment(nextEnvironmentId);
  };

  const handleConnectProductionFromSettings = () => {
    setAssistantSettingsOpen(false);
    handleOpenTargetLogin('production');
  };

  const handleCheckStatusFromSettings = () => {
    setAssistantSettingsOpen(false);
    handleCheckStatus();
  };

  const hasConversation =
    historyTurns.length > 0 ||
    Boolean(lastUserMessage) ||
    logs.length > 0 ||
    Boolean(activeAction);

  const currentTurn: ConversationTurn | null =
    Boolean(lastUserMessage) || logs.length > 0 || Boolean(activeAction)
      ? {
          id: 'current-turn',
          userMessage: lastUserMessage,
          logs,
          actionId: activeAction,
          actionData,
          executionSuccess,
          isTestMode,
          recoverableError: lastRecoverableError,
        }
      : null;

  return (
    <AppContainer>
      <Header>
        <HeaderLeading>
          <HeaderHomeButton
            aria-label="Volver a inicio"
            isIconOnly
            size="sm"
            variant="tertiary"
            onPress={() => navigate('/home')}
          >
            <FontAwesomeIcon icon={faHome} />
          </HeaderHomeButton>
        </HeaderLeading>
        <HeaderTitle>
          <BrandName>Ventamax</BrandName>
        </HeaderTitle>
        <HeaderBadges>
          <EnvironmentBadge $tone={targetEnvironment.tone}>
            <BadgeText>Destino</BadgeText>
            {targetEnvironment.label}
          </EnvironmentBadge>
        </HeaderBadges>
      </Header>

      <Workspace>
        <ChatColumn>
          <ScrollableChatContent>
            <ContentWrapper>
              {!hasConversation && <EmptyState />}

              {hasConversation && (
                <>
                  {historyTurns.map((turn) => (
                    <ConversationTurnView
                      key={turn.id}
                      turn={turn}
                      actions={actions}
                      loading={loading}
                      agentPhase={agentPhase}
                      onApplyRecoverableSuggestion={
                        handleApplyRecoverableSuggestion
                      }
                      onAnalyze={handleAnalyze}
                      onExecute={handleExecuteWithTarget}
                      onReset={handleClear}
                    />
                  ))}
                  {currentTurn && (
                    <ConversationTurnView
                      key={currentTurn.id}
                      turn={currentTurn}
                      actions={actions}
                      loading={loading}
                      agentPhase={agentPhase}
                      isCurrentTurn
                      onApplyRecoverableSuggestion={
                        handleApplyRecoverableSuggestion
                      }
                      onAnalyze={handleAnalyze}
                      onExecute={handleExecuteWithTarget}
                      onReset={handleClear}
                    />
                  )}
                </>
              )}

              <div ref={contentEndRef} />
            </ContentWrapper>
          </ScrollableChatContent>

          <ChatInput
            prompt={prompt}
            setPrompt={setPrompt}
            loading={loading}
            isTestMode={isTestMode}
            setIsTestMode={setIsTestMode}
            actions={actions}
            enabledActions={enabledActions}
            onToggleAction={handleToggleAction}
            onAnalyze={handleAnalyze}
            onOpenSettings={() => setAssistantSettingsOpen(true)}
            onClear={handleClear}
            targetEnvironment={targetEnvironment}
            canClear={hasConversation || Boolean(prompt.trim())}
          />
        </ChatColumn>
      </Workspace>

      <AssistantSettingsModal
        isOpen={assistantSettingsOpen}
        isProductionTargetEnabled={targetEnvironment.id === 'production'}
        isProductionTargetConnected={isProductionTargetConnected}
        loading={loading}
        productionTargetLabel={productionTargetLabel}
        onCheckStatus={handleCheckStatusFromSettings}
        onConnectProduction={handleConnectProductionFromSettings}
        onOpenChange={setAssistantSettingsOpen}
        onToggleProductionTarget={handleToggleProductionTargetFromSettings}
      />

      <Modal
        title={`Conectar ${
          getAiBusinessSeedingEnvironmentById(targetLoginEnvironmentId).label
        }`}
        open={targetLoginOpen}
        okText="Conectar"
        cancelText="Cancelar"
        confirmLoading={targetLoginLoading}
        onOk={() => void handleSubmitTargetLogin()}
        onCancel={() => {
          if (!targetLoginLoading) {
            setTargetLoginOpen(false);
            setTargetLoginPassword('');
          }
        }}
      >
        <ModalContentStack>
          <Text type="secondary">
            Esta sesion se guarda aparte para el asistente y no reemplaza tu
            sesion principal de staging.
          </Text>
          <Input
            autoFocus
            placeholder="Usuario de produccion"
            value={targetLoginUsername}
            onChange={(event) => setTargetLoginUsername(event.target.value)}
            onPressEnter={() => void handleSubmitTargetLogin()}
          />
          <Input.Password
            placeholder="Contrasena"
            value={targetLoginPassword}
            onChange={(event) => setTargetLoginPassword(event.target.value)}
            onPressEnter={() => void handleSubmitTargetLogin()}
          />
        </ModalContentStack>
      </Modal>

      <Modal
        title="Confirmar ejecucion en produccion"
        open={productionConfirmOpen}
        okText="Crear en produccion"
        cancelText="Cancelar"
        okButtonProps={{
          danger: true,
          disabled: productionConfirmText.trim() !== 'PRODUCCION',
        }}
        onOk={() => void handleConfirmProductionExecute()}
        onCancel={() => {
          setProductionConfirmOpen(false);
          setProductionConfirmText('');
        }}
      >
        <ModalContentStack>
          <Text type="danger">
            Esta accion creara datos reales en produccion. Verifica el preview,
            el usuario owner y los correos antes de continuar.
          </Text>
          <Text type="secondary">Escribe PRODUCCION para confirmar.</Text>
          <Input
            value={productionConfirmText}
            onChange={(event) => setProductionConfirmText(event.target.value)}
            onPressEnter={() => void handleConfirmProductionExecute()}
          />
        </ModalContentStack>
      </Modal>
    </AppContainer>
  );
};

export default AiBusinessSeeding;
