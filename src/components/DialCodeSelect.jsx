import React, { useEffect, useRef, useState } from 'react';
import { COUNTRY_DIAL_CODES } from '../utils/phoneValidation';

/**
 * A native <select> always renders the selected option's full text ("+48
 * Polska") in the closed box — there's no way to show just "+48" collapsed
 * while still listing "+48 Polska" in the open dropdown. This is a small
 * custom listbox instead, giving independent control over both states.
 * Calls onChange with a plain { target: { name, value } } object, matching
 * the shape host forms already destructure from real input change events.
 */
const DialCodeSelect = ({ id, name, value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

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

  const handleSelect = (code) => {
    onChange({ target: { name, value: code, type: 'text' } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="w-full flex items-center justify-between gap-1 bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-2 py-3 text-on-surface font-body text-sm outline-none transition-colors duration-300 cursor-pointer"
      >
        <span>{value}</span>
        <span className="material-symbols-outlined text-[16px] text-outline/60">expand_more</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1 max-h-64 w-64 overflow-y-auto bg-surface border border-outline/20 shadow-xl font-body text-sm"
        >
          {COUNTRY_DIAL_CODES.map(({ code, country }) => (
            <li
              key={`${code}-${country}`}
              role="option"
              aria-selected={code === value}
              onClick={() => handleSelect(code)}
              className={`px-3 py-2 cursor-pointer hover:bg-surface-container-low ${code === value ? 'text-primary font-semibold' : 'text-on-surface'}`}
            >
              {code} {country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DialCodeSelect;
