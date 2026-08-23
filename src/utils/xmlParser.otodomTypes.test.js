import { describe, expect, it, vi } from 'vitest';

import { parseOtoDomXml } from './xmlParser.js';
import ALL_OBJECT_TYPES_XML from '../../test/fixtures/otodom-all-object-types.xml?raw';

vi.mock('./reverseGeocode.js', () => ({
  reverseGeocode: () => ({ city: 'Wrocław', region: 'dolnośląskie', country: 'Polska' }),
}));

describe('parseOtoDomXml — complete ObjectName vocabulary', () => {
  it('parses all seven documented ObjectName types into canonical categories', () => {
    const offers = parseOtoDomXml(ALL_OBJECT_TYPES_XML, '/photos/');

    expect(offers).toHaveLength(7);
    expect(offers.map(({ objectName, tab, rawDetails }) => [objectName, tab, rawDetails?.Marker])).toEqual([
      [0, 'mieszkania', 'flat'],
      [1, 'domy', 'house'],
      [2, 'dzialki', 'terrain'],
      [3, 'pokoje', 'room'],
      [4, 'lokale', 'commercial'],
      [5, 'hale-magazyny', 'hall'],
      [6, 'garaze', 'garage'],
    ]);
  });

  it('keeps the documented room rental restriction and common fields', () => {
    const offers = parseOtoDomXml(ALL_OBJECT_TYPES_XML, '/photos/');
    const room = offers.find((offer) => offer.objectName === 3);
    const flat = offers.find((offer) => offer.objectName === 0);

    expect(room).toMatchObject({ typ: 'wynajem', params: { liczbapokoi: 4 } });
    expect(flat.params).toMatchObject({
      powierzchnia: 50,
      liczbapokoi: 2,
      zdjecie1: '/photos/first.jpg',
      zdjecie2: '/photos/second.jpg',
    });
  });

  it('never reads a details block belonging to another ObjectName', () => {
    const offers = parseOtoDomXml(ALL_OBJECT_TYPES_XML);
    const garage = offers.find((offer) => offer.objectName === 6);

    expect(garage.rawDetails).toMatchObject({ Marker: 'garage', Structure: 0 });
    expect(garage.params.liczbapokoi).toBe(0);
  });

  it('keeps a future unknown ObjectName as an "inne" offer and reports it safely', () => {
    const onUnknownObjectName = vi.fn();
    const xml = ALL_OBJECT_TYPES_XML.replace('<ObjectName>0</ObjectName>', '<ObjectName>99</ObjectName>');

    const [offer] = parseOtoDomXml(xml, '', { onUnknownObjectName });

    expect(offer).toMatchObject({ objectName: 99, tab: 'inne', rawDetails: null });
    expect(onUnknownObjectName).toHaveBeenCalledWith({
      provider: 'otodom-pl',
      providerOfferId: 'flat-1',
      objectName: '99',
    });
  });
});
