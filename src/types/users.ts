export type UserRoleId =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'buyer'
  | 'dev'
  | 'specialCashier1'
  | 'specialCashier2';

export type UserRoleLike = UserRoleId | (string & {});

export interface UserIdentity {
  id?: string;
  uid?: string;
  name?: string;
  realName?: string;
  displayName?: string;
  role?: UserRoleLike;
  activeRole?: UserRoleLike | null;
  businessID?: string | null;
  businessId?: string | null;
  activeBusinessId?: string | null;
}

export interface UserWithBusiness extends UserIdentity {
  businessID: string;
}

export interface UserRoleInfo {
  id: UserRoleId;
  label: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface UserRoleOption {
  value: UserRoleId;
  label: string;
}
