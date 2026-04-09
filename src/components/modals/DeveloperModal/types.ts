import type {
  Dispatch,
  KeyboardEventHandler,
  ReactNode,
  SetStateAction,
} from 'react';

export type ConsoleLineType =
  | 'result'
  | 'command'
  | 'info'
  | 'error'
  | 'warning'
  | 'success'
  | 'selection';

export interface ConsoleCommandLine {
  id: number;
  content: { prompt: string; userCommand: string };
  type: 'command';
}

export interface ConsoleResultLine {
  id: number;
  content: string;
  type: Exclude<ConsoleLineType, 'command'>;
  html?: boolean;
  command?: string;
}

export type ConsoleLine = ConsoleCommandLine | ConsoleResultLine;

export type SelectionItem =
  | string
  | { name?: string; title?: string; label?: string; display?: string }
  | Record<string, unknown>;

export interface SelectionModeState {
  active: boolean;
  items: SelectionItem[];
  selectedIndex: number;
  onSelect: ((item: SelectionItem) => void) | null;
  title: string;
  command: string;
}

export interface AutoCompleteSuggestion {
  command: string;
  description: string;
  requiresInput?: boolean;
}

export interface AutoCompleteSelectOptions {
  trigger?: 'keyboard' | 'click';
}

export interface SelectionModeProps {
  active: boolean;
  items: SelectionItem[];
  selectedIndex: number;
  title: string;
  command: string;
  onExitSelectionMode: () => void;
  onSelectionConfirm: () => void;
  onSelectIndex?: (index: number) => void;
  consoleOutput: ConsoleLine[];
  setConsoleOutput: Dispatch<SetStateAction<ConsoleLine[]>>;
}

export interface ConsoleProps {
  consoleOutput: ConsoleLine[];
  commandInput: string;
  setCommandInput: Dispatch<SetStateAction<string>>;
  handleKeyDown: KeyboardEventHandler<HTMLInputElement>;
  selectionMode: SelectionModeState;
  welcomeText: string;
  autoCompleteSuggestions?: AutoCompleteSuggestion[];
  showAutoComplete?: boolean;
  autoCompleteSelectedIndex?: number;
  onAutoCompleteSuggestionSelect?: (
    suggestion: AutoCompleteSuggestion,
    options?: AutoCompleteSelectOptions,
  ) => void;
  onAutoCompleteSelectedIndexChange?: (index: number) => void;
  onFilterSelection?: (filterText: string) => void;
  children?: ReactNode;
}
