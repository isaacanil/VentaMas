import type {
  ServiceCommissionCollaboratorRecord,
  ServiceCommissionCollaboratorSnapshot,
} from '@/types/commissions';

import {
  cleanCommissionString as toCleanString,
  normalizeCommissionCollaborator,
} from '@/utils/commissions/serviceCommissions';

export type ServiceCommissionCollaboratorOption = {
  collaborator: ServiceCommissionCollaboratorSnapshot;
  label: string;
  source: 'catalog';
  value: string;
};

interface BuildServiceCommissionCollaboratorOptionsArgs {
  collaborators?: ServiceCommissionCollaboratorRecord[] | null;
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

const addOption = (
  options: Map<string, ServiceCommissionCollaboratorOption>,
  option: ServiceCommissionCollaboratorOption,
) => {
  if (!option.value || options.has(option.value)) return;
  options.set(option.value, option);
};

export const buildServiceCommissionCollaboratorOptions = ({
  collaborators,
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

  return Array.from(options.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
};
