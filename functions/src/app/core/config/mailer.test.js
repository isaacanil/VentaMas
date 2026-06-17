import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions', () => ({
  logger: mocks.logger,
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: (...args) => mocks.createTransport(...args),
  },
}));

vi.mock('./secrets.js', () => {
  const fromEnv = (name) => ({
    value: () => process.env[name],
  });

  return {
    MAIL_FROM: fromEnv('STOCK_ALERT_MAIL_FROM'),
    MAIL_HOST: fromEnv('STOCK_ALERT_MAIL_HOST'),
    MAIL_MAX_CONN: fromEnv('STOCK_ALERT_MAIL_MAX_CONN'),
    MAIL_MAX_MSG: fromEnv('STOCK_ALERT_MAIL_MAX_MSG'),
    MAIL_PASS: fromEnv('STOCK_ALERT_MAIL_PASS'),
    MAIL_POOL: fromEnv('STOCK_ALERT_MAIL_POOL'),
    MAIL_PORT: fromEnv('STOCK_ALERT_MAIL_PORT'),
    MAIL_SECURE: fromEnv('STOCK_ALERT_MAIL_SECURE'),
    MAIL_SERVICE: fromEnv('STOCK_ALERT_MAIL_SERVICE'),
    MAIL_USER: fromEnv('STOCK_ALERT_MAIL_USER'),
  };
});

const MAIL_ENV_KEYS = [
  'STOCK_ALERT_MAIL_FROM',
  'STOCK_ALERT_MAIL_HOST',
  'STOCK_ALERT_MAIL_MAX_CONN',
  'STOCK_ALERT_MAIL_MAX_MSG',
  'STOCK_ALERT_MAIL_PASS',
  'STOCK_ALERT_MAIL_POOL',
  'STOCK_ALERT_MAIL_PORT',
  'STOCK_ALERT_MAIL_SECURE',
  'STOCK_ALERT_MAIL_SERVICE',
  'STOCK_ALERT_MAIL_USER',
];

const importMailer = async () => {
  vi.resetModules();
  return import('./mailer.js');
};

describe('mailer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MAIL_ENV_KEYS.forEach((key) => {
      delete process.env[key];
    });
  });

  it('fails required delivery when transport is unavailable', async () => {
    const { sendRequiredMail } = await importMailer();

    await expect(
      sendRequiredMail({
        to: 'owner@example.com',
        subject: 'Aviso',
        text: 'Contenido',
      }),
    ).rejects.toMatchObject({
      name: 'MailDeliveryError',
      reason: 'transport-unavailable',
    });
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });

  it('uses existing sendMail behavior for required delivery', async () => {
    process.env.STOCK_ALERT_MAIL_SERVICE = 'gmail';
    process.env.STOCK_ALERT_MAIL_USER = 'alerts@example.com';
    process.env.STOCK_ALERT_MAIL_PASS = 'secret';
    process.env.STOCK_ALERT_MAIL_FROM = 'VentaMax <alerts@example.com>';

    const transport = {
      sendMail: vi.fn(async () => ({ messageId: 'message-1' })),
      verify: vi.fn(async () => undefined),
    };
    mocks.createTransport.mockReturnValue(transport);

    const { sendRequiredMail } = await importMailer();
    const info = await sendRequiredMail({
      to: ' owner@example.com ',
      subject: 'PIN\r\nVentaMax',
      text: 'Contenido',
    });

    expect(info).toEqual({ messageId: 'message-1' });
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          user: 'alerts@example.com',
          pass: 'secret',
        },
        service: 'gmail',
      }),
    );
    expect(transport.verify).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'VentaMax <alerts@example.com>',
        subject: 'PIN VentaMax',
        text: 'Contenido',
        to: 'owner@example.com',
      }),
    );
  });

  it('logs and wraps send failures', async () => {
    process.env.STOCK_ALERT_MAIL_SERVICE = 'gmail';
    process.env.STOCK_ALERT_MAIL_USER = 'alerts@example.com';
    process.env.STOCK_ALERT_MAIL_PASS = 'secret';

    const transport = {
      sendMail: vi.fn(async () => {
        throw new Error('smtp down');
      }),
      verify: vi.fn(async () => undefined),
    };
    mocks.createTransport.mockReturnValue(transport);

    const { sendRequiredMail } = await importMailer();

    await expect(
      sendRequiredMail(
        {
          to: 'owner@example.com',
          subject: 'Aviso',
          text: 'Contenido',
        },
        {
          logContext: { targetUserId: 'user-1' },
          logMessage: '[pinAuth] Error enviando PIN por correo',
        },
      ),
    ).rejects.toMatchObject({
      name: 'MailDeliveryError',
      reason: 'send-failed',
    });
    expect(mocks.logger.error).toHaveBeenCalledWith(
      '[pinAuth] Error enviando PIN por correo',
      {
        error: 'smtp down',
        targetUserId: 'user-1',
      },
    );
  });
});
