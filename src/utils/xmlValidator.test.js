import { describe, it, expect } from 'vitest';
import { validateOtoDomXml, validateInsertion } from './xmlValidator';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Minimal valid outer wrapper for XML strings */
const wrapXml = (insertionXml) => `<?xml version="1.0" encoding="utf-8"?>
<otoDom>
  <Agency>test@test.pl</Agency>
  <Date>2024-01-01</Date>
  <ImportType>full</ImportType>
  <Insertions>${insertionXml}</Insertions>
</otoDom>`;

const validFlat = `
<Insertion>
  <ID>1</ID><Action>0</Action>
  <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
  <Price>500000</Price><PriceCurrency>1</PriceCurrency>
  <Area>60</Area><MarketType>1</MarketType><ObjectName>0</ObjectName>
  <Description>Mieszkanie na sprzedaż</Description>
  <FlatDetails><RoomsNum>3</RoomsNum></FlatDetails>
</Insertion>`;

const validHouse = `
<Insertion>
  <ID>2</ID><Action>0</Action>
  <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
  <Price>800000</Price><PriceCurrency>1</PriceCurrency>
  <Area>120</Area><MarketType>1</MarketType><ObjectName>1</ObjectName>
  <Description>Dom na sprzedaż</Description>
  <HouseDetails><RoomsNum>5</RoomsNum></HouseDetails>
</Insertion>`;

const validTerrain = `
<Insertion>
  <ID>3</ID><Action>0</Action>
  <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
  <Price>200000</Price><PriceCurrency>1</PriceCurrency>
  <Area>1000</Area><MarketType>1</MarketType><ObjectName>2</ObjectName>
  <Description>Działka budowlana</Description>
  <TerrainDetails><Type>0</Type></TerrainDetails>
</Insertion>`;

const validRoom = `
<Insertion>
  <ID>4</ID><Action>0</Action>
  <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
  <Price>800</Price><PriceCurrency>1</PriceCurrency>
  <MarketType>1</MarketType><ObjectName>3</ObjectName><OfferType>1</OfferType>
  <Description>Pokój do wynajęcia</Description>
  <RoomDetails></RoomDetails>
</Insertion>`;

const validGarage = `
<Insertion>
  <ID>6</ID><Action>0</Action>
  <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
  <Price>50000</Price><PriceCurrency>1</PriceCurrency>
  <MarketType>1</MarketType><ObjectName>6</ObjectName>
  <Description>Garaż</Description>
  <GarageDetails><Localization>0</Localization></GarageDetails>
</Insertion>`;

// ─── validateOtoDomXml ────────────────────────────────────────────────────────

describe('validateOtoDomXml', () => {
  it('validates a correct Flat insertion', () => {
    const result = validateOtoDomXml(wrapXml(validFlat));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totalInsertions).toBe(1);
    expect(result.validCount).toBe(1);
  });

  it('validates a correct House insertion', () => {
    const result = validateOtoDomXml(wrapXml(validHouse));
    expect(result.valid).toBe(true);
  });

  it('validates a correct Terrain insertion', () => {
    const result = validateOtoDomXml(wrapXml(validTerrain));
    expect(result.valid).toBe(true);
  });

  it('validates a correct Garage insertion', () => {
    const result = validateOtoDomXml(wrapXml(validGarage));
    expect(result.valid).toBe(true);
  });

  it('validates multiple insertions in one file', () => {
    const result = validateOtoDomXml(wrapXml(validFlat + validHouse));
    expect(result.valid).toBe(true);
    expect(result.totalInsertions).toBe(2);
    expect(result.validCount).toBe(2);
  });

  // ── missing root fields ──────────────────────────────────────────────────

  it('fails when <Agency> is missing', () => {
    const xml = `<?xml version="1.0"?><otoDom><Date>2024-01-01</Date><ImportType>full</ImportType><Insertions>${validFlat}</Insertions></otoDom>`;
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Agency'))).toBe(true);
  });

  it('fails with invalid ImportType', () => {
    const xml = `<?xml version="1.0"?><otoDom><Agency>a@b.pl</Agency><Date>2024-01-01</Date><ImportType>batch</ImportType><Insertions>${validFlat}</Insertions></otoDom>`;
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ImportType'))).toBe(true);
  });

  it('returns valid=true when there are no Insertions', () => {
    const xml = `<?xml version="1.0"?><otoDom><Agency>a@b.pl</Agency><Date>2024-01-01</Date><ImportType>full</ImportType></otoDom>`;
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(true);
    expect(result.totalInsertions).toBe(0);
  });

  it('returns an error on malformed XML', () => {
    const result = validateOtoDomXml('<not valid xml >>');
    expect(result.valid).toBe(false);
  });

  // ── missing insertion fields ─────────────────────────────────────────────

  it('fails when Price is missing', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <PriceCurrency>1</PriceCurrency><Area>60</Area><MarketType>1</MarketType>
        <ObjectName>0</ObjectName><Description>test</Description>
        <FlatDetails><RoomsNum>2</RoomsNum></FlatDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("'Price'"))).toBe(true);
  });

  it('fails when Description is missing', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>100000</Price><PriceCurrency>1</PriceCurrency><Area>60</Area>
        <MarketType>1</MarketType><ObjectName>0</ObjectName>
        <FlatDetails><RoomsNum>2</RoomsNum></FlatDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("'Description'"))).toBe(true);
  });

  it('fails when City location field is missing', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District>
        <Price>100000</Price><PriceCurrency>1</PriceCurrency><Area>60</Area>
        <MarketType>1</MarketType><ObjectName>0</ObjectName><Description>test</Description>
        <FlatDetails><RoomsNum>2</RoomsNum></FlatDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("'City'"))).toBe(true);
  });

  it('fails when required details block is absent for Flat', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>100000</Price><PriceCurrency>1</PriceCurrency><Area>60</Area>
        <MarketType>1</MarketType><ObjectName>0</ObjectName><Description>test</Description>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('FlatDetails'))).toBe(true);
  });

  it('fails when RoomsNum is missing inside FlatDetails', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>100000</Price><PriceCurrency>1</PriceCurrency><Area>60</Area>
        <MarketType>1</MarketType><ObjectName>0</ObjectName><Description>test</Description>
        <FlatDetails></FlatDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('RoomsNum'))).toBe(true);
  });

  it('fails when Area is missing for a House', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>300000</Price><PriceCurrency>1</PriceCurrency>
        <MarketType>1</MarketType><ObjectName>1</ObjectName><Description>test</Description>
        <HouseDetails><RoomsNum>4</RoomsNum></HouseDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("'Area'"))).toBe(true);
  });

  it('fails when ObjectName is unknown', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>100000</Price><PriceCurrency>1</PriceCurrency><Area>60</Area>
        <MarketType>1</MarketType><ObjectName>99</ObjectName><Description>test</Description>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ObjectName'))).toBe(true);
  });

  // ── deactivation / deletion ──────────────────────────────────────────────

  it('passes for deactivation (Action=1) with only ID', () => {
    const xml = wrapXml(`<Insertion><ID>99</ID><Action>1</Action></Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(true);
  });

  it('passes for deletion (Action=2) with only ID', () => {
    const xml = wrapXml(`<Insertion><ID>99</ID><Action>2</Action></Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(true);
  });

  it('fails for deactivation (Action=1) without ID', () => {
    const xml = wrapXml(`<Insertion><Action>1</Action></Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("'ID'"))).toBe(true);
  });

  // ── Room constraint ──────────────────────────────────────────────────────

  it('fails when Room (ObjectName=3) has OfferType=0 (sell)', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>800</Price><PriceCurrency>1</PriceCurrency>
        <MarketType>1</MarketType><ObjectName>3</ObjectName><OfferType>0</OfferType>
        <Description>Pokój</Description>
        <RoomDetails></RoomDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('OfferType'))).toBe(true);
  });

  // ── backward compatibility ───────────────────────────────────────────────

  it('is valid when extra/unknown fields are present (backward compatible)', () => {
    const xml = wrapXml(`
      <Insertion>
        <ID>99</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <Price>500000</Price><PriceCurrency>1</PriceCurrency>
        <Area>60</Area><MarketType>1</MarketType><ObjectName>0</ObjectName>
        <Description>test</Description>
        <SomeFutureField>some_value</SomeFutureField>
        <FlatDetails>
          <RoomsNum>3</RoomsNum>
          <NewFieldFromFutureSpec>42</NewFieldFromFutureSpec>
        </FlatDetails>
      </Insertion>`);
    const result = validateOtoDomXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ── mixed results ────────────────────────────────────────────────────────

  it('tracks valid and invalid counts independently', () => {
    const invalidInsertion = `
      <Insertion>
        <ID>BAD</ID><Action>0</Action>
        <Country>1</Country><Province>5</Province><District>142</District><City>Łódź</City>
        <PriceCurrency>1</PriceCurrency><Area>60</Area><MarketType>1</MarketType>
        <ObjectName>0</ObjectName><Description>test</Description>
        <FlatDetails><RoomsNum>2</RoomsNum></FlatDetails>
      </Insertion>`;
    const result = validateOtoDomXml(wrapXml(validFlat + invalidInsertion));
    expect(result.totalInsertions).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.valid).toBe(false);
  });
});

// ─── validateInsertion (unit-level) ──────────────────────────────────────────

describe('validateInsertion', () => {
  it('returns valid for a minimal correct Flat insertion object', () => {
    const ins = {
      ID: '1', Action: 0,
      Country: 1, Province: 5, District: 142, City: 'Łódź',
      Price: 500000, PriceCurrency: 1, Area: 60,
      MarketType: 1, ObjectName: 0, Description: 'test',
      FlatDetails: { RoomsNum: 3 },
    };
    const { valid, errors } = validateInsertion(ins, 0);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('returns valid for Action=1 deactivation with only ID', () => {
    const { valid } = validateInsertion({ ID: '5', Action: 1 }, 0);
    expect(valid).toBe(true);
  });

  it('returns invalid when ID is missing for Action=2', () => {
    const { valid, errors } = validateInsertion({ Action: 2 }, 0);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes("'ID'"))).toBe(true);
  });
});
