import { isValidPhoneNumber as isValidPhoneNumberLib, parsePhoneNumber } from 'react-phone-number-input';

/**
 * Poland's reserved 3-digit alarm/emergency short numbers ("numery
 * alarmowe", per UKE regulation) — never a legitimate personal contact
 * number, so rejected outright even though they'd otherwise parse as a
 * technically "possible" number.
 */
export const POLISH_EMERGENCY_NUMBERS = ['112', '985', '986', '987', '991', '992', '993', '994', '996', '997', '998', '999'];

/**
 * Real per-country format validation (via react-phone-number-input /
 * libphonenumber-js), plus a Poland-specific block on emergency numbers.
 * An empty value is treated as valid — required-ness is a separate concern
 * the host form controls via the `required` prop.
 *
 * The emergency-number check runs on a lenient parse (parsePhoneNumber
 * extracts the national number even for numbers the library considers
 * "invalid") and is checked independently of, not gated behind, the strict
 * validity check below — those 3-digit codes would already fail Poland's
 * 9-digit length rule today, but this rule should keep holding even if that
 * ever changes, since it's a distinct, deliberate business rule rather than
 * a side effect of the length check.
 */
export const isValidPhoneNumber = (value) => {
  if (!value) return true;

  const parsed = parsePhoneNumber(value);
  if (parsed?.country === 'PL' && POLISH_EMERGENCY_NUMBERS.includes(parsed.nationalNumber)) {
    return false;
  }

  return isValidPhoneNumberLib(value);
};
