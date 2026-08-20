import { describe, expect, it } from 'vitest';
import { getPropertyDetailGroups } from './propertyAttributeMetadata.js';

describe('getPropertyDetailGroups', () => {
  it('presents enriched attributes with Polish labels and icons', () => {
    const groups = getPropertyDetailGroups({
      liczbasypialni: 2,
      liczbalazienek: 1,
      powierzchnia_balkonu: 8.5,
      klimatyzacja: true,
      energy_co2_emissions: 12.4,
      agent_email: 'private@example.com',
      zdjecie1: 'photo.jpg',
      geo_lat: 35.5,
    });

    expect(groups).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'Układ nieruchomości',
        rows: expect.arrayContaining([
          expect.objectContaining({ label: 'Ilość sypialni', icon: 'bedroom_parent', value: '2' }),
          expect.objectContaining({ label: 'Ilość łazienek', icon: 'bathtub', value: '1' }),
        ]),
      }),
      expect.objectContaining({
        name: 'Powierzchnie',
        rows: expect.arrayContaining([
          expect.objectContaining({ label: 'Powierzchnia balkonu', value: '8.5 m²' }),
        ]),
      }),
      expect.objectContaining({
        name: 'Wyposażenie i media',
        rows: expect.arrayContaining([
          expect.objectContaining({ label: 'Klimatyzacja', value: 'Tak' }),
        ]),
      }),
    ]));
    expect(JSON.stringify(groups)).not.toContain('private@example.com');
    expect(JSON.stringify(groups)).not.toContain('photo.jpg');
  });

  it('keeps future safe provider fields visible instead of discarding them', () => {
    const [group] = getPropertyDetailGroups({ custom_provider_feature: 'Widok na morze' });

    expect(group).toMatchObject({
      name: 'Informacje dodatkowe',
      rows: [expect.objectContaining({ label: 'Custom provider feature', value: 'Widok na morze' })],
    });
  });
});
