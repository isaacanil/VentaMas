import { usePreorderModal } from './usePreorderModal';

export const PreorderQuickActions = () => {
  const { Modal } = usePreorderModal();
  return Modal;
};

export default PreorderQuickActions;
