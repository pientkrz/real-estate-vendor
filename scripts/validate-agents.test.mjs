import { describe, it, expect } from 'vitest';
import { validateAgent, validateAgents } from './validate-agents-core.mjs';

const validAgent = {
  name: 'Anna Nowak',
  role: 'Doradca ds. Nieruchomości',
  image: 'https://example.com/anna.jpg',
  email: 'anna@globalshome.com',
  languages: ['PL', 'EN'],
  phone: '+48 500 100 200',
};

// ── validateAgent ─────────────────────────────────────────────────────────────

describe('validateAgent', () => {
  it('returns no errors for a fully valid agent', () => {
    expect(validateAgent(validAgent, 0)).toEqual([]);
  });

  it('returns no errors when optional phone is absent', () => {
    const { phone: _phone, ...withoutPhone } = validAgent;
    expect(validateAgent(withoutPhone, 0)).toEqual([]);
  });

  describe('required field: name', () => {
    it('errors when name is missing', () => {
      const { name: _name, ...agent } = validAgent;
      const errors = validateAgent(agent, 0);
      expect(errors.some(e => e.includes('"name"'))).toBe(true);
    });

    it('errors when name is an empty string', () => {
      const errors = validateAgent({ ...validAgent, name: '   ' }, 0);
      expect(errors.some(e => e.includes('"name"'))).toBe(true);
    });

    it('errors when name is not a string', () => {
      const errors = validateAgent({ ...validAgent, name: 42 }, 0);
      expect(errors.some(e => e.includes('"name"'))).toBe(true);
    });
  });

  describe('required field: role', () => {
    it('errors when role is missing', () => {
      const { role: _role, ...agent } = validAgent;
      expect(validateAgent(agent, 0).some(e => e.includes('"role"'))).toBe(true);
    });

    it('errors when role is an empty string', () => {
      expect(validateAgent({ ...validAgent, role: '' }, 0).some(e => e.includes('"role"'))).toBe(true);
    });
  });

  describe('required field: image', () => {
    it('errors when image is missing', () => {
      const { image: _image, ...agent } = validAgent;
      expect(validateAgent(agent, 0).some(e => e.includes('"image"'))).toBe(true);
    });
  });

  describe('required field: email', () => {
    it('errors when email is missing', () => {
      const { email: _email, ...agent } = validAgent;
      expect(validateAgent(agent, 0).some(e => e.includes('"email"'))).toBe(true);
    });

    it('errors when email has no @ sign', () => {
      const errors = validateAgent({ ...validAgent, email: 'not-an-email' }, 0);
      expect(errors.some(e => e.includes('"email"'))).toBe(true);
    });

    it('errors when email has no domain', () => {
      const errors = validateAgent({ ...validAgent, email: 'user@' }, 0);
      expect(errors.some(e => e.includes('"email"'))).toBe(true);
    });

    it('accepts a valid email with subdomains', () => {
      expect(validateAgent({ ...validAgent, email: 'user@mail.example.com' }, 0)).toEqual([]);
    });
  });

  describe('required field: languages', () => {
    it('errors when languages is missing', () => {
      const { languages: _languages, ...agent } = validAgent;
      expect(validateAgent(agent, 0).some(e => e.includes('"languages"'))).toBe(true);
    });

    it('errors when languages is an empty array', () => {
      expect(validateAgent({ ...validAgent, languages: [] }, 0).some(e => e.includes('"languages"'))).toBe(true);
    });

    it('errors when languages is a string instead of array', () => {
      expect(validateAgent({ ...validAgent, languages: 'PL' }, 0).some(e => e.includes('"languages"'))).toBe(true);
    });

    it('errors when languages contains non-string elements', () => {
      expect(validateAgent({ ...validAgent, languages: ['PL', 42] }, 0).some(e => e.includes('"languages"'))).toBe(true);
    });

    it('accepts a single-element languages array', () => {
      expect(validateAgent({ ...validAgent, languages: ['PL'] }, 0)).toEqual([]);
    });
  });

  describe('optional field: phone', () => {
    it('errors when phone is not a string', () => {
      expect(validateAgent({ ...validAgent, phone: 48500100200 }, 0).some(e => e.includes('"phone"'))).toBe(true);
    });

    it('accepts phone as null (treated as absent)', () => {
      expect(validateAgent({ ...validAgent, phone: null }, 0)).toEqual([]);
    });
  });

  it('includes the agent index in the error message', () => {
    const { name: _name, ...agent } = validAgent;
    const errors = validateAgent(agent, 2);
    expect(errors[0]).toContain('Agent #3');
  });

  it('includes the agent name in the error message when name is present', () => {
    const errors = validateAgent({ ...validAgent, role: '' }, 0);
    expect(errors[0]).toContain(validAgent.name);
  });

  it('can report multiple errors for one agent at once', () => {
    const errors = validateAgent({ name: '', role: '', email: 'bad', languages: [], image: '' }, 0);
    expect(errors.length).toBeGreaterThan(1);
  });
});

// ── validateAgents ────────────────────────────────────────────────────────────

describe('validateAgents', () => {
  it('returns valid for an array of valid agents', () => {
    const { valid, errors } = validateAgents([validAgent]);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('returns valid for multiple valid agents', () => {
    const { valid } = validateAgents([validAgent, { ...validAgent, name: 'Jan Kowalski', email: 'jan@globalshome.com' }]);
    expect(valid).toBe(true);
  });

  it('returns invalid when input is not an array', () => {
    const { valid, errors } = validateAgents({ name: 'Anna' });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns invalid when input is null', () => {
    const { valid } = validateAgents(null);
    expect(valid).toBe(false);
  });

  it('returns invalid for an empty array', () => {
    const { valid, errors } = validateAgents([]);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('pusta'))).toBe(true);
  });

  it('returns invalid when an entry is a primitive instead of an object', () => {
    const { valid, errors } = validateAgents(['not-an-object']);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('Agent #1'))).toBe(true);
  });

  it('returns invalid when an entry is a nested array instead of an object', () => {
    const { valid } = validateAgents([['PL', 'EN']]);
    expect(valid).toBe(false);
  });

  it('collects errors from all invalid agents', () => {
    const bad1 = { ...validAgent, name: '' };
    const bad2 = { ...validAgent, email: 'not-an-email', name: 'Other' };
    const { valid, errors } = validateAgents([bad1, bad2]);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('Agent #1'))).toBe(true);
    expect(errors.some(e => e.includes('Agent #2'))).toBe(true);
  });

  it('returns valid=false and errors when one agent in a list is invalid', () => {
    const { valid, errors } = validateAgents([validAgent, { ...validAgent, email: 'broken' }]);
    expect(valid).toBe(false);
    expect(errors.some(e => e.includes('Agent #2'))).toBe(true);
  });
});
