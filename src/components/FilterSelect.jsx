import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EMPTY_VALUES = [];
const MOBILE_QUERY = '(max-width: 767px)';

const getFocusableElements = (element) => (
  [...element.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((item) => !item.hasAttribute('aria-hidden'))
);

const readIsMobile = () => (
  typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches
);

const valuesEqual = (left, right) => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => value === right[index]);
  }
  return left === right;
};

/**
 * A controlled filter selector with one interaction model across breakpoints:
 * desktop uses a popover; mobile uses a modal bottom sheet.
 */
const FilterSelect = ({ label, value, options, multiple = false, onApply, summary }) => {
  const generatedId = useId();
  const panelId = `filter-select-${generatedId.replace(/:/g, '')}`;
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const firstOptionRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [panelPosition, setPanelPosition] = useState(null);
  const titleId = `${panelId}-title`;

  const normalizedValue = multiple ? (Array.isArray(value) ? value : EMPTY_VALUES) : (value ?? '');

  useEffect(() => {
    if (!isOpen) setDraftValue(normalizedValue);
  }, [isOpen, normalizedValue]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener?.('change', updateViewport);
    mediaQuery.addListener?.(updateViewport);

    return () => {
      mediaQuery.removeEventListener?.('change', updateViewport);
      mediaQuery.removeListener?.(updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };
    const closeDesktopPopover = (event) => {
      const clickedTrigger = triggerRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);
      if (!isMobile && !clickedTrigger && !clickedPanel) {
        setIsOpen(false);
      }
    };
    const trapMobileFocus = (event) => {
      if (!isMobile || event.key !== 'Tab' || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
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

    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeDesktopPopover);
    document.addEventListener('keydown', trapMobileFocus);
    (isMobile ? closeButtonRef.current : firstOptionRef.current)?.focus();
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeDesktopPopover);
      document.removeEventListener('keydown', trapMobileFocus);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen || isMobile) {
      setPanelPosition(null);
      return undefined;
    }

    const updatePanelPosition = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const gap = 8;
      const viewportPadding = 8;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = window.innerHeight;
      const fitsBelow = triggerRect.bottom + gap + panelRect.height <= viewportHeight - viewportPadding;
      const fitsAbove = triggerRect.top - gap - panelRect.height >= viewportPadding;
      const top = fitsBelow || !fitsAbove
        ? Math.min(triggerRect.bottom + gap, viewportHeight - panelRect.height - viewportPadding)
        : triggerRect.top - panelRect.height - gap;
      const left = Math.min(
        Math.max(viewportPadding, triggerRect.left),
        Math.max(viewportPadding, viewportWidth - panelRect.width - viewportPadding),
      );

      setPanelPosition({
        top: Math.max(viewportPadding, top),
        left,
      });
    };

    updatePanelPosition();
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (isOpen || !previouslyFocusedRef.current) return;
    previouslyFocusedRef.current.focus?.();
    previouslyFocusedRef.current = null;
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const apply = () => {
    if (!valuesEqual(draftValue, normalizedValue)) onApply(draftValue);
    close();
  };
  const choose = (optionValue) => {
    if (multiple) {
      setDraftValue((current) => {
        const values = Array.isArray(current) ? current : [];
        return values.includes(optionValue)
          ? values.filter((value) => value !== optionValue)
          : [...values, optionValue];
      });
      return;
    }
    setDraftValue(optionValue);
  };

  const optionList = (
    <div className="space-y-1" role={multiple ? 'group' : 'radiogroup'} aria-label={label}>
      {options.map((option, index) => {
        const checked = multiple
          ? (Array.isArray(draftValue) && draftValue.includes(option.value))
          : draftValue === option.value;
        return (
          <label
            key={option.value}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low"
          >
            <input
              ref={index === 0 ? firstOptionRef : undefined}
              type={multiple ? 'checkbox' : 'radio'}
              name={multiple ? undefined : panelId}
              checked={checked}
              onChange={() => choose(option.value)}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            <span className="font-body">{option.label}</span>
          </label>
        );
      })}
    </div>
  );

  const actions = (
    <div className="mt-5 flex items-center justify-end gap-3 border-t border-outline-variant/20 pt-4">
      <button type="button" onClick={close} className="min-h-11 px-4 text-sm font-medium text-on-surface-variant hover:text-primary">
        Anuluj
      </button>
      <button type="button" onClick={apply} className="min-h-11 bg-primary px-5 text-sm font-semibold text-surface hover:bg-primary/90">
        Zastosuj
      </button>
    </div>
  );

  return (
    <div className="relative" ref={rootRef}>
      <span className="mb-1 block font-label text-[10px] uppercase tracking-widest text-primary">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          const nextOpen = !isOpen;
          if (nextOpen) {
            previouslyFocusedRef.current = triggerRef.current || document.activeElement;
            setIsMobile(readIsMobile());
          }
          setIsOpen(nextOpen);
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={panelId}
        className="flex min-h-11 items-center gap-1 text-left text-sm font-medium text-on-surface transition-colors hover:text-primary"
      >
        <span>{summary}</span>
        <span className="material-symbols-outlined text-sm leading-none" aria-hidden="true">
          {isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </span>
      </button>

      {isOpen && (() => {
        const panel = (
          <section
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal={isMobile ? 'true' : undefined}
            aria-labelledby={titleId}
            data-filter-mode={isMobile ? 'mobile' : 'desktop'}
            className={isMobile
              ? 'fixed inset-x-0 bottom-0 z-[1200] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl'
              : 'fixed z-[1200] max-h-[85vh] min-w-[16rem] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-sm border border-outline-variant/20 bg-surface p-3 shadow-2xl'}
            style={isMobile ? undefined : {
              top: panelPosition ? `${panelPosition.top}px` : 0,
              left: panelPosition ? `${panelPosition.left}px` : 0,
              visibility: panelPosition ? 'visible' : 'hidden',
            }}
          >
            <div className="mb-4 flex items-center justify-between md:hidden">
              <h2 id={titleId} className="font-headline text-xl font-bold text-on-surface">{label}</h2>
              <button ref={closeButtonRef} type="button" onClick={close} className="flex min-h-11 min-w-11 items-center justify-center text-on-surface-variant hover:text-primary" aria-label={`Zamknij: ${label}`}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div id={isMobile ? undefined : titleId} className="hidden pb-2 font-label text-[10px] uppercase tracking-widest text-primary md:block">{label}</div>
            {optionList}
            {actions}
          </section>
        );

        if (!isMobile && typeof document !== 'undefined') return createPortal(panel, document.body);

        return (
          <>
            {isMobile && (
              <button
                type="button"
                className="fixed inset-0 z-[1199] cursor-default bg-obsidian/30 md:hidden"
                aria-label={`Zamknij filtr: ${label}`}
                onClick={close}
              />
            )}
            {panel}
          </>
        );
      })()}
    </div>
  );
};

export default FilterSelect;
