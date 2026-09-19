import React, { useEffect, useId, useRef, useState } from 'react';

const EMPTY_VALUES = [];

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
  const firstOptionRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  const normalizedValue = multiple ? (Array.isArray(value) ? value : EMPTY_VALUES) : (value ?? '');

  useEffect(() => {
    if (!isOpen) setDraftValue(normalizedValue);
  }, [isOpen, normalizedValue]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const closeDesktopPopover = (event) => {
      const isDesktop = typeof window.matchMedia === 'function'
        && window.matchMedia('(min-width: 768px)').matches;
      if (isDesktop && rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeDesktopPopover);
    firstOptionRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeDesktopPopover);
    };
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
        type="button"
        onClick={() => setIsOpen((open) => !open)}
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

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[1199] bg-obsidian/30 md:hidden" onClick={close} aria-hidden="true" />
          <section
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-x-0 bottom-0 z-[1200] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:z-50 md:mt-2 md:min-w-[16rem] md:rounded-sm md:border md:border-outline-variant/20 md:p-3"
          >
            <div className="mb-4 flex items-center justify-between md:hidden">
              <h2 className="font-headline text-xl font-bold text-on-surface">{label}</h2>
              <button type="button" onClick={close} className="flex min-h-11 min-w-11 items-center justify-center text-on-surface-variant hover:text-primary" aria-label={`Zamknij: ${label}`}>
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="hidden pb-2 font-label text-[10px] uppercase tracking-widest text-primary md:block">{label}</div>
            {optionList}
            {actions}
          </section>
        </>
      )}
    </div>
  );
};

export default FilterSelect;
