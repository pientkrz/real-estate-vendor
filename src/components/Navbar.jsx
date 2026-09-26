import React, { useEffect, useRef, useState } from 'react';

const navigationItems = [
  { label: 'Nieruchomości', path: '' },
  { label: 'Blog', path: 'blog' },
  { label: 'O Nas', path: 'o-nas' },
  { label: 'Kontakt', path: 'kontakt' },
];

const getFocusableElements = (element) => (
  [...element.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((item) => !item.hasAttribute('aria-hidden'))
);

const joinBasePath = (base, path) => `${base}${path}`;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const wasMenuOpenRef = useRef(false);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const isActive = (path) => {
    const href = joinBasePath(base, path);
    const normalizedPath = currentPath.replace(/\/$/, '');
    const normalizedHref = href.replace(/\/$/, '');
    if (path === '') return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/property/`);
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  };

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) {
      if (wasMenuOpenRef.current) menuButtonRef.current?.focus();
      wasMenuOpenRef.current = false;
      return undefined;
    }

    wasMenuOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuPanelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !menuPanelRef.current) return;

      const focusable = getFocusableElements(menuPanelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [isMenuOpen]);

  // z-[9999], not z-50: Leaflet's own panes/markers/tiles use z-index
  // values up to ~1300 and aren't isolated into their own stacking
  // context, so once the page scrolls they can visually paint over a
  // merely-z-50 fixed header.
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[9999] overflow-x-hidden bg-surface">
        <nav className="flex min-w-0 items-center justify-between px-5 py-4 sm:px-8 sm:py-5 lg:px-12 lg:py-6 max-w-screen-2xl mx-auto">
          <a
            href={base}
            className="whitespace-nowrap text-xl font-bold tracking-tighter text-amber-800 font-headline sm:text-2xl"
          >
            Global S Home
          </a>
          <div className="hidden md:flex items-center space-x-12">
            {navigationItems.map((item) => (
              <a
                key={item.path || 'home'}
                className="text-stone-600 hover:text-stone-900 font-headline transition-colors duration-300 ease-in-out"
                href={joinBasePath(base, item.path)}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            <a
              href={joinBasePath(base, 'kontakt')}
              className="editorial-gradient inline-block rounded-lg px-4 py-2 text-sm font-semibold tracking-tight text-on-primary transition-transform active:scale-95 text-center sm:px-8 sm:py-3 sm:text-base"
            >
              Zapytaj Teraz
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center text-on-surface md:hidden"
              aria-label={isMenuOpen ? 'Zamknij menu nawigacji' : 'Otwórz menu nawigacji'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[10000] bg-obsidian/40 md:hidden"
            aria-label="Zamknij menu nawigacji"
            onClick={closeMenu}
          />
          <aside
            id="mobile-navigation"
            ref={menuPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-[10001] flex w-[min(22rem,88vw)] flex-col bg-surface p-6 shadow-2xl md:hidden"
          >
            <div className="mb-10 flex items-center justify-between">
              <h2 id="mobile-navigation-title" className="font-headline text-xl font-bold text-on-surface">
                Menu
              </h2>
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center text-on-surface-variant hover:text-primary"
                aria-label="Zamknij menu nawigacji"
                onClick={closeMenu}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <nav aria-label="Nawigacja mobilna" className="flex flex-col gap-2">
              {navigationItems.map((item) => (
                <a
                  key={item.path || 'home'}
                  href={joinBasePath(base, item.path)}
                  onClick={closeMenu}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={`rounded-sm px-3 py-3 font-headline text-lg transition-colors ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-low hover:text-primary'}`}
                >
                  {item.label}
                </a>
              ))}
              <a
                href={joinBasePath(base, 'kontakt')}
                onClick={closeMenu}
                className="editorial-gradient mt-6 rounded-lg px-4 py-3 text-center font-headline text-lg font-semibold text-on-primary"
              >
                Zapytaj Teraz
              </a>
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Navbar;
