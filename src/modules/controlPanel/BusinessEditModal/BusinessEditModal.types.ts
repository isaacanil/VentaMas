export interface BusinessInfo {
  id?: string;
  name?: string;
  address?: string;
  tel?: string;
}

export interface BusinessEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  business?: BusinessInfo | null;
}
