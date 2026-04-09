import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';
import { clientSeedBusinessWithUsers } from '../../../versions/v2/auth/controllers/clientAuth.controller.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

const AI_AGENT_REGION = 'us-central1';
const ALLOWED_ROLES = new Set(['admin', 'owner', 'manager', 'cashier', 'buyer']);
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const readObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const readUsersArray = (value) =>
  Array.isArray(value)
    ? value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    : [];

const addLog = (logs, msg, type = 'info') => {
  logs.push({ msg, type });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const attachRecoverableError = (error, payload) => {
  error.agentRecoverable = {
    retryable: true,
    ...payload,
  };
  return error;
};

const makeRecoverableHttpsError = (code, message, payload) =>
  attachRecoverableError(new HttpsError(code, message), payload);

const normalizeUsernameSegment = (value) => {
  const text = readString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^-+|-+$/g, '');

  return text.slice(0, 24);
};

const uniqueNonEmpty = (values) => [...new Set(values.filter(Boolean))];

const buildUsernameSuggestions = ({ username, businessName, realName }) => {
  const baseUser = normalizeUsernameSegment(username) || 'usuario';
  const businessSlug = normalizeUsernameSegment(businessName);
  const realNameSlug = normalizeUsernameSegment(realName);

  const candidates = uniqueNonEmpty([
    businessSlug ? `${businessSlug}.${baseUser}` : '',
    businessSlug ? `${baseUser}-${businessSlug}` : '',
    businessSlug ? `${businessSlug}-${baseUser}` : '',
    realNameSlug && businessSlug ? `${realNameSlug}-${businessSlug}` : '',
    realNameSlug ? realNameSlug : '',
    `${baseUser}-1`,
    `${baseUser}-2`,
  ])
    .filter((candidate) => candidate !== baseUser)
    .map((candidate) => candidate.slice(0, 32));

  return candidates.slice(0, 5);
};

const buildRecoverableExecuteResponse = ({
  logs,
  error,
  rawActionData,
  business,
  users,
}) => {
  const recoverable = error?.agentRecoverable;
  if (!recoverable) return null;

  addLog(logs, recoverable.message || 'Se requiere una corrección para continuar.', 'warning');
  if (recoverable.clarificationQuestion) {
    addLog(logs, `🤖 ${recoverable.clarificationQuestion}`, 'info');
  }
  if (Array.isArray(recoverable.suggestions) && recoverable.suggestions.length > 0) {
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

const ensureAgentUsernamesAvailable = async ({ users, business }) => {
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const username = readString(user?.name).toLowerCase();
    if (!username) continue;

    const existingSnap = await db
      .collection('users')
      .where('name', '==', username)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const suggestions = buildUsernameSuggestions({
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
          field: `users[${index}].name`,
          value: username,
          suggestions,
          clarificationQuestion:
            suggestions.length > 0
              ? `El usuario "${username}" ya existe. ¿Cuál prefieres? ${suggestions
                  .slice(0, 3)
                  .join(', ')}`
              : `El usuario "${username}" ya existe. Indícame otro nombre de usuario para ${user?.realName || username}.`,
          suggestedUserPrompt:
            suggestions[0]
              ? `Usa "${suggestions[0]}" para ${user?.realName || username} y conserva el resto igual.`
              : `Cambia el username "${username}" por uno disponible y conserva el resto igual.`,
        },
      );
    }
  }
};

const ensureAgentEmailsAvailable = async ({ users }) => {
  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const email = readString(user?.email).toLowerCase();
    if (!email) continue;

    const existingSnap = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      throw makeRecoverableHttpsError(
        'already-exists',
        `Ya existe un usuario con el correo ${email}.`,
        {
          code: 'EMAIL_ALREADY_EXISTS',
          message: `El correo ${email} ya está registrado.`,
          field: `users[${index}].email`,
          value: email,
          clarificationQuestion:
            `El correo ${email} ya existe. ¿Quieres cambiar ese correo o dejar el usuario sin correo?`,
          suggestedUserPrompt:
            `Cambia el correo ${email} por uno disponible o elimínalo de ese usuario. Conserva el resto igual.`,
        },
      );
    }
  }
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
    throw makeRecoverableHttpsError('invalid-argument', 'Todos los usuarios requieren name.', {
      code: 'USERNAME_REQUIRED',
      message: 'Falta el nombre de usuario (username) de uno de los usuarios.',
      field: invalidIndex >= 0 ? `users[${invalidIndex}].name` : 'users',
      clarificationQuestion:
        'Falta un nombre de usuario. Indícame el username o el nombre real del usuario faltante para generarlo.',
      suggestedUserPrompt:
        'Completa el username faltante y conserva el resto igual.',
    });
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
  actionData,
  isTestMode,
}) => {
  const logs = [];
  let business = {};
  let users = [];
  let rawActionData = readObject(actionData);

  try {
    const normalized = normalizeCreateBusinessPayload(actionData, logs);
    business = normalized.business;
    users = normalized.users;
    rawActionData = normalized.rawActionData;

    addLog(logs, `🔍 Iniciando registro de "${business.name || ''}"...`, 'info');

    // Mantener modo prueba lo más parecido posible al modo real:
    // validamos conflictos comunes (usernames/correos existentes) antes de simular.
    await ensureAgentUsernamesAvailable({ users, business });
    await ensureAgentEmailsAvailable({ users });

    let businessId = '';
    if (isTestMode) {
      await sleep(800);
      businessId = `simulated_id_${Math.random().toString(36).slice(2, 6)}`;
      addLog(logs, `✅ Negocio simulado ID: ${businessId}`, 'success');
      for (const user of users) {
        await sleep(400);
        addLog(logs, `✅ Usuario simulado: ${user.name || ''} (${user.role})`, 'success');
      }
    } else {
      const sessionToken = readString(readObject(request.data).sessionToken);
      if (!sessionToken) {
        throw new HttpsError(
          'permission-denied',
          'sessionToken requerido para ejecutar create_business en el agente.',
        );
      }
      addLog(logs, '🧩 Ejecutando creación atómica (negocio + usuarios)...', 'info');

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
        throw new HttpsError('internal', 'Respuesta inválida: no se recibió businessId.');
      }
      addLog(logs, `✅ Negocio creado ID: ${businessId}`, 'success');
      users.forEach((user) => {
        addLog(logs, `✅ Usuario creado: ${user.name || ''} (${user.role})`, 'success');
      });
    }

    return {
      ok: true,
      action: 'create_business',
      logs,
      data: {
        ...rawActionData,
        business,
        users,
        createdBusinessId: businessId,
      },
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      const duplicateEmailMatch =
        typeof error.message === 'string'
          ? error.message.match(/Ya existe un usuario con el correo\s+(.+?)\.?$/i)
          : null;
      const duplicateUsernameGeneric =
        typeof error.message === 'string' &&
        /usuario con este nombre/i.test(error.message);

      if (duplicateEmailMatch?.[1]) {
        error = attachRecoverableError(error, {
          code: 'EMAIL_ALREADY_EXISTS',
          message: `El correo ${duplicateEmailMatch[1]} ya está registrado.`,
          field: 'users.email',
          value: duplicateEmailMatch[1],
          clarificationQuestion:
            `El correo ${duplicateEmailMatch[1]} ya existe. ¿Quieres cambiar ese correo o dejar el usuario sin correo?`,
          suggestedUserPrompt:
            `Cambia el correo ${duplicateEmailMatch[1]} por uno disponible o elimínalo de ese usuario. Conserva el resto igual.`,
        });
      } else if (duplicateUsernameGeneric && Array.isArray(users) && users.length > 0) {
        const user = users[0];
        const username = readString(user?.name).toLowerCase();
        error = attachRecoverableError(error, {
          code: 'USERNAME_ALREADY_EXISTS',
          message: username
            ? `El nombre de usuario "${username}" ya existe o se ocupó durante el proceso.`
            : 'Un nombre de usuario ya existe o se ocupó durante el proceso.',
          field: username ? 'users[0].name' : 'users',
          value: username || undefined,
          suggestions: buildUsernameSuggestions({
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
      error,
      rawActionData,
      business,
      users,
    });
    if (recoverableResponse) {
      return recoverableResponse;
    }

    throw error;
  }
};

export const aiBusinessSeedingAgentExecute = onCall(
  {
    region: AI_AGENT_REGION,
    timeoutSeconds: 180,
    memory: '512MiB',
    enforceAppCheck: false,
  },
  async (request) => {
    await assertAiBusinessSeedingDeveloperAccess(request);

    const payload = readObject(request.data);
    const actionId = readString(payload.actionId);
    const actionData = payload.actionData;
    const isTestMode = payload.isTestMode === true;

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
        actionData,
        isTestMode,
      });
    }

    throw new HttpsError('invalid-argument', `Acción no soportada: ${actionId}`);
  },
);
