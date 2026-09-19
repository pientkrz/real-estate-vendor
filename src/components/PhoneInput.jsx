import React, { useState } from 'react';
import { getCountryCallingCode, parsePhoneNumber } from 'react-phone-number-input';
import pl from 'react-phone-number-input/locale/pl';
import DialCodeSelect from './DialCodeSelect';

const PhoneInput = ({
  value,
  onChange,
  onBlur,
  error,
  required = false,
  name = 'phone',
  label = 'Numer telefonu',
}) => {
  const [country, setCountry] = useState(() => parsePhoneNumber(value || '')?.country || 'PL');
  // Display only national digits: the selected dial code already appears in the
  // adjacent country control. The form state remains E.164 for validation and email.
  const [localValue, setLocalValue] = useState(() => parsePhoneNumber(value || '')?.nationalNumber || '');

  const handlePhoneChange = (event) => {
    const callingCode = getCountryCallingCode(country);
    const rawValue = event.target.value.trim();
    let digits = rawValue.replace(/\D/g, '');
    const hasInternationalPrefix = rawValue.startsWith('+') || rawValue.startsWith('00');

    if (rawValue.startsWith('00')) {
      digits = digits.slice(2);
    }

    // A pasted full number may include the selected country code. Keep the number
    // cell national-only instead of duplicating that code in the submitted value.
    if (hasInternationalPrefix && digits.startsWith(callingCode) && digits.length > callingCode.length) {
      digits = digits.slice(callingCode.length);
    }
    setLocalValue(digits);
    onChange({ target: { name, value: digits ? `+${callingCode}${digits}` : '' } });
  };

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    // The digits typed so far belong to the old country's format and are no
    // longer meaningful under the new one, so clear rather than keep a
    // silently-mismatched value around.
    setLocalValue('');
    onChange({ target: { name, value: '' } });
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
        {label}{!required && ' (opcjonalnie)'}
      </label>
      {/* The dial-code cell sizes to its own content (flag + fixed-width
          code + chevron) instead of taking a proportional share of the
          row, so it's never bigger than it needs to be; the phone number
          field then takes up whatever space is left. */}
      <div className="flex items-stretch gap-2">
        <DialCodeSelect
          id={`${name}-country`}
          value={country}
          onChange={handleCountryChange}
          labels={pl}
          label="Kraj numeru telefonu"
        />
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[0-9]*"
          id={name}
          name={name}
          value={localValue}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          className="flex-1 min-w-0 bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
          placeholder="500000000"
        />
      </div>
      {error && <p className="text-[11px] text-red-600 font-body">{error}</p>}
    </div>
  );
};

export default PhoneInput;
