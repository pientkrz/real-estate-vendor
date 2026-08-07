import React from 'react';
import DialCodeSelect from './DialCodeSelect';

const PhoneInput = ({
  dialCode,
  phone,
  onChange,
  onBlur,
  error,
  required = false,
  dialCodeName = 'phoneDialCode',
  phoneName = 'phone',
  label = 'Numer telefonu',
}) => (
  <div className="space-y-2">
    <label htmlFor={phoneName} className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
      {label}{!required && ' (opcjonalnie)'}
    </label>
    <div className="grid grid-cols-4 gap-2">
      <div className="col-span-1">
        <DialCodeSelect
          id={dialCodeName}
          name={dialCodeName}
          value={dialCode}
          onChange={onChange}
          label="Międzynarodowy numer kierunkowy"
        />
      </div>
      <input
        type="tel"
        id={phoneName}
        name={phoneName}
        required={required}
        value={phone}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={!!error}
        className="col-span-3 min-w-0 bg-surface border-none border-b-2 border-outline/20 focus:border-primary px-4 py-3 text-on-surface font-body outline-none transition-colors duration-300 placeholder:text-outline/50"
        placeholder="500 000 000"
      />
    </div>
    {error && <p className="text-[11px] text-red-600 font-body">{error}</p>}
  </div>
);

export default PhoneInput;
