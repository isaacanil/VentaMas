import { useFbGetClients } from './useFbGetClients';

export const useFbGetClientsOnOpen = ({ isOpen }: { isOpen: boolean }) => {
  return useFbGetClients({
    enabled: isOpen,
    preserveCurrentOnError: true,
  });
};
