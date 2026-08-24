import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createEmptyOfferState, writeOfferStateAtomic } from '../../server/offerState.js';

const sendContactEmail = vi.hoisted(() => vi.fn());
vi.mock('../../server/mailer', () => ({ sendContactEmail }));

const { POST } = await import('./contact.js');
const originalStatePath = process.env.OFFER_STATE_PATH;
const temporaryDirectories = [];

afterEach(() => {
  sendContactEmail.mockReset();
  if (originalStatePath === undefined) delete process.env.OFFER_STATE_PATH;
  else process.env.OFFER_STATE_PATH = originalStatePath;
  temporaryDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

const requestFor = (body) => new Request('http://localhost/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('POST /api/contact', () => {
  it('derives property-agent recipients from the published state, not the browser request', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'contact-route-'));
    temporaryDirectories.push(directory);
    const statePath = path.join(directory, 'offers-state.json');
    const state = createEmptyOfferState();
    state.aggregates = [{
      id: '191-2',
      lifecycle: { isVisible: true },
      sourceRecords: {
        'otodom-pl': { sourceStatus: 'active', agent: { email: 'piotrek@globalshome.com' } },
        'nieruchomosci-online-pl': { sourceStatus: 'active', agent: { email: 'anna@globalshome.com' } },
      },
    }];
    writeOfferStateAtomic(statePath, state);
    process.env.OFFER_STATE_PATH = statePath;
    sendContactEmail.mockResolvedValue({});

    const response = await POST({
      request: requestFor({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Proszę o kontakt.',
        source: 'property-inquiry',
        propertyId: '191-2',
        agentEmails: ['attacker@example.com'],
      }),
      clientAddress: 'test-client-property',
      locals: { requestId: 'request-property' },
    });

    expect(response.status).toBe(200);
    expect(sendContactEmail).toHaveBeenCalledWith(expect.objectContaining({
      agentEmails: ['piotrek@globalshome.com', 'anna@globalshome.com'],
    }));
  });

  it('does not send an enquiry for an unavailable property', async () => {
    const response = await POST({
      request: requestFor({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Proszę o kontakt.',
        source: 'property-inquiry',
        propertyId: 'missing',
      }),
      clientAddress: 'test-client-missing',
      locals: { requestId: 'request-missing' },
    });

    expect(response.status).toBe(404);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });
});
