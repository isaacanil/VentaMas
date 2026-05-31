import type {
  ServiceCommissionCollaboratorRecord,
  ServiceCommissionCollaboratorSnapshot,
} from '@/types/commissions';

import {
  cleanCommissionString as toCleanString,
  normalizeCommissionCollaborator,
} from './serviceCommissions';

export type ServiceCommissionCollaboratorOption = {
  collaborator: ServiceCommissionCollaboratorSnapshot;
  label: string;
  source: 'catalog' | 'user';
  value: string;
};

type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  number?: number;
};

interface BuildServiceCommissionCollaboratorOptionsArgs {
  collaborators?: ServiceCommissionCollaboratorRecord[] | null;
  users?: BusinessUser[] | null;
}

export const getServiceCommissionCollaboratorOptionValue = (
  collaborator?: ServiceCommissionCollaboratorSnapshot | null,
): string | null =>
  toCleanString(collaborator?.id) ?? toCleanString(collaborator?.code);

export const getServiceCommissionCollaboratorOptionLabel = (
  collaborator: ServiceCommissionCollaboratorSnapshot,
): string => {
  const code = toCleanString(collaborator.code);
  const name = toCleanString(collaborator.name);

  if (code && name && code !== name) return `${code} - ${name}`;
  return code ?? name ?? 'Colaborador';
};

const getUserKey = (user: BusinessUser): string | null =>
  toCleanString(user.id) ??
  toCleanString(user.uid) ??
  toCleanString(user.number);

const addOption = (
  options: Map<string, ServiceCommissionCollaboratorOption>,
  option: ServiceCommissionCollaboratorOption,
) => {
  if (!option.value || options.has(option.value)) return;
  options.set(option.value, option);
};

export const buildServiceCommissionCollaboratorOptions = ({
  collaborators,
  users,
}: BuildServiceCommissionCollaboratorOptionsArgs): ServiceCommissionCollaboratorOption[] => {
  const options = new Map<string, ServiceCommissionCollaboratorOption>();

  (collaborators ?? [])
    .filter((collaborator) => collaborator.active !== false)
    .forEach((record) => {
      const collaborator = normalizeCommissionCollaborator(record);
      const value = getServiceCommissionCollaboratorOptionValue(collaborator);
      if (!value || !collaborator.code) return;

      addOption(options, {
        collaborator,
        label: getServiceCommissionCollaboratorOptionLabel(collaborator),
        source: 'catalog',
        value,
      });
    });

  (users ?? []).forEach((user) => {
    const collaborator = normalizeCommissionCollaborator(user);
    const value =
      getUserKey(user) ??
      getServiceCommissionCollaboratorOptionValue(collaborator);
    if (!value || !collaborator.code) return;

    addOption(options, {
      collaborator,
      label: getServiceCommissionCollaboratorOptionLabel(collaborator),
      source: 'user',
      value,
    });
  });

  return Array.from(options.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
};
