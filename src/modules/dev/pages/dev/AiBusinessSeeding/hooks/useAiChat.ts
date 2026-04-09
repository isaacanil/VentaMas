import { useEffect, useRef, useState } from 'react';

import { message } from 'antd';

import { ACTIONS } from '../aiActions';
import { fbAiBusinessSeedingAgentAnalyze } from '../api/fbAiBusinessSeedingAgentAnalyze';
import { fbAiBusinessSeedingAgentExecute } from '../api/fbAiBusinessSeedingAgentExecute';

import type {
  ActionDefinition,
  AgentConversationContext,
  AgentRecoverableError,
  ConversationTurn,
  LogEntry,
  LogType,
} from '../types';

type AgentPhase =
  | 'idle'
  | 'analyzing'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'error';

export function useAiChat() {
  const actions: Record<string, ActionDefinition> = ACTIONS;
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionData, setActionData] = useState<unknown | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [historyTurns, setHistoryTurns] = useState<ConversationTurn[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [enabledActions, setEnabledActions] = useState<string[]>(
    Object.keys(ACTIONS),
  );
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>('idle');
  const [lastRecoverableError, setLastRecoverableError] =
    useState<AgentRecoverableError | null>(null);

  const showCanvas =
    Boolean(activeAction) && activeAction !== 'chat' && Boolean(actionData);

  const contentEndRef = useRef<HTMLDivElement | null>(null);
  const turnSequenceRef = useRef(0);

  const addLog = (msg: string, type: LogType = 'info') => {
    setLogs((prev) => [
      ...prev,
      { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type },
    ]);
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Error inesperado';
  };

  const isDeadlineExceededError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as { code?: unknown; message?: unknown };
    const code =
      typeof candidate.code === 'string'
        ? candidate.code.toLowerCase()
        : '';
    const messageText =
      typeof candidate.message === 'string'
        ? candidate.message.toLowerCase()
        : '';

    return (
      code.includes('deadline-exceeded') ||
      messageText.includes('deadline-exceeded')
    );
  };

  const cloneJsonLike = <T,>(value: T): T => {
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      return value;
    }
  };

  const parseRecoverableField = (field?: string) => {
    const match = typeof field === 'string'
      ? field.match(/^users\[(\d+)\]\.(name|email)$/)
      : null;
    if (!match) return null;

    const index = Number(match[1]);
    const key = match[2] as 'name' | 'email';
    if (!Number.isInteger(index) || index < 0) return null;

    return { index, key };
  };

  const sanitizeContextValue = (value: unknown, depth = 0): unknown => {
    if (depth > 5) return '[truncated]';
    if (
      value == null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => sanitizeContextValue(item, depth + 1));
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const next: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(obj)) {
        const normalizedKey = key.toLowerCase();
        if (normalizedKey.includes('password') || normalizedKey.includes('sessiontoken')) {
          next[key] = '[redacted]';
          continue;
        }
        next[key] = sanitizeContextValue(raw, depth + 1);
      }
      return next;
    }
    return String(value);
  };

  const buildConversationContext = (): AgentConversationContext | undefined => {
    const currentDraft =
      activeAction && actionData !== null
        ? {
            actionId: activeAction,
            actionData: sanitizeContextValue(actionData),
          }
        : null;

    const summarizedTurns = historyTurns
      .slice(-3)
      .map((turn) => ({
        userMessage: turn.userMessage,
        actionId: turn.actionId,
        executionSuccess: turn.executionSuccess,
      }));

    const currentTurnSummary =
      lastUserMessage || activeAction
        ? {
            userMessage: lastUserMessage,
            actionId: activeAction,
            executionSuccess,
          }
        : null;

    const recentTurns = currentTurnSummary
      ? [...summarizedTurns, currentTurnSummary].slice(-4)
      : summarizedTurns;

    if (!currentDraft && !lastRecoverableError && recentTurns.length === 0) {
      return undefined;
    }

    return {
      currentDraft,
      lastRecoverableError: lastRecoverableError
        ? (sanitizeContextValue(lastRecoverableError) as AgentRecoverableError)
        : null,
      recentTurns,
    };
  };

  useEffect(() => {
    if (activeAction || executionSuccess || logs.length > 0 || historyTurns.length > 0) {
      contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeAction, executionSuccess, logs.length, historyTurns.length]);

  const hasActiveConversationState =
    Boolean(lastUserMessage) || logs.length > 0 || Boolean(activeAction);

  const archiveCurrentTurn = () => {
    if (!hasActiveConversationState) return;

    turnSequenceRef.current += 1;
    const nextTurn: ConversationTurn = {
      id: `turn-${turnSequenceRef.current}`,
      userMessage: lastUserMessage,
      logs: [...logs],
      actionId: activeAction,
      actionData,
      executionSuccess,
      isTestMode,
      recoverableError: lastRecoverableError,
    };

    setHistoryTurns((prev) => [...prev, nextTurn]);
  };

  const handleToggleAction = (actionId: string) => {
    setEnabledActions((prev) =>
      prev.includes(actionId)
        ? prev.filter((id) => id !== actionId)
        : [...prev, actionId],
    );
  };

  const handleClear = () => {
    setPrompt('');
    setActiveAction(null);
    setActionData(null);
    setExecutionSuccess(false);
    setLogs([]);
    setLastUserMessage('');
    setHistoryTurns([]);
    setAgentPhase('idle');
    setLastRecoverableError(null);
  };

  const handleApplyRecoverableSuggestion = (suggestion: string) => {
    const recoverable = lastRecoverableError;
    if (!recoverable) {
      message.warning('No hay una corrección pendiente para aplicar.');
      return false;
    }

    if (!activeAction || actionData == null) {
      message.warning('No hay borrador activo para corregir.');
      return false;
    }

    const parsedField = parseRecoverableField(recoverable.field);
    if (!parsedField) {
      message.info('Esta corrección requiere IA. Usa "Corregir con IA y reintentar".');
      return false;
    }

    const normalizedSuggestion = suggestion.trim();
    if (!normalizedSuggestion) return false;

    const cloned = cloneJsonLike(actionData);
    if (!cloned || typeof cloned !== 'object' || Array.isArray(cloned)) {
      message.error('No se pudo aplicar la sugerencia al borrador actual.');
      return false;
    }

    const nextData = cloned as Record<string, unknown>;
    const users = Array.isArray(nextData.users) ? nextData.users : null;
    const targetUser = users?.[parsedField.index];
    if (!users || !targetUser || typeof targetUser !== 'object' || Array.isArray(targetUser)) {
      message.error('No se encontró el usuario a corregir en el borrador.');
      return false;
    }

    users[parsedField.index] = {
      ...(targetUser as Record<string, unknown>),
      [parsedField.key]: normalizedSuggestion,
    };

    nextData.users = users;

    setActionData(nextData);
    setExecutionSuccess(false);
    setAgentPhase('ready');
    setLastRecoverableError(null);
    setPrompt('');
    addLog(
      `Sugerencia aplicada sin IA: ${parsedField.key} -> ${normalizedSuggestion}. Revisa el preview y ejecuta nuevamente.`,
      'success',
    );
    message.success('Sugerencia aplicada al borrador.');
    return true;
  };

  const handleAnalyze = async (promptOverride?: unknown) => {
    const promptSource =
      typeof promptOverride === 'string' ? promptOverride : prompt;
    const submittedPrompt = promptSource.trim();
    if (!submittedPrompt) {
      message.error('Escribe algo primero');
      return;
    }

    const conversationContext = buildConversationContext();
    archiveCurrentTurn();
    setLoading(true);
    setAgentPhase('analyzing');
    setLastRecoverableError(null);
    setExecutionSuccess(false);
    setActiveAction(null);
    setActionData(null);
    setLogs([]);
    setLastUserMessage(submittedPrompt);
    addLog('Analizando...', 'info');

    try {
      const analyzeResponse = await fbAiBusinessSeedingAgentAnalyze({
        prompt: submittedPrompt,
        enabledActions,
        conversationContext,
      });

      if (!analyzeResponse?.ok || !analyzeResponse.action) {
        addLog('No se detectó una acción válida', 'error');
        setAgentPhase('error');
        message.error('No entendí la solicitud');
        setLoading(false);
        return;
      }

      try {
        const actionId =
          typeof analyzeResponse.action === 'string'
            ? analyzeResponse.action
            : null;
        const data = analyzeResponse.data ?? null;

        if (actionId && actions[actionId]) {
          setActiveAction(actionId);
          setActionData(data);
          setPrompt('');
          setAgentPhase('ready');
          if (actionId !== 'chat') {
            setLastRecoverableError(null);
          }
          addLog(`Acción detectada: ${actions[actionId].name}`, 'success');
        } else {
          setAgentPhase('error');
          addLog(
            `Acción desconocida: ${actionId ?? 'sin acción'}`,
            'warning',
          );
        }
      } catch (e) {
        console.error(e);
        setAgentPhase('error');
        addLog('Error parseando respuesta', 'error');
      }
    } catch (error: unknown) {
      console.error(error);
      setAgentPhase('error');
      if (isDeadlineExceededError(error)) {
        addLog(
          'La IA tardó demasiado en responder. Intenta de nuevo con una solicitud más corta o vuelve a intentar en unos segundos.',
          'warning',
        );
        message.warning('La IA tardó demasiado en responder. Intenta nuevamente.');
        return;
      }
      const msg = getErrorMessage(error).replace(/^Error:\s*/i, '');
      addLog(`Error: ${msg}`, 'error');
      message.error('Error al analizar');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!activeAction || !actionData) return;

    const action = actions[activeAction];
    if (!action) {
      addLog('Acción no ejecutable', 'warning');
      return;
    }

    setLoading(true);
    setAgentPhase('executing');
    setLastRecoverableError(null);
    addLog(`Ejecutando: ${action.name}`, 'info');

    try {
      const executionResponse = await fbAiBusinessSeedingAgentExecute({
        actionId: activeAction,
        actionData,
        isTestMode,
      });

      if (Array.isArray(executionResponse.logs)) {
        executionResponse.logs.forEach((entry) => {
          if (!entry?.msg) return;
          addLog(entry.msg, entry.type || 'info');
        });
      }

      if (executionResponse?.ok === false && executionResponse.error) {
        const recoverable = executionResponse.error;
        setActionData(
          executionResponse.data !== undefined ? executionResponse.data : actionData,
        );
        setLastRecoverableError(recoverable);
        setAgentPhase('error');
        if (!prompt.trim() && recoverable.suggestedUserPrompt) {
          setPrompt(recoverable.suggestedUserPrompt);
        }

        message.warning(
          recoverable.clarificationQuestion || recoverable.message || 'Necesito una aclaración para continuar.',
        );
        return;
      }

      if (!executionResponse?.ok) {
        throw new Error('El agente no pudo ejecutar la acción solicitada.');
      }

      setActionData(
        executionResponse.data !== undefined ? executionResponse.data : actionData,
      );
      setExecutionSuccess(true);
      setAgentPhase('completed');
      setLastRecoverableError(null);
      addLog('Finalizado', 'success');
      message.success('Listo!');
    } catch (error: unknown) {
      console.error(error);
      setAgentPhase('error');
      if (isDeadlineExceededError(error)) {
        addLog(
          'La ejecución tardó más de lo esperado. Verifica si el negocio ya se creó antes de reintentar para evitar duplicados.',
          'warning',
        );
        message.warning(
          'La ejecución tardó demasiado. Verifica si se creó el negocio antes de reintentar.',
        );
        return;
      }
      addLog(`Error: ${getErrorMessage(error).replace(/^Error:\s*/i, '')}`, 'error');
      message.error('Falló la ejecución');
    } finally {
      setLoading(false);
    }
  };

  return {
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
    showCanvas,
    contentEndRef,
    handleToggleAction,
    handleClear,
    handleApplyRecoverableSuggestion,
    handleAnalyze,
    handleExecute,
  };
}
