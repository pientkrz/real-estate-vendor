export const REQUIRED = [
  { field: 'name',      type: 'string', label: 'Imię i nazwisko (name)' },
  { field: 'role',      type: 'string', label: 'Stanowisko (role)' },
  { field: 'image',     type: 'string', label: 'URL zdjęcia (image)' },
  { field: 'email',     type: 'string', label: 'Adres e-mail (email)' },
  { field: 'languages', type: 'array',  label: 'Lista języków (languages)' },
];

export const OPTIONAL = [
  { field: 'phone', type: 'string', label: 'Numer telefonu (phone)' },
];

/**
 * Validates a single agent object.
 * Returns an array of error message strings (empty = valid).
 */
export function validateAgent(agent, index) {
  const prefix = `Agent #${index + 1}${agent.name ? ` (${agent.name})` : ''}`;
  const errors = [];

  for (const { field, type, label } of REQUIRED) {
    const value = agent[field];
    if (value === undefined || value === null) {
      errors.push(`${prefix}: brakuje wymaganego pola "${field}" — ${label}`);
      continue;
    }
    if (type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${prefix}: pole "${field}" musi być listą (np. ["PL", "EN"]), a jest: ${typeof value}`);
      } else if (value.length === 0) {
        errors.push(`${prefix}: pole "${field}" nie może być pustą listą`);
      } else if (value.some(v => typeof v !== 'string')) {
        errors.push(`${prefix}: każdy element pola "${field}" musi być tekstem (np. "PL")`);
      }
    } else if (typeof value !== type) {
      errors.push(`${prefix}: pole "${field}" musi być tekstem (string), a jest: ${typeof value}`);
    } else if (value.trim() === '') {
      errors.push(`${prefix}: pole "${field}" nie może być pustym tekstem`);
    }
  }

  for (const { field, type } of OPTIONAL) {
    const value = agent[field];
    if (value !== undefined && value !== null && typeof value !== type) {
      errors.push(`${prefix}: opcjonalne pole "${field}" musi być tekstem, a jest: ${typeof value}`);
    }
  }

  if (typeof agent.email === 'string' && agent.email.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agent.email)) {
      errors.push(`${prefix}: pole "email" wygląda niepoprawnie: "${agent.email}"`);
    }
  }

  return errors;
}

/**
 * Validates the full parsed agents array.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateAgents(data) {
  const errors = [];

  if (!Array.isArray(data)) {
    errors.push('Plik musi zawierać listę agentów w nawiasach kwadratowych [ ... ]');
    return { valid: false, errors };
  }

  if (data.length === 0) {
    errors.push('Lista agentów jest pusta — dodaj przynajmniej jednego agenta');
    return { valid: false, errors };
  }

  for (let i = 0; i < data.length; i++) {
    if (typeof data[i] !== 'object' || Array.isArray(data[i])) {
      errors.push(`Agent #${i + 1}: musi być obiektem { ... }, a nie wartością prostą`);
      continue;
    }
    errors.push(...validateAgent(data[i], i));
  }

  return { valid: errors.length === 0, errors };
}
