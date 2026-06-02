import { createFirebaseCallable } from '@/firebase/functions/callable';

interface ProcessInvoicePayload {
  message: string;
  timestamp: string;
  type: 'test-request';
}

const callProcessInvoice = createFirebaseCallable<
  ProcessInvoicePayload,
  unknown
>('processInvoiceEndpoint');

export async function testInvoiceFunction(
  inputData: string | null | undefined,
): Promise<unknown> {
  try {
    // Crear el objeto de datos a enviar basado en la entrada del usuario
    const dataToSend: ProcessInvoicePayload = {
      // Utilizamos el inputData como campo de texto si existe, o un valor por defecto
      message: inputData || 'Sin datos',
      timestamp: new Date().toISOString(),
      type: 'test-request',
    };

    // Calling invoice processing function
    const result = await callProcessInvoice(dataToSend);

    // result.data contiene lo que tu función backend retornó
    console.info('Invoice function executed successfully');

    // Retornar los datos para mostrarlos en la UI
    return result;
  } catch (error) {
    console.error('Error al llamar la función:', error);
    // Lanzar el error para que pueda ser manejado por el componente
    throw error;
  }
}
