export { quantityZeroToInactivePerBusiness } from "./modules/Inventory/functions/quantityZeroToInactivePerBusiness.js";
import { stockAlertsDailyDigest } from "./modules/Inventory/functions/stockAlertsDailyDigest.js";
import { handleInvoiceRequest } from "./modules/invoice/controllers/invoice.controller.js";
import { invoiceLetterPdf } from "./modules/invoice/templates/template2/InvoiceLetterPdf.js";
import { quotationPdf } from "./modules/quotation/quotationGenerate/quotationGenerate.js";
import { keepSupabaseAlive } from "./modules/supabase/controllers/keepSupabaseAlive.controller.js";
import { handleCreateUser } from "./versions/v1/modules/auth/handle/handleCreateUser.js";
import { handleUpdateUser, handleUpdateUserWithPermissions, handleChangePassword } from "./versions/v1/modules/auth/handle/handleUpdateUser.js";
import { updatePendingBalance } from "./versions/v1/modules/accountsReceivable/triggers/updatePendingBalance.js";
export { authLogin, authCheck, authLogout, expireSessions } from "./versions/v1/modules/auth/handle/handleLogin.js";
import { createInvoiceV2 } from "./versions/v2/invoice/controllers/createInvoice.controller.js";
import { createInvoiceV2Http } from "./versions/v2/invoice/controllers/createInvoiceHttp.controller.js";
import { getInvoiceV2Http } from "./versions/v2/invoice/controllers/getInvoiceHttp.controller.js";

// mas tarde la funcion para actualziar el inventario
// import { updateStockOnInvoiceCreate } from "./versions/v1/modules/inventory/triggers/updateStockOnInvoiceCreate.js";
import { finalizeInventorySession } from "./versions/v1/modules/inventory/handlers/finalizeInventorySession.js";
import { processInvoiceOutbox } from "./versions/v2/invoice/triggers/outbox.worker.js";
import { processInvoiceCompensation } from "./versions/v2/invoice/triggers/compensation.worker.js";
import {
  clientLogin,
  clientValidateUser,
  clientSignUp,
  clientUpdateUser,
  clientChangePassword,
  clientSetUserPassword,
} from "./versions/v2/auth/controllers/clientAuth.controller.js";

export { 
  keepSupabaseAlive, 
  handleInvoiceRequest, 
  stockAlertsDailyDigest,
  quotationPdf, 
  invoiceLetterPdf, 
  handleCreateUser,
  handleUpdateUser,
  handleUpdateUserWithPermissions,
  handleChangePassword,
  updatePendingBalance, // muy importante
  finalizeInventorySession,
  createInvoiceV2,
  createInvoiceV2Http,
  getInvoiceV2Http,
  processInvoiceOutbox,
  processInvoiceCompensation,
  clientLogin,
  clientValidateUser,
  clientSignUp,
  clientUpdateUser,
  clientChangePassword,
  clientSetUserPassword,
};
