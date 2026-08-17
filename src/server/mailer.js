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

/**
 * Business notification (to MAIL_TO). Content differs by source:
 * - Property inquiry (propertyTitle present): listing + link, then the
 *   submitter's message under "Treść wiadomości".
 * - Contact form: the qualifying fields (kierunek/cel/budżet/typ, each
 *   optional), then the message under "Treść zapytania".
 * Built as separate line "blocks", each filtered for absent optional
 * fields before joining - keeps blank-line spacing between blocks
 * correct regardless of which optional fields are present (a flat
 * `.filter(Boolean)` over one array would also strip intentional blank
 * lines, since '' is falsy too).
 */
function buildBusinessBody(fields) {
  const { name, email, phone, message, propertyTitle, propertyUrl, direction, purpose, budget, propertyType } = fields;
  const isPropertyInquiry = Boolean(propertyTitle);

  const heading = isPropertyInquiry ? 'Nowe zapytanie o nieruchomość' : 'Nowe zapytanie z formularza kontaktowego';

  const contactBlock = [
    `Imię i nazwisko: ${name}`,
    `E-mail: ${email}`,
    phone && `Telefon: ${phone}`,
  ].filter(Boolean);

  const detailsBlock = isPropertyInquiry
    ? [
        `Nieruchomość: ${propertyTitle}`,
        propertyUrl && `Link: ${propertyUrl}`,
      ].filter(Boolean)
    : [
        direction && `Kierunek: ${direction}`,
        purpose && `Cel zakupu: ${purpose}`,
        budget && `Budżet: ${budget} PLN`,
        propertyType && `Preferowany typ nieruchomości: ${propertyType}`,
      ].filter(Boolean);

  const messageBlock = [
    isPropertyInquiry ? 'Treść wiadomości:' : 'Treść zapytania:',
    message,
  ];

  return [[heading], contactBlock, detailsBlock, messageBlock]
    .filter((block) => block.length > 0)
    .map((block) => block.join('\n'))
    .join('\n\n');
}

/** Confirmation (to the submitter's own email) - acknowledges receipt. */
function buildConfirmationBody({ name, propertyTitle, propertyUrl }) {
  const introLines = propertyTitle
    ? [
        `Dziękujemy za kontakt z Global S Home. Otrzymaliśmy Twoje zapytanie dotyczące oferty: ${propertyTitle}.`,
        propertyUrl && `Szczegóły oferty: ${propertyUrl}`,
      ].filter(Boolean)
    : ['Dziękujemy za kontakt z Global S Home. Otrzymaliśmy Twoje zapytanie.'];

  return [
    [`Dzień dobry${name ? ` ${name}` : ''},`],
    introLines,
    ['Nasz przedstawiciel skontaktuje się z Tobą w ciągu 24 godzin.'],
    ['Pozdrawiamy,', 'Zespół Global S Home'],
  ]
    .map((block) => block.join('\n'))
    .join('\n\n');
}

export async function sendContactEmail(fields) {
  const { name, email, propertyTitle, propertyUrl } = fields;
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
    text: buildConfirmationBody({ name, propertyTitle, propertyUrl }),
  });

  const previewUrls = [businessInfo, confirmationInfo]
    .map((info) => nodemailer.getTestMessageUrl(info))
    .filter(Boolean);
  if (previewUrls.length) {
    console.info('[mailer] Ethereal preview URLs:', previewUrls.join(' | '));
  }

  return { businessInfo, confirmationInfo };
}
