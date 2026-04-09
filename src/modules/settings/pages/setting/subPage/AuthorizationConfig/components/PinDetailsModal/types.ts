import type { GeneratedPins } from '@/firebase/authorization/pinAuth';

export interface PinDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  pinData: GeneratedPins | null;
  user?: { displayName?: string; email?: string; id?: string } | null;
  currentUser?: {
    uid?: string;
    id?: string;
    businessID?: string | null;
    role?: string;
    name?: string;
    displayName?: string;
  } | null;
}

export interface PinEntryView {
  module: string;
  moduleName: string;
  pin: string;
  createdAt: Date | null;
  expiresAt: Date | null;
}
