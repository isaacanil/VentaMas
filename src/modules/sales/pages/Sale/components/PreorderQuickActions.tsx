import { usePreorderModal } from './usePreorderModal';
import { PreorderModal } from './PreorderModal';

export const PreorderQuickActions = () => {
  const preorderModalState = usePreorderModal();
  return (
    <PreorderModal
      {...preorderModalState}
      onRetry={preorderModalState.handleRetry}
      onSelect={preorderModalState.setUserSelectedKey}
      onClose={preorderModalState.closeModal}
    />
  );
};

export default PreorderQuickActions;
