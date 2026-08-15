import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST) {
  try {
    process.loadEnvFile();
  } catch {
    // No local .env file (e.g. on the VPS, where SMTP_* is already exported
    // into the shell before the process starts) - nothing to load.
  }
}

let transporterPromise;

function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        requireTLS: process.env.SMTP_SECURE !== 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }

    const testAccount = await nodemailer.createTestAccount();
    console.info(`[mailer] SMTP_HOST not set - using an Ethereal test account (${testAccount.user})`);
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

function buildBusinessBody({ name, email, phone, message, source, propertyTitle, propertyUrl, direction, purpose, budget, propertyType }) {
  return [
    `Nowe zapytanie ze strony (źródło: ${source})`,
    '',
    `Imię i nazwisko: ${name}`,
    `E-mail: ${email}`,
    phone && `Telefon: ${phone}`,
    propertyTitle && `Nieruchomość: ${propertyTitle}`,
    propertyUrl && `Link: ${propertyUrl}`,
    direction && `Kierunek: ${direction}`,
    purpose && `Cel zakupu: ${purpose}`,
    budget && `Budżet: ${budget} PLN`,
    propertyType && `Preferowany typ nieruchomości: ${propertyType}`,
    '',
    'Treść wiadomości:',
    message,
  ].filter(Boolean).join('\n');
}

function buildConfirmationBody({ name, propertyTitle }) {
  return [
    `Dzień dobry ${name},`,
    '',
    propertyTitle
      ? `Dziękujemy za kontakt z Global S Home. Otrzymaliśmy Twoje zapytanie dotyczące oferty: ${propertyTitle}.`
      : 'Dziękujemy za kontakt z Global S Home. Otrzymaliśmy Twoje zapytanie.',
    'Nasz przedstawiciel skontaktuje się z Tobą wkrótce.',
    '',
    'Pozdrawiamy,',
    'Zespół Global S Home',
  ].join('\n');
}

export async function sendContactEmail(fields) {
  const { name, email, propertyTitle } = fields;
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const to = process.env.MAIL_TO || from;

  const businessInfo = await transporter.sendMail({
    from,
    to,
    replyTo: email,
    subject: propertyTitle ? `Zapytanie o ofertę: ${propertyTitle}` : 'Nowe zapytanie ze strony',
    text: buildBusinessBody(fields),
  });

  const confirmationInfo = await transporter.sendMail({
    from,
    to: email,
    subject: 'Potwierdzenie otrzymania zapytania — Global S Home',
    text: buildConfirmationBody({ name, propertyTitle }),
  });

  const previewUrls = [businessInfo, confirmationInfo]
    .map((info) => nodemailer.getTestMessageUrl(info))
    .filter(Boolean);
  if (previewUrls.length) {
    console.info('[mailer] Ethereal preview URLs:', previewUrls.join(' | '));
  }

  return { businessInfo, confirmationInfo };
}
