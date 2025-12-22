export { quantityZeroToInactivePerBusiness } from "./modules/Inventory/functions/quantityZeroToInactivePerBusiness.js";
import { reconcileBatchStatusFromStocks } from "./modules/Inventory/functions/reconcileBatchStatusFromStocks.js";
import { recalculateProductStockTotals } from "./modules/Inventory/functions/recalculateProductStockTotals.js";
import { syncProductsStockCron } from "./versions/v2/inventory/syncProductsStockCron.js";
import { stockAlertsDailyDigest } from "./modules/Inventory/functions/stockAlertsDailyDigest.js";
import { handleInvoiceRequest } from "./modules/invoice/controllers/invoice.controller.js";
import { invoiceLetterPdf } from "./modules/invoice/templates/template2/InvoiceLetterPdf.js";
import { quotationPdf } from "./modules/quotation/quotationGenerate/quotationGenerate.js";
import { keepSupabaseAlive } from "./modules/supabase/controllers/keepSupabaseAlive.controller.js";
import { updatePendingBalance } from "./versions/v1/modules/accountsReceivable/triggers/updatePendingBalance.js";
import { handleCreateUser } from "./versions/v1/modules/auth/handle/handleCreateUser.js";
import { reconcilePendingBalanceCron } from "./versions/v2/accountsReceivable/reconcilePendingBalanceCron.js";
import { auditAccountsReceivableHttp } from "./versions/v2/accountsReceivable/controllers/auditAccountsReceivableHttp.controller.js";
import {
  handleUpdateUser,
  handleUpdateUserWithPermissions,
  handleChangePassword,
} from "./versions/v1/modules/auth/handle/handleUpdateUser.js";

export {
  authLogin,
  authCheck,
  authLogout,
  expireSessions,
} from "./versions/v1/modules/auth/handle/handleLogin.js";
import { finalizeInventorySession } from "./versions/v1/modules/inventory/handlers/finalizeInventorySession.js";
import {
  clientLogin,
  clientValidateUser,
  clientSignUp,
  clientUpdateUser,
  clientChangePassword,
  clientSetUserPassword,
  clientValidateSession,
  clientRefreshSession,
  clientListSessions,
  clientListSessionLogs,
  clientRevokeSession,
  clientLogout,
} from "./versions/v2/auth/controllers/clientAuth.controller.js";
import {
  generateModulePins,
  deactivateModulePins,
  getUserModulePinStatus,
  getBusinessPinsSummary,
  validateModulePin,
  getUserModulePins,
  autoRotateModulePins,
} from "./versions/v2/auth/controllers/pin.controller.js";
import { createInvoiceV2 } from "./versions/v2/invoice/controllers/createInvoice.controller.js";
import { createInvoiceV2Http } from "./versions/v2/invoice/controllers/createInvoiceHttp.controller.js";
import { getInvoiceV2Http } from "./versions/v2/invoice/controllers/getInvoiceHttp.controller.js";
import { repairInvoiceV2Http } from "./versions/v2/invoice/controllers/repairInvoiceHttp.controller.js";
import { autoRepairInvoiceV2Http } from "./versions/v2/invoice/controllers/autoRepairInvoiceHttp.controller.js";
import { processInvoiceCompensation } from "./versions/v2/invoice/triggers/compensation.worker.js";
import { processInvoiceOutbox } from "./versions/v2/invoice/triggers/outbox.worker.js";
import { syncRealtimePresence } from "./versions/v2/auth/triggers/presenceSync.js";
import { rebuildNcfLedger } from "./versions/v2/invoice/controllers/rebuildNcfLedger.controller.js";
import { runCashCountAudit } from "./versions/v2/cashCount/controllers/runCashCountAudit.controller.js";

export {
  keepSupabaseAlive,
  handleInvoiceRequest,
  reconcileBatchStatusFromStocks,
  recalculateProductStockTotals,
  stockAlertsDailyDigest,
  quotationPdf,
  invoiceLetterPdf,
  handleCreateUser,
  handleUpdateUser,
  handleUpdateUserWithPermissions,
  handleChangePassword,
  updatePendingBalance,
  finalizeInventorySession,
  createInvoiceV2,
  createInvoiceV2Http,
  getInvoiceV2Http,
  repairInvoiceV2Http,
  autoRepairInvoiceV2Http,
  processInvoiceOutbox,
  processInvoiceCompensation,
  rebuildNcfLedger,
  runCashCountAudit,
  clientLogin,
  clientValidateUser,
  clientSignUp,
  clientUpdateUser,
  clientChangePassword,
  clientSetUserPassword,
  clientValidateSession,
  clientRefreshSession,
  clientListSessions,
  clientListSessionLogs,
  clientRevokeSession,
  clientLogout,
  generateModulePins,
  deactivateModulePins,
  getUserModulePinStatus,
  getBusinessPinsSummary,
  validateModulePin,
  getUserModulePins,
  autoRotateModulePins,
  syncRealtimePresence,
  syncProductsStockCron,
  reconcilePendingBalanceCron,
  auditAccountsReceivableHttp,
};
