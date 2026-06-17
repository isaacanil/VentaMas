import styled from 'styled-components';

import Console from './components/Console';
import { Header } from './components/Header';
import { Modal } from './components/Modal';
import SelectionMode from './components/SelectionMode';
import { useDeveloperModalController } from './hooks/useDeveloperModalController';

export const DeveloperModal = () => {
  const {
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
    isOpen,
    selectionMode,
    setCommandInput,
    setConsoleOutput,
    showAutoComplete,
    updateSelectedIndex,
    welcomeText,
  } = useDeveloperModalController();

  if (!isDeveloper) return null;

  return (
    <Modal visible={isOpen} onClose={handleClose}>
      <Header title="Consola de Desarrollador" />
      <ConsoleContainer>
        {selectionMode.active ? (
          <SelectionMode
            active={selectionMode.active}
            items={selectionMode.items}
            selectedIndex={selectionMode.selectedIndex}
            title={selectionMode.title}
            command={selectionMode.command}
            onExitSelectionMode={exitSelectionMode}
            onSelectionConfirm={handleSelectionConfirm}
            onSelectIndex={updateSelectedIndex}
            consoleOutput={consoleOutput}
            setConsoleOutput={setConsoleOutput}
          />
        ) : null}
        <Console
          consoleOutput={consoleOutput}
          commandInput={commandInput}
          setCommandInput={setCommandInput}
          handleKeyDown={handleKeyDown}
          selectionMode={selectionMode}
          welcomeText={welcomeText}
          autoCompleteSuggestions={autoCompleteSuggestions}
          showAutoComplete={showAutoComplete}
          autoCompleteSelectedIndex={autoCompleteSelectedIndex}
          onAutoCompleteSuggestionSelect={handleAutoCompleteSuggestionSelect}
          onAutoCompleteSelectedIndexChange={
            handleAutoCompleteSelectedIndexChange
          }
          onFilterSelection={handleFilterSelection}
        />
      </ConsoleContainer>
    </Modal>
  );
};

const ConsoleContainer = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
`;

export default DeveloperModal;
