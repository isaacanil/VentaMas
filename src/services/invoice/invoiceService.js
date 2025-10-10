import { Timestamp } from "firebase/firestore";
import { DateTime } from "luxon";

import { GenericClient } from "../../features/clientCart/clientCartSlice";
import { fbAddAR } from "../../firebase/accountsReceivable/fbAddAR";
import { fbAddInstallmentAR } from "../../firebase/accountsReceivable/fbAddInstallmentAR";
import { fbRecordAuthorizationApproval } from "../../firebase/authorization/approvalLogs";
import { checkOpenCashReconciliation } from "../../firebase/cashCount/useIsOpenCashReconciliation";
import { fbUpsertClient } from "../../firebase/client/fbUpsertClient";
import { fbConsumeCreditNotes } from "../../firebase/creditNotes/fbConsumeCreditNotes";
import { addInsuranceAuth } from "../../firebase/insurance/insuranceAuthService";
import { getInsurance } from "../../firebase/insurance/insuranceService";
import { fbAddInvoice } from "../../firebase/invoices/fbAddInvoice";
import { fbGenerateInvoiceFromPreorder } from "../../firebase/invoices/fbGenerateInvoiceFromPreorder";
import { fbUpdateProductsStock } from "../../firebase/products/fbUpdateProductsStock";
import { fbGetAndUpdateTaxReceipt } from "../../firebase/taxReceipt/fbGetAndUpdateTaxReceipt";
import { getCashCountStrategy } from "../../notification/cashCountNotification/cashCountNotificacion";
import { validateInvoiceCart } from "../../utils/invoiceValidation";

const NCF_TYPES = {
    'CREDITO FISCAL': 'CREDITO FISCAL',
    'CONSUMIDOR FINAL': 'CONSUMIDOR FINAL'
}

export async function processInvoice({
    user,
    cart,
    client,
    accountsReceivable,
    insuranceAR,
    insuranceAuth,
    ncfType,
    taxReceiptEnabled = false,
    dispatch,
    dueDate = null,
    insuranceEnabled = false,
    isTestMode = false,
}) {
    try {
        verifyCartItems(cart);

        // En modo de prueba, mostrar notificación y procesar sin guardar en base de datos
        if (isTestMode) {
            return await processTestModeInvoice({
                user,
                cart,
                client,
                accountsReceivable,
                insuranceAR,
                insuranceAuth,
                ncfType,
                taxReceiptEnabled,
                dueDate,
                insuranceEnabled,
            });
        }

        const { cashCount } = await validateCashReconciliation({ user, dispatch, });
        if (!cashCount) {
            throw new Error('No se puede procesar la factura sin cuadre de caja');
        }

        const [ncfCode, clientData] = await Promise.all([
            handleTaxReceiptGeneration({ user, taxReceiptEnabled, ncfType, client }),
            retrieveAndUpdateClientData({ user, client }),
        ]);

        const invoice = cart?.preorderDetails?.isOrWasPreorder
            ? await generalInvoiceFromPreorder({ user, cart, cashCount, ncfCode })
            : await generateFinalInvoice({ user, cart, clientData, ncfCode, cashCount, dueDate });

        await adjustProductInventory({ user, products: cart.products, invoice });

        // Consumir notas de crédito si se aplicaron
        if (cart?.creditNotePayment?.length > 0) {
            await fbConsumeCreditNotes(user, cart.creditNotePayment, invoice.id, invoice);
        }

        // Procesar cuentas por cobrar normales si existen
        if (cart?.isAddedToReceivables && accountsReceivable?.totalInstallments) {
            await manageReceivableAccounts({ user, accountsReceivable, invoice });
        }        // Procesar cuentas por cobrar de seguros médicos si existen
        if (insuranceEnabled && insuranceAR?.totalInstallments) {
            const arData = {
                ...insuranceAR,
                clientId: client.id,
                invoiceId: invoice.id,
            };
            const authDataId = await addInsuranceAuth(user, insuranceAuth, clientData.clientId)

            await manageInsuranceReceivableAccounts({ user, arData, invoice, insuranceAuth, authDataId });
        }

    return { invoice }

    } catch (error) {
        throw error
    }
}

function checkIfHasDueDate({ cart, dueDate }) {
    if (!dueDate) {
        return cart;
    }
    const date = Timestamp.fromMillis(dueDate);
    return {
        ...cart,
        dueDate: date,
        hasDueDate: true
    }
}

function verifyCartItems(cart) {
    const { isValid, message } = validateInvoiceCart(cart);
    if (!isValid) {
        throw new Error(message)
    }
}
async function validateCashReconciliation({ user, dispatch, transaction }) {
    try {
        const { state, cashCount } = await checkOpenCashReconciliation(user, transaction);

        if (state === 'open') {
            return { cashCount };
        }

        if (['closed', 'closing', 'none'].includes(state)) {
            const cashCountStrategy = getCashCountStrategy(state, dispatch)
            cashCountStrategy.handleConfirm()
            return { cashCount: null };
        }
    } catch (error) {
        throw new Error(`Error al validar cuadre de caja: ${error.message}`);
    }
}

async function handleTaxReceiptGeneration({ user, taxReceiptEnabled, ncfType }) {
    if (!user || !taxReceiptEnabled) return null;

    try {
        return await fbGetAndUpdateTaxReceipt(user, ncfType);
    } catch (error) {
        console.error(`Error processing tax receipt for type ${ncfType}:`, error.message);
        throw new Error('Failed to process tax receipt');
    }
}

async function retrieveAndUpdateClientData({ user, client }) {
    if (!client) { return { client: GenericClient }; }
    if (!client.id) { return { client: GenericClient }; }
    try {
        await fbUpsertClient(user, client);
        return { clientId: client.id, client };
    } catch (error) {
        throw new Error(`Error al actualizar los datos del cliente: ${error.message}`);
    }
}

async function adjustProductInventory({ user, products, invoice }) {
    if(Array.isArray(products) && products.length) { 
        await fbUpdateProductsStock(products, user, invoice)
    }
}

async function generateFinalInvoice({ user, cart, cashCount, ncfCode, clientData, dueDate }) {
    try {
        const cartWithDueDate = dueDate ? checkIfHasDueDate({ cart, dueDate }) : cart;
        const { authorizationContext = null, ...cartPayload } = cartWithDueDate || {};

        const bill = {
            ...cartPayload,
            NCF: ncfCode,
            client: clientData.client,
            cashCountId: cashCount.id
        };

        const invoice = await fbAddInvoice(bill, user) || bill;

        await logInvoiceAuthorizations({
            user,
            invoice,
            authorizationContext,
            cart: cartWithDueDate,
        });

        return invoice;
    } catch (error) {
        throw new Error(`Error al generar la factura final: ${error.message}`);
    }
}

async function manageReceivableAccounts({ user, accountsReceivable, invoice }) {
    try {
        if (!invoice?.isAddedToReceivables) return;
        if (!accountsReceivable?.totalInstallments) {
            throw new Error('Installments data is missing')
        }
        const ar = await fbAddAR({ user, accountsReceivable })
        await fbAddInstallmentAR({ user, ar })
    } catch (error) {
        throw new Error(`Error al gestionar cuentas por cobrar: ${error.message}`);
    }
}

async function manageInsuranceReceivableAccounts({ user, arData, invoice, insuranceAuth, authDataId }) {
    try {
        // Validate input data
        if (!arData?.totalInstallments) {
            throw new Error('Datos de cuotas de seguro faltantes');
        }

        const { insuranceName } = await getInsurance(user, insuranceAuth.insuranceId);

        // Normalizar la estructura para que sea compatible con fbAddAR
        const normalizedAR = {
            ...arData,
            invoiceId: invoice.id,
            clientId: invoice?.client?.id,
            paymentFrequency: arData.paymentFrequency || 'monthly',
            totalInstallments: arData.totalInstallments || 1,
            installmentAmount: arData.installmentAmount || 0,
            totalReceivable: arData.totalReceivable || 0,  // Usado en lugar de amount
            currentBalance: arData.currentBalance || arData.totalReceivable || 0, // Usado en lugar de arBalance
            createdAt: arData.createdAt || DateTime.now().toMillis(),
            updatedAt: arData.updatedAt || DateTime.now().toMillis(),
            paymentDate: arData.paymentDate,
            isActive: arData.isActive !== undefined ? arData.isActive : true, // Usado en lugar de status
            isClosed: arData.isClosed !== undefined ? arData.isClosed : false,
            type: 'insurance',
            insurance: {
                authId: authDataId,
                name: insuranceName,
                insuranceId: insuranceAuth.insuranceId,
                authNumber: insuranceAuth.authNumber,
            },
            comments: arData.comments || ''
        };

        // Usar las mismas funciones que para cuentas por cobrar normales
        const ar = await fbAddAR({ user, accountsReceivable: normalizedAR });
        await fbAddInstallmentAR({ user, ar });
    } catch (error) {
        console.error("Error en manageInsuranceReceivableAccounts:", error);
        throw new Error(`Error al gestionar cuentas por cobrar de seguro: ${error.message}`);
    }
}

async function generalInvoiceFromPreorder({ user, cart, cashCount, ncfCode }) {
    try {
        if (!cart?.preorderDetails?.isOrWasPreorder || cart?.status != "pending") {
            throw new Error("Datos de preorden inválidos");
        }
        const bill = {
            ...cart,
            NCF: ncfCode,
            cashCountId: cashCount.id
        }
        await fbGenerateInvoiceFromPreorder(user, bill);
        return bill;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const extractAmount = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object') {
        if (typeof value.value === 'number') return value.value;
        if (typeof value.amount === 'number') return value.amount;
    }
    return null;
};

const sanitizeUserSnapshot = (userLike) => {
    if (!userLike || typeof userLike !== 'object') {
        return null;
    }

    return {
        uid: userLike.uid || userLike.id || '',
        name: userLike.displayName || userLike.name || '',
        role: userLike.role || '',
        email: userLike.email || '',
    };
};

async function logInvoiceAuthorizations({ user, invoice, authorizationContext, cart }) {
    const discountAuth = authorizationContext?.discount;
    if (!discountAuth?.authorizer) {
        return;
    }

    try {
        const requestedBy = discountAuth.requestedBy || sanitizeUserSnapshot(cart?.seller || user);
        const targetUser = discountAuth.targetUser || requestedBy;

        const description = discountAuth.description || `Autorización aplicada en factura ${invoice?.numberID || ''}`.trim();

        await fbRecordAuthorizationApproval({
            businessId: user?.businessID,
            module: discountAuth.module || 'invoices',
            action: discountAuth.action || 'invoice-discount-override',
            description,
            requestedBy,
            authorizer: discountAuth.authorizer,
            targetUser,
            target: {
                type: 'invoice',
                id: invoice?.id || '',
                name: invoice?.numberID ? `Factura ${invoice.numberID}` : invoice?.id || '',
                details: {
                    invoiceNumber: invoice?.numberID || null,
                    cartId: discountAuth.metadata?.cartId || cart?.id || null,
                    clientId: discountAuth.metadata?.clientId || cart?.client?.id || null,
                    clientName: discountAuth.metadata?.clientName || cart?.client?.name || '',
                },
            },
            metadata: {
                ...discountAuth.metadata,
                invoiceId: invoice?.id || null,
                invoiceNumber: invoice?.numberID || null,
                total: extractAmount(invoice?.totalPurchase) ?? extractAmount(discountAuth.metadata?.total) ?? null,
                discountPercent: extractAmount(invoice?.discount) ?? extractAmount(discountAuth.metadata?.discountPercent) ?? null,
            },
        });
    } catch (error) {
        console.error('Error registrando autorización de factura:', error);
    }
}

/**
 * Procesa una factura en modo de prueba sin guardar en la base de datos
 * Retorna un mock de factura para visualización
 */
async function processTestModeInvoice({
    user,
    cart,
    client,
    accountsReceivable,
    insuranceAR,
    insuranceAuth,
    ncfType,
    taxReceiptEnabled,
    dueDate,
    insuranceEnabled,
}) {
    try {


        // Generar un mock de NCF para prueba
        const mockNcfCode = taxReceiptEnabled ? `TEST-${ncfType}-${Date.now()}` : null;

        // Generar datos mock del cliente
        const mockClientData = client || {
            id: 'test-client-id',
            name: 'Cliente de Prueba',
            ...GenericClient
        };

        // Crear factura mock con estructura similar a la real
        const mockInvoice = {
            id: `TEST-INVOICE-${Date.now()}`,
            ...cart,
            NCF: mockNcfCode,
            client: mockClientData,
            cashCountId: 'test-cash-count-id',
            createdAt: new Date().toISOString(),
            testMode: true, // Marcar como factura de prueba
            status: 'test-preview',
            timestamp: Date.now(),
        };

        // Si hay fecha de vencimiento, agregarla
        if (dueDate) {
            mockInvoice.dueDate = new Date(dueDate);
            mockInvoice.hasDueDate = true;
        }

        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 1000));

        // En modo de prueba, solo simular el consumo de notas de crédito
        if (cart?.creditNotePayment?.length > 0) {
            console.log(`🧪 [MODO PRUEBA] Simulando consumo de ${cart.creditNotePayment.length} notas de crédito`);
            cart.creditNotePayment.forEach(note => {
                console.log(`🧪 [MODO PRUEBA] Nota ${note.ncf}: -${note.amountUsed}`);
            });
            console.log(`🧪 [MODO PRUEBA] Simulando creación de registros de aplicación para factura ${mockInvoice.id}`);
        }

        return { invoice: mockInvoice };

    } catch (error) {
        console.error('❌ Error en modo de prueba:', error);
        throw new Error(`Error en modo de prueba: ${error.message}`);
    }
}
