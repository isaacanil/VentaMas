import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { clientSeedBusinessWithUsers } from '../../../versions/v2/auth/controllers/clientAuth.controller.js';
import { buildAiAgentCallableOptions } from '../config/aiCallableOptions.js';
import {
  chunkAvailabilityValues,
  findFirstMatchingAvailabilityValue,
  normalizeAvailabilityValues,
} from '../utils/aiBusinessSeedingAvailability.js';
import {
  buildAiBusinessSeedingExecutionRequestHash,
  normalizeAiBusinessSeedingExecuteRequestId,
} from '../utils/aiBusinessSeedingExecutionIdempotency.js';
import {
  readAiBusinessSeedingString as readString,
} from '../utils/aiBusinessSeedingText.util.js';
import {
  readAiCallableObject as readObject,
} from '../utils/aiCallablePayload.util.js';
import { buildAiBusinessSeedingUsernameSuggestions } from '../utils/aiBusinessSeedingUsernameSuggestions.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

const ALLOWED_ROLES = new Set([
  'admin',
  'owner',
  'manager',
  'cashier',
  'buyer',
]);
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const IDEMPOTENCY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const readUsersArray = (value) =>
  Array.isArray(value)
    ? value.filter(
        (entry) => entry && typeof entry === 'object' && !Array.isArray(entry),
      )
    : [];

const addLog = (logs, msg, type = 'info') => {
  logs.push({ msg, type });
};

const sleep = (ms) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const attachRecoverableError = (error, payload) => {
  error.agentRecoverable = {
    retryable: true,
    ...payload,
  };
  return error;
};

const makeRecoverableHttpsError = (code, message, payload) =>
  attachRecoverableError(new HttpsError(code, message), payload);

const buildRecoverableExecuteResponse = ({
  logs,
  error,
  rawActionData,
  business,
  users,
}) => {
  const recoverable = error?.agentRecoverable;
  if (!recoverable) return null;

  addLog(
    logs,
    recoverable.message || 'Se requiere una corrección para continuar.',
    'warning',
  );
  if (recoverable.clarificationQuestion) {
    addLog(logs, `🤖 ${recoverable.clarificationQuestion}`, 'info');
  }
  if (
    Array.isArray(recoverable.suggestions) &&
    recoverable.suggestions.length > 0
  ) {
    addLog(logs, `Sugerencias: ${recoverable.suggestions.join(', ')}`, 'info');
  }

  return {
    ok: false,
    action: 'create_business',
    logs,
    error: recoverable,
    data: {
      ...readObject(rawActionData),
      ...(Object.keys(readObject(business)).length ? { business } : {}),
      ...(Array.isArray(users) && users.length ? { users } : {}),
    },
  };
};

const maybeExtractRecoverableErrorResponse = (params) =>
  buildRecoverableExecuteResponse(params);

const buildCreateBusinessSuccessResponse = ({
  logs,
  rawActionData,
  business,
  users,
  businessId,
  reusedExecution = false,
}) => ({
  ok: true,
  action: 'create_business',
  logs: reusedExecution
    ? [
        {
          msg: `Resultado reutilizado por idempotencia: ${businessId}`,
          type: 'info',
        },
        ...logs,
      ]
    : logs,
  data: {
    ...rawActionData,
    business,
    users,
    createdBusinessId: businessId,
  },
  metadata: reusedExecution ? { reusedExecution: true } : undefined,
});

const getExecutionIdempotencyRef = ({ actorUid, executeRequestId }) =>
  db
    .collection('aiBusinessSeedingExecutionRequestActors')
    .doc(actorUid)
    .collection('aiBusinessSeedingExecutionRequestItems')
    .doc(executeRequestId);

const getIdempotencyExpiresAt = () =>
  Timestamp.fromMillis(Date.now() + IDEMPOTENCY_TTL_MS);

const reserveExecutionIdempotency = async ({
  actorUid,
  executeRequestId,
  requestHash,
  actionId,
}) => {
  const requestId =
    normalizeAiBusinessSeedingExecuteRequestId(executeRequestId);

  if (!actorUid || !requestId) {
    return { ref: null, reused: null, requestId: '' };
  }

  const ref = getExecutionIdempotencyRef({
    actorUid,
    executeRequestId: requestId,
  });

  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);

    if (!snap.exists) {
      transaction.set(ref, {
        id: requestId,
        actorUid,
        actionId,
        requestHash,
        status: 'pending',
        attempts: 1,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: getIdempotencyExpiresAt(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { reused: null };
    }

    const existing = readObject(snap.data());
    const storedHash = readString(existing.requestHash);
    if (storedHash && storedHash !== requestHash) {
      throw new HttpsError(
        'already-exists',
        'La llave de idempotencia ya fue utilizada con otro payload.',
      );
    }

    const status = readString(existing.status).toLowerCase();
    if (status === 'completed') {
      const createdBusinessId = readString(existing.createdBusinessId);
      if (createdBusinessId) {
        return { reused: { createdBusinessId } };
      }
      throw new HttpsError(
        'failed-precondition',
        'La ejecucion ya fue completada, pero no tiene businessId registrado.',
      );
    }

    if (status === 'failed') {
      transaction.set(
        ref,
        {
          status: 'pending',
          attempts: FieldValue.increment(1),
          expiresAt: getIdempotencyExpiresAt(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return { reused: null };
    }

    throw new HttpsError(
      'failed-precondition',
      'Esta ejecucion del asistente ya esta en proceso. Espera unos segundos antes de reintentar.',
    );
  });

  return { ref, requestId, reused: result.reused };
};

const completeExecutionIdempotency = async ({ ref, createdBusinessId }) => {
  if (!ref || !createdBusinessId) return;

  await ref.set(
    {
      status: 'completed',
      createdBusinessId,
      completedAt: FieldValue.serverTimestamp(),
      expiresAt: getIdempotencyExpiresAt(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

const failExecutionIdempotency = async ({ ref, error }) => {
  if (!ref) return;

  const errorCode = readString(error?.code) || 'unknown';
  const errorMessage =
    readString(error?.message).slice(0, 500) ||
    'Error desconocido durante la ejecucion.';

  await ref.set(
    {
      status: 'failed',
      errorCode,
      errorMessage,
      expiresAt: getIdempotencyExpiresAt(),
      failedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

const safelyFailExecutionIdempotency = async ({ ref, error }) => {
  try {
    await failExecutionIdempotency({ ref, error });
  } catch {
    // Preserve the original execution error; idempotency failure is diagnostic.
  }
};

const findExistingUserValues = async (field, values) => {
  const normalizedValues = normalizeAvailabilityValues(values);
  if (normalizedValues.length === 0) return new Set();

  const snapshots = await Promise.all(
    chunkAvailabilityValues(normalizedValues).map((chunk) =>
      db.collection('users').where(field, 'in', chunk).get(),
    ),
  );

  const matches = new Set();
  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const value = readString(doc.get(field)).toLowerCase();
      if (value) matches.add(value);
    }
  }

  return matches;
};

const ensureAgentUsernamesAvailable = async ({ users, business }) => {
  const proposedNames = users.map((user) => user?.name);
  const existingNames = await findExistingUserValues('name', proposedNames);
  const duplicate = findFirstMatchingAvailabilityValue(
    proposedNames,
    existingNames,
  );

  if (!duplicate) return;

  const user = users[duplicate.index];
  const username = duplicate.value;
  const suggestions = buildAiBusinessSeedingUsernameSuggestions({
    username,
    businessName: business?.name,
    realName: user?.realName,
  });

  throw makeRecoverableHttpsError(
    'already-exists',
    `El nombre de usuario "${username}" ya existe.`,
    {
      code: 'USERNAME_ALREADY_EXISTS',
      message: `El nombre de usuario "${username}" ya existe.`,
      field: `users[${duplicate.index}].name`,
      value: username,
      suggestions,
      clarificationQuestion:
        suggestions.length > 0
          ? `El usuario "${username}" ya existe. ¿Cuál prefieres? ${suggestions
              .slice(0, 3)
              .join(', ')}`
          : `El usuario "${username}" ya existe. Indícame otro nombre de usuario para ${user?.realName || username}.`,
      suggestedUserPrompt: suggestions[0]
        ? `Usa "${suggestions[0]}" para ${user?.realName || username} y conserva el resto igual.`
        : `Cambia el username "${username}" por uno disponible y conserva el resto igual.`,
    },
  );
};

const ensureAgentEmailsAvailable = async ({ users }) => {
  const proposedEmails = users.map((user) => user?.email);
  const existingEmails = await findExistingUserValues('email', proposedEmails);
  const duplicate = findFirstMatchingAvailabilityValue(
    proposedEmails,
    existingEmails,
  );

  if (!duplicate) return;

  const email = duplicate.value;
  throw makeRecoverableHttpsError(
    'already-exists',
    `Ya existe un usuario con el correo ${email}.`,
    {
      code: 'EMAIL_ALREADY_EXISTS',
      message: `El correo ${email} ya está registrado.`,
      field: `users[${duplicate.index}].email`,
      value: email,
      clarificationQuestion: `El correo ${email} ya existe. ¿Quieres cambiar ese correo o dejar el usuario sin correo?`,
      suggestedUserPrompt: `Cambia el correo ${email} por uno disponible o elimínalo de ese usuario. Conserva el resto igual.`,
    },
  );
};

const makeCompliantPassword = (user) => {
  const seed = `${user.name || user.realName || 'user'}`.trim();
  const alnumSeed = seed.replace(/[^a-zA-Z0-9]/g, '');
  const base = (alnumSeed || 'user').slice(0, 20);
  let candidate = `Vm${base}1`;
  if (candidate.length < 8) candidate = candidate.padEnd(8, 'a');
  if (!PASSWORD_REGEX.test(candidate)) candidate = 'VmAa1122';
  return candidate;
};

const normalizeCreateBusinessPayload = (actionData, logs) => {
  const payload = readObject(actionData);
  const business = readObject(payload.business);
  const usersInput = readUsersArray(payload.users);

  if (!usersInput.length) {
    throw new HttpsError(
      'invalid-argument',
      'Debe incluir al menos un usuario para crear el negocio.',
    );
  }

  const normalizedUsers = usersInput.map((rawUser) => {
    const name = readString(rawUser.name).toLowerCase();
    const roleCandidate = readString(rawUser.role).toLowerCase() || 'admin';
    const role = ALLOWED_ROLES.has(roleCandidate) ? roleCandidate : 'admin';
    return {
      realName: readString(rawUser.realName) || undefined,
      name,
      role,
      email: readString(rawUser.email) || undefined,
      password: readString(rawUser.password) || undefined,
    };
  });

  const invalidNameUser = normalizedUsers.find((user) => !user.name);
  if (invalidNameUser) {
    const invalidIndex = normalizedUsers.findIndex((user) => !user.name);
    throw makeRecoverableHttpsError(
      'invalid-argument',
      'Todos los usuarios requieren name.',
      {
        code: 'USERNAME_REQUIRED',
        message:
          'Falta el nombre de usuario (username) de uno de los usuarios.',
        field: invalidIndex >= 0 ? `users[${invalidIndex}].name` : 'users',
        clarificationQuestion:
          'Falta un nombre de usuario. Indícame el username o el nombre real del usuario faltante para generarlo.',
        suggestedUserPrompt:
          'Completa el username faltante y conserva el resto igual.',
      },
    );
  }

  const ownerUsers = normalizedUsers.filter((user) => user.role === 'owner');
  if (ownerUsers.length === 0) {
    throw makeRecoverableHttpsError(
      'invalid-argument',
      'Debe existir exactamente 1 usuario con rol owner.',
      {
        code: 'OWNER_REQUIRED',
        message: 'Falta definir qué usuario será el owner del negocio.',
        field: 'users',
        clarificationQuestion:
          'Falta el owner. Dime cuál usuario será el dueño (owner) para corregir la propuesta.',
        suggestedUserPrompt:
          'El owner será <nombre del usuario>. Corrige la propuesta y conserva el resto igual.',
      },
    );
  }
  if (ownerUsers.length > 1) {
    throw makeRecoverableHttpsError(
      'invalid-argument',
      'Debe existir exactamente 1 usuario con rol owner.',
      {
        code: 'OWNER_MULTIPLE',
        message: 'Hay más de un usuario con rol owner. Debe quedar solo uno.',
        field: 'users',
        clarificationQuestion:
          'Hay múltiples owner. ¿Cuál usuario debe quedar como owner y a qué rol cambio los demás?',
        suggestedUserPrompt:
          'Deja un solo owner y ajusta los demás roles. Conserva el resto igual.',
      },
    );
  }

  const usersWithPasswords = normalizedUsers.map((user) => {
    if (user.password && PASSWORD_REGEX.test(user.password)) return user;
    const password = makeCompliantPassword(user);
    addLog(
      logs,
      `⚠️ Password inválida para ${user.name || 'usuario'}; se generó automáticamente.`,
      'warning',
    );
    return { ...user, password };
  });

  return {
    business,
    users: usersWithPasswords,
    rawActionData: payload,
  };
};

const runCreateBusinessExecution = async ({
  request,
  actorUid,
  executeRequestId,
  actionData,
  isTestMode,
}) => {
  const logs = [];
  let business = {};
  let users = [];
  let rawActionData = readObject(actionData);
  let idempotency = { ref: null, reused: null };
  let businessId = '';

  try {
    const normalized = normalizeCreateBusinessPayload(actionData, logs);
    business = normalized.business;
    users = normalized.users;
    rawActionData = normalized.rawActionData;

    addLog(
      logs,
      `🔍 Iniciando registro de "${business.name || ''}"...`,
      'info',
    );

    // Mantener modo prueba lo más parecido posible al modo real:
    // validamos conflictos comunes (usernames/correos existentes) antes de simular.
    await ensureAgentUsernamesAvailable({ users, business });
    await ensureAgentEmailsAvailable({ users });

    const requestHash = buildAiBusinessSeedingExecutionRequestHash({
      action: 'create_business',
      isTestMode,
      business,
      users,
    });

    idempotency = await reserveExecutionIdempotency({
      actorUid,
      executeRequestId,
      requestHash,
      actionId: 'create_business',
    });

    if (idempotency.reused?.createdBusinessId) {
      return buildCreateBusinessSuccessResponse({
        logs,
        rawActionData,
        business,
        users,
        businessId: idempotency.reused.createdBusinessId,
        reusedExecution: true,
      });
    }

    if (isTestMode) {
      await sleep(800);
      businessId = `simulated_id_${Math.random().toString(36).slice(2, 6)}`;
      addLog(logs, `✅ Negocio simulado ID: ${businessId}`, 'success');
      for (const user of users) {
        await sleep(400);
        addLog(
          logs,
          `✅ Usuario simulado: ${user.name || ''} (${user.role})`,
          'success',
        );
      }
    } else {
      const sessionToken = readString(readObject(request.data).sessionToken);
      if (!sessionToken) {
        throw new HttpsError(
          'permission-denied',
          'sessionToken requerido para ejecutar create_business en el agente.',
        );
      }
      addLog(
        logs,
        '🧩 Ejecutando creación atómica (negocio + usuarios)...',
        'info',
      );

      if (typeof clientSeedBusinessWithUsers.run !== 'function') {
        throw new HttpsError(
          'internal',
          'No se pudo reutilizar clientSeedBusinessWithUsers.run en el agente.',
        );
      }
      const seedResponse = await clientSeedBusinessWithUsers.run({
        data: {
          business,
          users: users.map((user) => ({
            name: user.name || '',
            password: user.password || makeCompliantPassword(user),
            role: user.role || 'admin',
            realName: user.realName,
            email: user.email,
            active: true,
          })),
          sessionToken,
        },
        auth: request.auth || null,
        app: request.app || null,
        instanceIdToken: null,
        rawRequest: undefined,
        acceptsStreaming: false,
      });

      businessId = readString(seedResponse?.id);
      if (!businessId) {
        throw new HttpsError(
          'internal',
          'Respuesta inválida: no se recibió businessId.',
        );
      }
      addLog(logs, `✅ Negocio creado ID: ${businessId}`, 'success');
      users.forEach((user) => {
        addLog(
          logs,
          `✅ Usuario creado: ${user.name || ''} (${user.role})`,
          'success',
        );
      });
    }

    try {
      await completeExecutionIdempotency({
        ref: idempotency.ref,
        createdBusinessId: businessId,
      });
    } catch {
      addLog(
        logs,
        'No se pudo registrar la idempotencia final; conserva el businessId antes de reintentar.',
        'warning',
      );
    }

    return buildCreateBusinessSuccessResponse({
      logs,
      rawActionData,
      business,
      users,
      businessId,
    });
  } catch (error) {
    let handledError = error;

    if (error instanceof HttpsError) {
      const duplicateEmailMatch =
        typeof error.message === 'string'
          ? error.message.match(
              /Ya existe un usuario con el correo\s+(.+?)\.?$/i,
            )
          : null;
      const duplicateUsernameGeneric =
        typeof error.message === 'string' &&
        /usuario con este nombre/i.test(error.message);

      if (duplicateEmailMatch?.[1]) {
        handledError = attachRecoverableError(error, {
          code: 'EMAIL_ALREADY_EXISTS',
          message: `El correo ${duplicateEmailMatch[1]} ya está registrado.`,
          field: 'users.email',
          value: duplicateEmailMatch[1],
          clarificationQuestion: `El correo ${duplicateEmailMatch[1]} ya existe. ¿Quieres cambiar ese correo o dejar el usuario sin correo?`,
          suggestedUserPrompt: `Cambia el correo ${duplicateEmailMatch[1]} por uno disponible o elimínalo de ese usuario. Conserva el resto igual.`,
        });
      } else if (
        duplicateUsernameGeneric &&
        Array.isArray(users) &&
        users.length > 0
      ) {
        const user = users[0];
        const username = readString(user?.name).toLowerCase();
        handledError = attachRecoverableError(error, {
          code: 'USERNAME_ALREADY_EXISTS',
          message: username
            ? `El nombre de usuario "${username}" ya existe o se ocupó durante el proceso.`
            : 'Un nombre de usuario ya existe o se ocupó durante el proceso.',
          field: username ? 'users[0].name' : 'users',
          value: username || undefined,
          suggestions: buildAiBusinessSeedingUsernameSuggestions({
            username,
            businessName: business?.name,
            realName: user?.realName,
          }),
          clarificationQuestion: username
            ? `El username "${username}" ya no está disponible. Dime cuál deseas usar para continuar.`
            : 'Uno de los usernames ya no está disponible. Dime cuál deseas usar para continuar.',
          suggestedUserPrompt: username
            ? `Cambia el username "${username}" por uno disponible y conserva el resto igual.`
            : 'Cambia el username duplicado por uno disponible y conserva el resto igual.',
        });
      }
    }

    const recoverableResponse = maybeExtractRecoverableErrorResponse({
      logs,
      error: handledError,
      rawActionData,
      business,
      users,
    });
    if (recoverableResponse) {
      await safelyFailExecutionIdempotency({
        ref: businessId ? null : idempotency.ref,
        error: handledError,
      });
      return recoverableResponse;
    }

    await safelyFailExecutionIdempotency({
      ref: businessId ? null : idempotency.ref,
      error: handledError,
    });

    throw handledError;
  }
};

export const aiBusinessSeedingAgentExecute = onCall(
  buildAiAgentCallableOptions({
    timeoutSeconds: 180,
    memory: '512MiB',
  }),
  async (request) => {
    const { uid: actorUid } =
      await assertAiBusinessSeedingDeveloperAccess(request);

    const payload = readObject(request.data);
    const actionId = readString(payload.actionId);
    const actionData = payload.actionData;
    const isTestMode = payload.isTestMode === true;
    const executeRequestId = readString(payload.executeRequestId);

    if (!actionId) {
      throw new HttpsError('invalid-argument', 'actionId es requerido.');
    }

    if (actionId === 'chat') {
      return {
        ok: true,
        action: 'chat',
        logs: [],
        data: readObject(actionData),
      };
    }

    if (actionId === 'create_business') {
      return runCreateBusinessExecution({
        request,
        actorUid,
        executeRequestId,
        actionData,
        isTestMode,
      });
    }

    throw new HttpsError(
      'invalid-argument',
      `Acción no soportada: ${actionId}`,
    );
  },
);
