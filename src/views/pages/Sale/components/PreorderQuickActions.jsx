import { usePreorderModal } from './usePreorderModal.jsx';

export const PreorderQuickActions = () => {
  const { Modal } = usePreorderModal();
  return Modal;
};

export default PreorderQuickActions;
