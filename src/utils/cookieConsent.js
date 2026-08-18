// Consent choice is stored client-side only (localStorage) — remembering
// the choice itself is a "strictly necessary" purpose and doesn't require
// its own consent. Category taxonomy matches the one already established on
// the live globalshome.com site (necessary/functional/analytics/
// performance/advertising) for brand consistency, even though today only
// `functional` actually gates anything real (the YouTube property-tour
// embeds) — the other three are forward-looking placeholders, recorded so
// a past choice is already honoured if those categories are ever wired up.
const STORAGE_KEY = 'cookie_consent';
export const CONSENT_CHANGE_EVENT = 'cookie-consent-change';

export const COOKIE_CATEGORIES = [
  {
    key: 'functional',
    label: 'Funkcjonalne',
    description: 'Umożliwiają odtwarzanie materiałów wideo osadzonych z YouTube na stronach ofert nieruchomości. Bez zgody wideo nie zostanie załadowane, a Google/YouTube nie ustawi żadnych plików cookie.',
    active: true,
  },
  {
    key: 'analytics',
    label: 'Analityczne',
    description: 'Pomagają zrozumieć, w jaki sposób odwiedzający korzystają ze strony (liczba wizyt, źródło ruchu itp.). Obecnie nie korzystamy z plików cookie tej kategorii — Twój wybór zostanie zastosowany, jeśli w przyszłości je wprowadzimy.',
    active: false,
  },
  {
    key: 'performance',
    label: 'Wydajnościowe',
    description: 'Służą do analizy kluczowych wskaźników wydajności strony. Obecnie nie korzystamy z plików cookie tej kategorii — Twój wybór zostanie zastosowany, jeśli w przyszłości je wprowadzimy.',
    active: false,
  },
  {
    key: 'advertising',
    label: 'Reklamowe',
    description: 'Służą do wyświetlania spersonalizowanych reklam i analizy skuteczności kampanii. Obecnie nie korzystamy z plików cookie tej kategorii — Twój wybór zostanie zastosowany, jeśli w przyszłości je wprowadzimy.',
    active: false,
  },
];

export const getCookieConsent = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCookieConsent = (choice) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: choice }));
};
