import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

const COUNTRIES = getCountries();

/**
 * A native <select>'s <option> elements can only render plain text - no
 * SVG/React content - so a flag icon can never actually show up in a native
 * dropdown list (regional-indicator flag emoji don't render as flags on
 * Windows either: Segoe UI Emoji omits them). This is a small custom
 * listbox instead, so each row can render the same SVG flag component used
 * in the collapsed cell.
 */
const DialCodeSelect = ({ id, value, onChange, labels, label }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const sortedCountries = useMemo(
    () => [...COUNTRIES].sort((a, b) => (labels[a] || a).localeCompare(labels[b] || b, 'pl')),
    [labels]
  );

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleSelect = (country) => {
    onChange(country);
    setOpen(false);
  };

  const FlagIcon = flags[value];

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex items-center gap-1 h-full bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-2 py-3 transition-colors duration-300 cursor-pointer"
      >
        {FlagIcon && <FlagIcon title={labels[value]} className="w-5 h-auto shrink-0" />}
        {/* Fixed-width code column, same as the dropdown list, so the cell's
            footprint stays the same size regardless of which country is
            selected instead of growing/shrinking with the digit count. */}
        <span className="w-10 shrink-0 tabular-nums text-on-surface font-body text-sm">+{getCountryCallingCode(value)}</span>
        <span className="material-symbols-outlined text-[16px] text-outline/60 shrink-0">expand_more</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-64 w-64 overflow-y-auto bg-surface border border-outline/20 shadow-xl font-body text-sm"
        >
          {sortedCountries.map((country) => {
            const OptionFlag = flags[country];
            return (
              <li
                key={country}
                role="option"
                aria-selected={country === value}
                onClick={() => handleSelect(country)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-container-low ${country === value ? 'text-primary font-semibold' : 'text-on-surface'}`}
              >
                {OptionFlag && <OptionFlag title={labels[country]} className="w-5 h-auto shrink-0" />}
                {/* Fixed-width code column (sized for the widest real case,
                    "+999") so the country name always starts at the same x
                    position regardless of how many digits the code has. */}
                <span className="w-10 shrink-0 tabular-nums">+{getCountryCallingCode(country)}</span>
                <span className="truncate">{labels[country] || country}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DialCodeSelect;
