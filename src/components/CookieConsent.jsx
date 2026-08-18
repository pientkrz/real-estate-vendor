import React, { useEffect, useState } from 'react';
import { COOKIE_CATEGORIES, getCookieConsent, setCookieConsent } from '../utils/cookieConsent';

const defaultDraft = () => Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.key, false]));

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => getCookieConsent() === null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [draft, setDraft] = useState(defaultDraft);

  useEffect(() => {
    // Lets the footer's "Ustawienia cookies" link reopen this panel (in its
    // detailed form, pre-filled with the current choice) without needing
    // Footer.jsx itself to be a hydrated island.
    const handleReopen = (e) => {
      if (!e.target.closest('[data-open-cookie-settings]')) return;
      e.preventDefault();
      setDraft({ ...defaultDraft(), ...getCookieConsent() });
      setShowDetails(true);
      setVisible(true);
    };
    document.addEventListener('click', handleReopen);
    return () => document.removeEventListener('click', handleReopen);
  }, []);

  const close = () => {
    setVisible(false);
    setShowDetails(false);
    setExpandedKey(null);
  };

  const acceptAll = () => {
    setCookieConsent(Object.fromEntries(COOKIE_CATEGORIES.map((c) => [c.key, true])));
    close();
  };

  const rejectAll = () => {
    setCookieConsent(defaultDraft());
    close();
  };

  const openDetails = () => {
    setDraft({ ...defaultDraft(), ...getCookieConsent() });
    setShowDetails(true);
  };

  const savePreferences = () => {
    setCookieConsent(draft);
    close();
  };

  if (!visible) return null;

  if (!showDetails) {
    return (
      <div className="fixed bottom-6 left-6 z-[10000] w-[min(22rem,calc(100vw-3rem))] bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-6 space-y-4">
        <h2 className="text-sm font-headline font-bold text-on-surface">Cenimy prywatność użytkowników</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Używamy plików cookie niezbędnych do działania strony oraz, za Twoją zgodą, plików umożliwiających odtwarzanie wideo z YouTube i inne funkcje. Więcej informacji znajdziesz w{' '}
          <a href={`${import.meta.env.BASE_URL}privacy-policy`} className="text-primary underline hover:opacity-70 transition-opacity">
            Polityce Prywatności
          </a>.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openDetails}
            className="border border-outline/30 text-on-surface px-4 py-2.5 text-[11px] font-label uppercase tracking-widest hover:bg-surface-container-low transition-colors"
          >
            Dostosuj
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="border border-outline/30 text-on-surface px-4 py-2.5 text-[11px] font-label uppercase tracking-widest hover:bg-surface-container-low transition-colors"
          >
            Odrzuć
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="editorial-gradient text-on-primary px-4 py-2.5 text-[11px] font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Akceptuj wszystkie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-obsidian/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface shadow-2xl p-8 space-y-6">
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-lg font-headline font-bold text-on-surface">Dostosuj preferencje dotyczące zgody</h2>
          <button type="button" onClick={close} aria-label="Zamknij" className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Poniżej znajdują się szczegółowe informacje o poszczególnych kategoriach plików cookie. Kategorię „Niezbędne” stosujemy zawsze — pozostałe włączysz według własnych preferencji.
        </p>

        <div className="divide-y divide-outline/10 border-y border-outline/10">
          <div className="py-4 flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-on-surface">Niezbędne</p>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-xl">
                Krytyczne dla podstawowego działania strony (m.in. zapamiętanie Twojego wyboru w tym panelu) — witryna nie zadziała poprawnie bez nich. Nie przechowują danych umożliwiających identyfikację osoby.
              </p>
            </div>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant shrink-0 pt-1">Zawsze aktywne</span>
          </div>

          {COOKIE_CATEGORIES.map((cat) => (
            <div key={cat.key} className="py-4">
              <button
                type="button"
                onClick={() => setExpandedKey(expandedKey === cat.key ? null : cat.key)}
                className="w-full flex items-center justify-between gap-6 text-left"
              >
                <span className="text-sm font-semibold text-on-surface">{cat.label}</span>
                <span className="flex items-center gap-4 shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    {expandedKey === cat.key ? 'expand_less' : 'expand_more'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer w-10 h-6" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={draft[cat.key]}
                      onChange={(e) => setDraft({ ...draft, [cat.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <span className="absolute inset-0 rounded-full bg-outline/20 peer-checked:bg-primary transition-colors" />
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full transition-transform peer-checked:translate-x-4" />
                  </label>
                </span>
              </button>
              {expandedKey === cat.key && (
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-xl">{cat.description}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={rejectAll}
            className="border border-outline/30 text-on-surface px-5 py-2.5 text-[11px] font-label uppercase tracking-widest hover:bg-surface-container-low transition-colors"
          >
            Odrzuć
          </button>
          <button
            type="button"
            onClick={savePreferences}
            className="border border-outline/30 text-on-surface px-5 py-2.5 text-[11px] font-label uppercase tracking-widest hover:bg-surface-container-low transition-colors"
          >
            Zapisz moje preferencje
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="editorial-gradient text-on-primary px-5 py-2.5 text-[11px] font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Akceptuj wszystkie
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
