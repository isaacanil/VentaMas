import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type SetStateAction,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectAppMode } from '@/features/appModes/appModeSlice';
import {
  selectUser,
  selectIsTemporaryMode,
  selectOriginalBusinessId,
  selectIsTemporaryRoleMode,
  selectOriginalRole,
} from '@/features/auth/userSlice';
import {
  toggleDeveloperModal,
  SelectDeveloperModal,
} from '@/features/modals/modalSlice';
import type { UserIdentity } from '@/types/users';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import CommandProcessor from '../components/CommandProcessor/CommandProcessor';
import type {
  AutoCompleteSelectOptions,
  AutoCompleteSuggestion,
  ConsoleCommandLine,
  ConsoleLine,
  ConsoleResultLine,
  SelectionItem,
  SelectionModeState,
} from '../types';

type KeyboardEventLike = {
  key: string;
  ctrlKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
};

const INITIAL_SELECTION_MODE: SelectionModeState = {
  active: false,
  items: [],
  selectedIndex: 0,
  onSelect: null,
  title: '',
  command: '',
};

const WELCOME_TEXT = `
VentaMax Dev Console [Versión 1.5.0]
© 2024 VentaMax Software. Todos los derechos reservados.\n
ATENCIÓN: Esta consola está destinada exclusivamente para desarrolladores.
El uso incorrecto de estos comandos puede afectar el funcionamiento del sistema.\n
Escriba HELP para ver una lista de comandos disponibles.\n
`;

export const useDeveloperModalController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const modalData = useSelector(SelectDeveloperModal);
  const user = useSelector(selectUser);
  const isTestMode = useSelector(selectAppMode);
  const isTemporaryMode = useSelector(selectIsTemporaryMode);
  const originalBusinessId = useSelector(selectOriginalBusinessId);
  const isTemporaryRoleMode = useSelector(selectIsTemporaryRoleMode);
  const originalRole = useSelector(selectOriginalRole);
  const [consoleOutput, setConsoleOutputState] = useState<ConsoleLine[]>([]);
  const [commandInput, setCommandInputState] = useState('');
  const [reactScanLoaded, setReactScanLoaded] = useState(false);
  const [businesses, setBusinesses] = useState<SelectionItem[]>([]);
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<
    AutoCompleteSuggestion[]
  >([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteSelectedIndex, setAutoCompleteSelectedIndex] =
    useState(-1);
  const [selectionMode, setSelectionMode] = useState<SelectionModeState>(
    INITIAL_SELECTION_MODE,
  );
  const [originalItems, setOriginalItems] = useState<SelectionItem[]>([]);
  const commandProcessorRef = useRef<InstanceType<typeof CommandProcessor> | null>(
    null,
  );
  const isDeveloper = hasDeveloperAccess(user as UserIdentity | null);

  const setConsoleOutput = useCallback<Dispatch<SetStateAction<ConsoleLine[]>>>(
    (value) => {
      setConsoleOutputState(value);
    },
    [],
  );

  const setCommandInput = useCallback<Dispatch<SetStateAction<string>>>(
    (value) => {
      setCommandInputState(value);
    },
    [],
  );

  const addOutput = useCallback(
    (
      content: string,
      type: ConsoleResultLine['type'] = 'result',
      html = false,
    ) => {
      const newLine: ConsoleResultLine = {
        id: Date.now() + Math.random(),
        content,
        type,
        html,
      };
      setConsoleOutputState((prev) => [...prev, newLine]);
    },
    [],
  );

  const addCommandEcho = useCallback((command: string) => {
    const commandLine: ConsoleCommandLine = {
      id: Date.now() + Math.random(),
      content: {
        prompt: 'C:\\VentaMax>',
        userCommand: command,
      },
      type: 'command',
    };
    setConsoleOutputState((prev) => [...prev, commandLine]);
  }, []);

  const enterSelectionMode = useCallback(
    (
      items: SelectionItem[],
      title: string,
      onSelect: (item: SelectionItem) => void,
      command = '',
    ) => {
      setOriginalItems(items);
      setSelectionMode({
        active: true,
        items,
        selectedIndex: 0,
        onSelect,
        title,
        command,
      });
    },
    [],
  );

  const handleFilterSelection = useCallback(
    (filterText: string) => {
      if (!selectionMode.active) return;

      if (!filterText.trim()) {
        setSelectionMode((prev) => ({
          ...prev,
          items: originalItems,
          selectedIndex: 0,
        }));
        return;
      }

      const filtered = originalItems.filter((item) => {
        const itemText =
          typeof item === 'string'
            ? item
            : (item as { name?: string; title?: string; label?: string })
                .name ||
              (item as { name?: string; title?: string; label?: string })
                .title ||
              (item as { name?: string; title?: string; label?: string })
                .label ||
              String(item);
        return itemText.toLowerCase().includes(filterText.toLowerCase());
      });

      setSelectionMode((prev) => ({
        ...prev,
        items: filtered,
        selectedIndex: 0,
      }));
    },
    [originalItems, selectionMode.active],
  );

  const updateSelectedIndex = useCallback((index: number) => {
    setSelectionMode((prev) => ({ ...prev, selectedIndex: index }));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(INITIAL_SELECTION_MODE);
    setOriginalItems([]);
    setCommandInputState('');

    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        '.console-terminal input',
      );
      input?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (!selectionMode.active) {
      window.selectItem = undefined;
      window.confirmSelection = undefined;
    }
  }, [selectionMode.active]);

  const handleSelectionConfirm = useCallback(() => {
    const { items, selectedIndex, onSelect } = selectionMode;
    const selectedItem = items[selectedIndex];

    exitSelectionMode();

    if (onSelect) {
      onSelect(selectedItem);
    }

    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        '.console-terminal input',
      );
      input?.focus();
    }, 150);
  }, [exitSelectionMode, selectionMode]);

  const updateAutoComplete = useCallback((input: string) => {
    if (!commandProcessorRef.current) return;

    const suggestions = commandProcessorRef.current.getCommandSuggestions(input);
    setAutoCompleteSuggestions(suggestions);
    setShowAutoComplete(suggestions.length > 0 && input.trim().length > 0);
    setAutoCompleteSelectedIndex(-1);
  }, []);

  const triggerCommandExecution = useCallback((command: string) => {
    const commandText = command?.trim();
    const processor = commandProcessorRef.current;
    if (!commandText || !processor) return;

    const executeCommand = async () => {
      const result = await processor.executeCommand(commandText);

      if (result && result.clearConsole) {
        setConsoleOutputState([]);
      }
    };

    void executeCommand();
  }, []);

  const handleAutoCompleteSuggestionSelect = useCallback(
    (
      suggestion: AutoCompleteSuggestion | null,
      options: AutoCompleteSelectOptions = { trigger: 'keyboard' },
    ) => {
      if (!suggestion) return;

      const command = suggestion.command || '';
      const needsAdditionalInput =
        typeof suggestion.requiresInput === 'boolean'
          ? suggestion.requiresInput
          : command.endsWith(' ');

      setShowAutoComplete(false);
      setAutoCompleteSelectedIndex(-1);
      setCommandInputState(command);

      if (options.trigger === 'click' && !needsAdditionalInput) {
        triggerCommandExecution(command);
        setCommandInputState('');
      }
    },
    [triggerCommandExecution],
  );

  const handleAutoCompleteSelectedIndexChange = useCallback((index: number) => {
    setAutoCompleteSelectedIndex(index);
  }, []);

  useEffect(() => {
    updateAutoComplete(commandInput);
  }, [commandInput, updateAutoComplete]);

  useEffect(() => {
    commandProcessorRef.current = new CommandProcessor({
      dispatch,
      navigate,
      user,
      isTestMode,
      isTemporaryMode,
      originalBusinessId,
      isTemporaryRoleMode,
      originalRole,
      addOutput,
      addCommandEcho,
      setReactScanLoaded,
      reactScanLoaded,
      setBusinesses,
      businesses,
      enterSelectionMode,
    });
  }, [
    addCommandEcho,
    addOutput,
    businesses,
    dispatch,
    enterSelectionMode,
    isTemporaryMode,
    isTemporaryRoleMode,
    isTestMode,
    navigate,
    originalBusinessId,
    originalRole,
    reactScanLoaded,
    user,
  ]);

  useEffect(() => {
    if (modalData.isOpen && !isDeveloper) {
      dispatch(toggleDeveloperModal(undefined));
    }
  }, [dispatch, isDeveloper, modalData.isOpen]);

  const handleKeyDownInternal = useCallback(
    (event: KeyboardEventLike) => {
      if (selectionMode.active) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          exitSelectionMode();
          addOutput('Selección cancelada.');
        }
        return;
      }

      if (showAutoComplete && autoCompleteSuggestions.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const newIndex =
            autoCompleteSelectedIndex < autoCompleteSuggestions.length - 1
              ? autoCompleteSelectedIndex + 1
              : 0;
          setAutoCompleteSelectedIndex(newIndex);
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const newIndex =
            autoCompleteSelectedIndex > 0
              ? autoCompleteSelectedIndex - 1
              : autoCompleteSuggestions.length - 1;
          setAutoCompleteSelectedIndex(newIndex);
          return;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          let targetIndex = autoCompleteSelectedIndex;
          if (targetIndex < 0) {
            const searchText = commandInput.trim().toLowerCase();
            if (searchText) {
              const matchIndex = autoCompleteSuggestions.findIndex(
                (suggestion) =>
                  suggestion.command?.toLowerCase().startsWith(searchText),
              );
              if (matchIndex >= 0) {
                targetIndex = matchIndex;
              }
            }
            if (targetIndex < 0) {
              targetIndex = 0;
            }
            setAutoCompleteSelectedIndex(targetIndex);
          }
          const suggestion = autoCompleteSuggestions[targetIndex];
          if (suggestion) {
            handleAutoCompleteSuggestionSelect(suggestion, {
              trigger: 'keyboard',
            });
          }
          return;
        }

        if (event.key === 'Enter' && autoCompleteSelectedIndex >= 0) {
          event.preventDefault();
          const suggestion = autoCompleteSuggestions[autoCompleteSelectedIndex];
          if (suggestion) {
            handleAutoCompleteSuggestionSelect(suggestion, {
              trigger: 'keyboard',
            });
          }
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setShowAutoComplete(false);
          setAutoCompleteSelectedIndex(-1);
          return;
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault();

        if (showAutoComplete) {
          setShowAutoComplete(false);
          setAutoCompleteSelectedIndex(-1);
        }

        if (commandInput.trim() && commandProcessorRef.current) {
          triggerCommandExecution(commandInput);
          setCommandInputState('');
        }
      }

      if (event.key === 'l' && event.ctrlKey) {
        event.preventDefault();
        setConsoleOutputState([]);
      }
    },
    [
      addOutput,
      autoCompleteSelectedIndex,
      autoCompleteSuggestions,
      commandInput,
      exitSelectionMode,
      handleAutoCompleteSuggestionSelect,
      selectionMode.active,
      showAutoComplete,
      triggerCommandExecution,
    ],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      handleKeyDownInternal(event);
    },
    [handleKeyDownInternal],
  );

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (modalData.isOpen) {
        handleKeyDownInternal(event);
      }
    };

    if (modalData.isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleKeyDownInternal, modalData.isOpen]);

  const handleClose = useCallback(() => {
    dispatch(toggleDeveloperModal(undefined));
  }, [dispatch]);

  return {
    autoCompleteSelectedIndex,
    autoCompleteSuggestions,
    commandInput,
    consoleOutput,
    exitSelectionMode,
    handleAutoCompleteSelectedIndexChange,
    handleAutoCompleteSuggestionSelect,
    handleClose,
    handleFilterSelection,
    handleKeyDown,
    handleSelectionConfirm,
    isDeveloper,
    isOpen: modalData.isOpen,
    selectionMode,
    setCommandInput,
    setConsoleOutput,
    showAutoComplete,
    updateSelectedIndex,
    welcomeText: WELCOME_TEXT,
  };
};
