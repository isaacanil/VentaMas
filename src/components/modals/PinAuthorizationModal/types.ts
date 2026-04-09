export interface PasswordFormValues {
  username: string;
  password: string;
}

export interface AuthorizedUser {
  uid?: string | null;
  id?: string | null;
  name?: string;
  displayName?: string;
  activeRole?: string;
  role?: string;
  businessID?: string | null;
  businessId?: string | null;
  activeBusinessId?: string | null;
  email?: string;
  accessControl?: unknown;
  memberships?: unknown;
  [key: string]: unknown;
}

export interface PinAuthorizationModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAuthorized: (authorizer: AuthorizedUser) => void | Promise<void>;
  description?: string;
  allowedRoles?: string[];
  reasonList?: string[];
  module?: string;
  allowPasswordFallback?: boolean;
}
