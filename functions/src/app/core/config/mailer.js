// mailer.js
// Configuración centralizada para envío de correos.
// Dos modos de configuración:
//  A) SMTP explícito (host/port)
//     - STOCK_ALERT_MAIL_HOST
//     - STOCK_ALERT_MAIL_PORT (opcional, default 587)
//     - STOCK_ALERT_MAIL_SECURE ("true" para puerto 465)
//  B) Servicio predefinido (ej: Gmail, SendGrid) usando nodemailer 'service'
//     - STOCK_ALERT_MAIL_SERVICE (por ejemplo: 'gmail')
//  Credenciales comunes:
//     - STOCK_ALERT_MAIL_USER
//     - STOCK_ALERT_MAIL_PASS (App Password si es Gmail)
//  Remitente:
//     - STOCK_ALERT_MAIL_FROM (ej: 'Alerta Stock <no-reply@tudominio.com>')
//  Pooling opcional:
//     - STOCK_ALERT_MAIL_POOL=true
//     - STOCK_ALERT_MAIL_MAX_CONN=5
//     - STOCK_ALERT_MAIL_MAX_MSG=100
// Si no se establecen host/service + credenciales, el envío se omite con un warning.
// IMPORTANTE (Gmail): usar App Password y volumen bajo para no violar TOS.

import { logger } from 'firebase-functions';
import nodemailer from 'nodemailer';

import { sanitizeMailHeader } from '../utils/emailContent.util.js';

// Importamos parámetros (defineString / defineSecret) para preferir .value()
// Mantendremos fallback a process.env para compatibilidad con ejecuciones locales sin params.
import {
  MAIL_SERVICE,
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_FROM,
  MAIL_POOL,
  MAIL_MAX_CONN,
  MAIL_MAX_MSG,
  MAIL_USER,
  MAIL_PASS,
} from './secrets.js';

let cachedTransport = null;
let transportVerified = false; // verificación única por instancia

export class MailDeliveryError extends Error {
  constructor(reason, message, cause = null) {
    super(message);
    this.name = 'MailDeliveryError';
    this.reason = reason;
    if (cause) {
      this.cause = cause;
    }
  }
}

export function isMailDeliveryError(error, reason = null) {
  if (!(error instanceof MailDeliveryError)) return false;
  return reason ? error.reason === reason : true;
}

function paramOrEnv(paramDef, envName) {
  try {
    // Algunos params (secrets) usan .value(), otros (defineSecret) exponen .value() asíncrono
    // Aquí asumimos que si existe .value() la usamos; si falla, caemos a env.
    if (paramDef && typeof paramDef.value === 'function') {
      const v = paramDef.value();
      if (v !== undefined && v !== null && String(v).length) return v;
    }
  } catch {
    /* ignore */
  }
  return process.env[envName];
}

async function resolveSecrets() {
  // defineSecret().value() retorna un placeholder si no fue proporcionado; aún así lo usamos.
  // Forzamos lectura para garantizar inyección antes de crear el transport.
  let user, pass;
  try {
    user = MAIL_USER.value();
  } catch {
    user = process.env.STOCK_ALERT_MAIL_USER;
  }
  try {
    pass = MAIL_PASS.value();
  } catch {
    pass = process.env.STOCK_ALERT_MAIL_PASS;
  }
  return { user, pass };
}

async function buildTransport() {
  const { user, pass } = await resolveSecrets();
  const host = paramOrEnv(MAIL_HOST, 'STOCK_ALERT_MAIL_HOST');
  const portStr = paramOrEnv(MAIL_PORT, 'STOCK_ALERT_MAIL_PORT');
  const secureStr = paramOrEnv(MAIL_SECURE, 'STOCK_ALERT_MAIL_SECURE');
  const service = paramOrEnv(MAIL_SERVICE, 'STOCK_ALERT_MAIL_SERVICE');
  const poolStr = paramOrEnv(MAIL_POOL, 'STOCK_ALERT_MAIL_POOL');
  const maxConnStr = paramOrEnv(MAIL_MAX_CONN, 'STOCK_ALERT_MAIL_MAX_CONN');
  const maxMsgStr = paramOrEnv(MAIL_MAX_MSG, 'STOCK_ALERT_MAIL_MAX_MSG');

  if (!user || !pass) {
    logger.warn(
      '[mailer] Falta MAIL_USER o MAIL_PASS (secrets). Se omite envío.',
    );
    return null;
  }

  const pool = /^true$/i.test(poolStr || '');
  const maxConnections = Number(maxConnStr) || undefined;
  const maxMessages = Number(maxMsgStr) || undefined;

  const common = {
    auth: { user, pass },
    pool,
    maxConnections,
    maxMessages,
    disableFileAccess: true,
    disableUrlAccess: true,
  };

  if (service) {
    try {
      return nodemailer.createTransport({ service, ...common });
    } catch (err) {
      logger.error('[mailer] Error creando transport por service', {
        service,
        error: String(err?.message || err),
      });
      return null;
    }
  }

  if (!host) {
    logger.warn(
      '[mailer] No hay MAIL_HOST ni MAIL_SERVICE definidos. Envío deshabilitado.',
    );
    return null;
  }

  const port = Number(portStr) || 587;
  const secure = /^true$/i.test(secureStr || '') || port === 465;

  try {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      ...common,
    });
  } catch (err) {
    logger.error('[mailer] Error creando transport SMTP', {
      host,
      port,
      error: String(err?.message || err),
    });
    return null;
  }
}

export async function getTransport() {
  if (cachedTransport) return cachedTransport;
  cachedTransport = await buildTransport();
  return cachedTransport;
}

/**
 * Envía correo con soporte opcional de adjuntos.
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 * @param {string} [opts.from]
 * @param {Array<{ filename: string, content: Buffer|string, contentType?: string }>} [opts.attachments]
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
  from: overrideFrom,
  attachments,
}) {
  const transport = await getTransport();
  if (!transport) {
    logger.warn('[mailer] No se envía correo: transport nulo');
    return { skipped: true };
  }

  // Verificación opcional (una vez) — ayuda a detectar config mala temprano.
  if (!transportVerified) {
    try {
      await transport.verify(); // comprueba resolución DNS, handshake y auth
      logger.info('[mailer] Transport verified OK');
    } catch (err) {
      logger.warn('[mailer] Transport verify failed, intentando enviar igual', {
        error: String(err?.message || err),
      });
    } finally {
      transportVerified = true; // evitar reintentos en caliente
    }
  }

  // FROM preferimos param MAIL_FROM; fallback env / user
  let fromEnv;
  try {
    fromEnv = MAIL_FROM.value();
  } catch {
    fromEnv = process.env.STOCK_ALERT_MAIL_FROM;
  }
  const userEnv = sanitizeMailHeader(process.env.STOCK_ALERT_MAIL_USER); // ya tenemos user, pero para no exponer secrets nuevamente

  const from =
    sanitizeMailHeader(overrideFrom) ||
    sanitizeMailHeader(fromEnv) ||
    (userEnv
      ? `Stock Alerts <${userEnv}>`
      : 'Stock Alerts <no-reply@example.com>');

  // Normaliza destinatarios a arreglo limpio
  const list = Array.isArray(to)
    ? to
    : String(to || '')
      .split(',')
      .map((s) => sanitizeMailHeader(s))
      .filter(Boolean);

  const finalTo = list.join(',');
  const finalSubject = sanitizeMailHeader(subject);

  const info = await transport.sendMail({
    from,
    to: finalTo,
    subject: finalSubject,
    html,
    text,
    attachments,
  });
  logger.info('[mailer] Correo enviado', {
    messageId: info.messageId,
    to: list,
    subject: finalSubject,
  });
  return info;
}

export async function sendRequiredMail(
  mailOptions,
  { logMessage = '[mailer] Error enviando correo', logContext = {} } = {},
) {
  const transport = await getTransport();
  if (!transport) {
    throw new MailDeliveryError(
      'transport-unavailable',
      'Servicio de correo no configurado.',
    );
  }

  try {
    const info = await sendMail(mailOptions);
    if (info?.skipped) {
      throw new MailDeliveryError(
        'transport-unavailable',
        'Servicio de correo no configurado.',
      );
    }
    return info;
  } catch (error) {
    if (isMailDeliveryError(error)) {
      throw error;
    }

    logger.error(logMessage, {
      ...logContext,
      error: String(error?.message || error),
    });
    throw new MailDeliveryError(
      'send-failed',
      'No se pudo enviar el correo.',
      error,
    );
  }
}
