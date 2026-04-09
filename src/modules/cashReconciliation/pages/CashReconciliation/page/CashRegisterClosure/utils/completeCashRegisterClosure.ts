import { fbRecordAuthorizationApproval } from '@/firebase/authorization/approvalLogs';
import { fbCashCountClosed } from '@/firebase/cashCount/closing/fbCashCountClosed';
import { resolveCloseCashCountError } from '@/firebase/cashCount/closing/closeCashCountErrors';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { UserIdentity } from '@/types/users';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

type CompleteCashRegisterClosureSuccess = {
  status: 'success';
};

type CompleteCashRegisterClosureError = {
  errorMessage: string;
  status: 'error';
};

export type CompleteCashRegisterClosureResult =
  | CompleteCashRegisterClosureSuccess
  | CompleteCashRegisterClosureError;

export const completeCashRegisterClosure = async ({
  actualUser,
  approvalEmployee,
  cashCount,
  closingDateIso,
  closingDateMillis,
}: {
  actualUser: UserIdentity;
  approvalEmployee: UserIdentity;
  cashCount: CashCountRecord;
  closingDateIso: string | null;
  closingDateMillis: number;
}): Promise<CompleteCashRegisterClosureResult> => {
  try {
    if (!approvalEmployee?.uid) {
      throw new Error('No se pudo identificar al autorizador.');
    }
    if (!actualUser?.uid) {
      throw new Error('No se pudo identificar al usuario actual.');
    }

    const businessId = resolveUserIdentityBusinessId(actualUser);
    if (!businessId) {
      throw new Error('No se pudo identificar el negocio actual.');
    }

    const response = await fbCashCountClosed(
      actualUser,
      cashCount,
      actualUser.uid,
      approvalEmployee.uid,
      closingDateMillis,
    );

    if (response !== 'success') {
      const details = resolveCloseCashCountError(response);
      console.error('[CashRegisterClosure] close authorization failed', {
        code: details.code,
        rawMessage: details.rawMessage,
        businessId,
        cashCountId: cashCount?.id || null,
        actualUserId: actualUser.uid,
        approvalEmployeeId: approvalEmployee.uid,
      });
      throw new Error(details.userMessage);
    }

    await fbRecordAuthorizationApproval({
      businessId,
      module: 'cashRegister',
      action: 'cash-register-closing',
      description: 'Cierre del cuadre de caja',
      requestedBy: actualUser,
      authorizer: approvalEmployee,
      targetUser: actualUser,
      target: {
        type: 'cashCount',
        id: cashCount?.id || '',
        details: { stage: 'closing' },
      },
      metadata: {
        closingDate: closingDateIso,
      },
    });

    return {
      status: 'success',
    };
  } catch (error: unknown) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : 'No se pudo completar el cierre de caja.',
      status: 'error',
    };
  }
};
