import type { FormInstance } from 'antd';

import { fbAddClient } from '@/firebase/client/fbAddClient';
import { fbUpdateClient } from '@/firebase/client/fbUpdateClient';
import type {
  ClientInput,
  NormalizedClient,
} from '@/firebase/client/clientNormalizer';
import type { UserWithBusiness } from '@/types/users';

const isFormValidationError = (
  error: unknown,
): error is { errorFields: unknown[] } =>
  Boolean(error && typeof error === 'object' && 'errorFields' in error);

const getClientRequestErrorMessage = (error: unknown) => {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';

  if (code === 'functions/unauthenticated') {
    return 'Tu sesión expiró. Inicia sesión otra vez e inténtalo de nuevo.';
  }

  if (code === 'functions/permission-denied') {
    return 'No tienes permisos para guardar clientes en este negocio.';
  }

  if (code === 'functions/resource-exhausted') {
    return 'Tu suscripción actual no permite crear más clientes.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Inténtalo de nuevo en unos segundos.';
};

type SubmitClientFormResult =
  | {
      clientForCart: NormalizedClient | null;
      status: 'success';
      successDescription: string;
      successMessage: string;
    }
  | {
      status: 'validation_error';
    }
  | {
      errorDescription: string;
      errorMessage: string;
      status: 'error';
    };

export const submitClientForm = async ({
  customerData,
  form,
  isUpdating,
  selectedClientId,
  userWithBusiness,
}: {
  customerData: ClientInput;
  form: FormInstance<ClientInput>;
  isUpdating: boolean;
  selectedClientId?: string | null;
  userWithBusiness: UserWithBusiness | null;
}): Promise<SubmitClientFormResult> => {
  try {
    const values = await form.validateFields();
    let clientForCart: NormalizedClient | null = null;

    const sanitizedValues = values as ClientInput & { clear?: unknown };
    delete sanitizedValues.clear;

    const client = {
      ...customerData,
      ...sanitizedValues,
    };

    if (isUpdating) {
      const updatedClient = await fbUpdateClient(
        userWithBusiness,
        client as ClientInput & { id: string },
      );

      if (
        updatedClient &&
        String(updatedClient.id ?? '') === String(selectedClientId ?? '')
      ) {
        clientForCart = updatedClient;
      }

      return {
        clientForCart,
        status: 'success',
        successDescription:
          'La información del cliente ha sido actualizada con éxito.',
        successMessage: 'Cliente Actualizado',
      };
    }

    clientForCart = await fbAddClient(userWithBusiness, client);
    return {
      clientForCart,
      status: 'success',
      successDescription: 'Se ha añadido un nuevo cliente con éxito.',
      successMessage: 'Cliente Creado',
    };
  } catch (error) {
    if (isFormValidationError(error)) {
      return {
        status: 'validation_error',
      };
    }

    return {
      errorDescription: getClientRequestErrorMessage(error),
      errorMessage: isUpdating
        ? 'No se pudo actualizar el cliente'
        : 'No se pudo crear el cliente',
      status: 'error',
    };
  }
};
