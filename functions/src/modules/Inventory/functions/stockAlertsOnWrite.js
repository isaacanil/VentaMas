// stockAlertsOnWrite.js
// =============================================================
// ESTRATEGIA ACTUAL (v1 – enfoque mínimo de alto valor):
//   Dispara un correo SOLO cuando un productsStock cruza hacia abajo los umbrales
//   configurados (low / critical) y no se ha notificado antes (flags).
//   Se considera de mayor valor inicial la alerta de CRÍTICO (reduce ruptura de stock).
//
// POR QUÉ ESTA ELECCIÓN:
//   1. Alto impacto para negocio: avisa a tiempo antes de quedar en 0.
//   2. Ruido limitado (evita spam) al usar flags + reset sólo cuando se recupera > low.
//   3. Simple de mantener y desplegar sin cálculos avanzados.
//
// ESCENARIOS / MODOS ADICIONALES (para iteraciones futuras):
//   (Se dejan enumerados para evolución; NO implementados todavía.)
//   A) Zero / Negative Stock Alert:
//      - Disparar si quantity llega a 0 ó < 0.
//      - Útil cuando la venta se sigue intentando sin stock.
//   B) Daily Consolidated Digest:
//      - Un cron diario que agrupe todos los productos en BAJO/CRÍTICO y envíe un único correo.
//      - Reduce ruido si hay muchos productos moviéndose.
//   C) Forecast / Días de Cobertura:
//      - Calcular consumo promedio (ej. últimas 2–4 semanas) y alertar si “days of cover” < X.
//      - Requiere histórico de movimientos/ventas.
//   D) Próxima Expiración (Batch / Caducidad):
//      - Alerta si un lote expira en <= N días (si existe campo expirationDate o metadata).
//   E) Dead Stock / Inactividad:
//      - Productos sin movimientos > N días y aún con stock inmovilizado.
//   F) Overstock:
//      - Stock por encima de un umbral (capital inmovilizado) — menos prioritario temprano.
//   G) Reorder Point Personalizado por Producto:
//      - Umbral configurable distinto por producto (override del global).
//   H) Integración con Pedido Automático:
//      - En lugar de correo, crear automáticamente un “draft purchase order”.
//
// POS COMERCIALES típicamente empiezan con:
//   1) Umbral bajo / crítico.
//   2) Cero stock.
//   3) Reorder point individual.
//   4) Forecast básico más adelante.
//
// REGLAS IMPLEMENTADAS EN ESTA VERSIÓN:
//   - Si stockAlertsEnabled = false => ignora.
//   - Umbrales desde businesses/{bid}/settings/billing.
//   - Campo monitoreado: quantity (en productsStock).
//   - Se dispara email sólo al cruzar de arriba hacia <= low o <= critical.
//   - CRÍTICO fuerza también marcar lowSent para evitar doble correo inmediato.
//   - Reset flags si quantity > low (recuperación real de inventario).
//   - Flags: alerts.lowSent / alerts.criticalSent.
//
// NOTAS ESCALABILIDAD / SUGERENCIAS PARA FUTURO (comentadas):
//   - Podría agregarse un debounce (p.ej. ignorar múltiples cambios en < 1 min) usando
//     lastAlertAt y comparando timestamps.
//   - Parametrizar modos via env: STOCK_ALERT_MODES=critical,low,daily_digest
//   - Guardar log en collection `stockAlertLogs` para auditoría.
// =============================================================

import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { sendMail } from '../../../core/config/mailer.js';

export const stockAlertsOnWrite = onDocumentWritten(
  {
    document: 'businesses/{bid}/productsStock/{stockId}',
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before?.data() || null;
    const after = event.data?.after?.data() || null;

    // Si se borró el documento o marcado eliminado, ignorar
    if (!after || after.isDeleted) return;

    // Solo si status activo
    if (after.status && after.status !== 'active') return;

    // Si quantity no cambió, salir rápido
    const prevQty = before?.quantity;
    const newQty = after.quantity;
    if (typeof newQty !== 'number') return;
    if (prevQty === newQty) return;

    const bid = event.params.bid;

    // Cargar settings billing
    const settingsRef = db.doc(`businesses/${bid}/settings/billing`);
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) return;
    const settings = settingsSnap.data() || {};
    if (!settings.stockAlertsEnabled) return;

    const low = Number.isFinite(settings.stockLowThreshold)
      ? settings.stockLowThreshold
      : 20;
    const critical = Number.isFinite(settings.stockCriticalThreshold)
      ? settings.stockCriticalThreshold
      : 10;
    const toEmail = (settings.stockAlertEmail || '').trim();
    if (!toEmail) {
      logger.warn('[stockAlerts] No hay correo configurado para alertas', {
        bid,
      });
      return;
    }

    // =============================================================
    // VALIDACIÓN BACKEND DE DOMINIOS (paridad con frontend):
    //   Usa env STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS (coma separada). Ej:
    //     STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS=gmail.com,empresa.com
    //   Si incluye '*' => sin restricción.
    // =============================================================
    const allowedDomainsEnv =
      process.env.STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS || '';
    const allowedDomains = allowedDomainsEnv
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const unrestricted =
      allowedDomains.includes('*') || allowedDomains.length === 0;
    const recipientList = toEmail
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const filteredRecipients = unrestricted
      ? recipientList
      : recipientList.filter((r) => {
          const domain = r.split('@').pop().toLowerCase();
          return allowedDomains.includes(domain);
        });
    if (filteredRecipients.length === 0) {
      logger.warn(
        '[stockAlerts] Todos los correos filtrados por dominios no permitidos',
        {
          bid,
          recipientList,
          allowedDomains,
        },
      );
      return;
    }

    // Recuperar flags actuales
    const alertsFlags = after.alerts || { lowSent: false, criticalSent: false };
    let { lowSent, criticalSent } = alertsFlags;

    const updates = {};
    let shouldSend = false;
    let level = null;

    // Condiciones de disparo
    if (
      !criticalSent &&
      newQty <= critical &&
      (prevQty === undefined || prevQty > critical)
    ) {
      level = 'CRITICO';
      criticalSent = true;
      lowSent = true; // si es crítico ya no hace falta enviar el bajo luego hasta reset
      shouldSend = true;
    } else if (
      !lowSent &&
      newQty <= low &&
      (prevQty === undefined || prevQty > low)
    ) {
      level = 'BAJO';
      lowSent = true;
      shouldSend = true;
    }

    // Reset flags si se recupera por encima de low
    if (newQty > low && (lowSent || criticalSent)) {
      lowSent = false;
      criticalSent = false;
      updates['alerts'] = { lowSent, criticalSent };
      await db.doc(event.data.after.ref.path).set(updates, { merge: true });
      logger.info('[stockAlerts] Reset de flags por recuperación de stock', {
        path: event.data.after.ref.path,
        newQty,
      });
      return;
    }

    if (!shouldSend) {
      // Si no hay email que enviar pero sí cambian flags (p.e. marcamos lowSent) guardar.
      if (
        level &&
        (lowSent !== alertsFlags.lowSent ||
          criticalSent !== alertsFlags.criticalSent)
      ) {
        updates['alerts'] = { lowSent, criticalSent };
        await db.doc(event.data.after.ref.path).set(updates, { merge: true });
      }
      return;
    }

    // Preparar contenido
    const productName = after.productName || after.productId || 'Producto';
    const subject =
      level === 'CRITICO'
        ? `ALERTA CRÍTICA: Stock crítico para ${productName}`
        : `Alerta: Stock bajo para ${productName}`;

    const html = `
    <h2>${subject}</h2>
    <p>Producto: <strong>${productName}</strong></p>
    <p>Cantidad actual: <strong>${newQty}</strong></p>
    <p>Umbral bajo: ${low} | Umbral crítico: ${critical}</p>
    <p>Fecha: ${new Date().toLocaleString('es-DO', { hour12: false })}</p>
    <hr />
    <small>Esta notificación fue generada automáticamente. No respondas este correo.</small>
  `;

    try {
      // Envío SMTP (modo único soportado actualmente)
      await sendMail({
        to: filteredRecipients,
        subject,
        html,
        text: `${subject}\nCantidad: ${newQty}\nProducto: ${productName}`,
      });
      updates['alerts'] = { lowSent, criticalSent };
      updates['lastAlertAt'] = FieldValue.serverTimestamp();
      updates['lastAlertLevel'] = level;
      await db.doc(event.data.after.ref.path).set(updates, { merge: true });
      logger.info('[stockAlerts] Correo enviado (SMTP)', {
        productName,
        level,
        qty: newQty,
        path: event.data.after.ref.path,
      });
    } catch (err) {
      logger.error('[stockAlerts] Error enviando correo', {
        error: err.message,
        stack: err.stack,
      });
    }
  },
);
