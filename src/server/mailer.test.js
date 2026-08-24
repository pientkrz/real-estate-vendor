import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  createTestAccount: vi.fn(),
  getTestMessageUrl: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mocks.createTransport,
    createTestAccount: mocks.createTestAccount,
    getTestMessageUrl: mocks.getTestMessageUrl,
  },
}));

const originalEnv = { ...process.env };

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) delete process.env[key];
  });
  Object.assign(process.env, originalEnv);
});

describe('sendContactEmail', () => {
  it('always sends a property enquiry to the public inbox and every unique attached agent', async () => {
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_USER = 'mailer@example.test';
    process.env.SMTP_PASS = 'not-a-real-password';
    process.env.MAIL_FROM = 'mailer@example.test';
    process.env.MAIL_TO = 'ops@example.test';
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
    mocks.sendMail.mockResolvedValue({});

    const { sendContactEmail } = await import('./mailer.js');
    await sendContactEmail({
      name: 'Test User',
      email: 'sender@example.test',
      message: 'Testowa wiadomość.',
      propertyTitle: 'Willa testowa',
      agentEmails: ['piotrek@globalshome.com', 'PIOTREK@globalshome.com', 'invalid-address'],
      isTest: true,
    });

    expect(mocks.sendMail).toHaveBeenCalledTimes(2);
    expect(mocks.sendMail).toHaveBeenNthCalledWith(1, expect.objectContaining({
      to: ['info@globalshome.com', 'ops@example.test', 'piotrek@globalshome.com'],
      subject: '[TEST] Zapytanie o ofertę: Willa testowa',
      text: expect.stringContaining('[TEST] Nowe zapytanie o nieruchomość'),
    }));
    expect(mocks.sendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({
      to: 'sender@example.test',
      subject: '[TEST] Potwierdzenie otrzymania zapytania — Global S Home',
      text: expect.stringContaining('[TEST] To jest wiadomość testowa'),
    }));
  });
});
