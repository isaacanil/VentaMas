import type { FieldValue, Timestamp } from 'firebase/firestore';
import type { UserRoleLike } from './users';

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'modify'
  | 'manage'
  | 'view'
  | 'access'
  | 'export'
  | 'delete'
  | (string & {});

export type PermissionSubject = string;

export interface PermissionDefinition {
  action: PermissionAction;
  subject: PermissionSubject;
  label?: string;
  description?: string;
  category?: string;
}

export interface UserDynamicPermissions {
  userId: string;
  businessID: string | null;
  additionalPermissions: PermissionDefinition[];
  restrictedPermissions: PermissionDefinition[];
  createdAt?: Timestamp | FieldValue | Date | null;
  updatedAt?: Timestamp | FieldValue | Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type DynamicPermissionsPayload = Pick<
  UserDynamicPermissions,
  'additionalPermissions' | 'restrictedPermissions'
>;

export interface RolePermissionsInfo {
  roleName: UserRoleLike | null;
  roleSpecificCount: number;
  generalCount: number;
  totalAvailable: number;
  categories: string[];
}
