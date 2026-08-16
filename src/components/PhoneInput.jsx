import React, { useState } from 'react';
import PhoneNumberInput from 'react-phone-number-input/input';
import { parsePhoneNumber } from 'react-phone-number-input';
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
  // Owned locally rather than driven straight from the `value` prop: round-tripping
  // every keystroke up through the host form's state and back down added enough of a
  // render delay that react-phone-number-input's AsYouType formatter would lose or
  // misplace characters typed in quick succession. Local state lets the digits input
  // re-render immediately on each keystroke; the parent is still kept in sync via
  // onChange for validation/submission.
  const [localValue, setLocalValue] = useState(value);

  const handlePhoneChange = (newValue) => {
    setLocalValue(newValue);
    onChange({ target: { name, value: newValue || '' } });
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
        <PhoneNumberInput
          country={country}
          id={name}
          name={name}
          value={localValue}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          className="flex-1 min-w-0 bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
          placeholder="500 000 000"
        />
      </div>
      {error && <p className="text-[11px] text-red-600 font-body">{error}</p>}
    </div>
  );
};

export default PhoneInput;
