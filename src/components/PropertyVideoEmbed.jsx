import React, { useSyncExternalStore } from 'react';
import { CONSENT_CHANGE_EVENT, getCookieConsent } from '../utils/cookieConsent';

const subscribeToConsent = (callback) => {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
};
const getConsentSnapshot = () => getCookieConsent()?.functional === true;
// This component is mounted with client:load (unlike the client:only
// CookieConsent banner), so it's server-rendered first and the server can
// never see localStorage — the server snapshot must be false to match that
// SSR output, otherwise a returning visitor with consent already granted
// would hydrate straight to the iframe and mismatch the server's placeholder.
const getServerConsentSnapshot = () => false;

// YouTube's standard embed domain (youtube.com, not youtube-nocookie.com)
// sets third-party cookies as soon as the iframe loads — so the iframe
// itself must not render until the visitor has consented to the
// "Funkcjonalne" cookie category.
const PropertyVideoEmbed = ({ embedUrl }) => {
  const allowed = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerConsentSnapshot);

  if (allowed) {
    return (
      <iframe
        src={embedUrl}
        title="Property video tour"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-surface-container-low text-center px-6 py-16">
      <span className="material-symbols-outlined text-4xl text-primary">smart_display</span>
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
        To wideo pochodzi z YouTube i wymaga Twojej zgody na pliki cookie z kategorii „Funkcjonalne”.
      </p>
      <button
        type="button"
        data-open-cookie-settings
        className="editorial-gradient text-on-primary px-6 py-3 text-xs font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
      >
        Zarządzaj zgodą na cookies
      </button>
    </div>
  );
};

export default PropertyVideoEmbed;
