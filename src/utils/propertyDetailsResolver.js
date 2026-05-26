/**
 * propertyDetailsResolver.js
 *
 * Converts raw XML-parsed Otodom details blocks (ObjectName-specific sub-tags)
 * into human-readable resolved objects ready for display.
 *
 * Raw input: numeric dictionary codes + ArrayOfInteger masks from fast-xml-parser.
 * Output: plain strings / arrays of strings / booleans / numbers.
 *
 * Based on Otodom Import specification v170130.
 */

import dict from './otodom-dictionary.json';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Normalise an ArrayOfInteger mask field to a plain JS array. */
const toArray = (val) => {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

/** Look up a single numeric code in a dictionary section. */
const resolveSingle = (section, value) => {
  if (value === undefined || value === null) return null;
  return section?.[String(value)] ?? null;
};

/** Resolve an ArrayOfInteger mask to an array of label strings. */
const resolveArray = (section, rawMask) => {
  return toArray(rawMask?.value)
    .map((v) => section?.[String(v)] ?? String(v))
    .filter(Boolean);
};

/** Parse boolean: 1 → true, 0 → false, undefined → null */
const parseBool = (v) => (v == null ? null : Boolean(parseInt(v)));

/** Resolve a currency code using the shared PriceCurrency dictionary. */
const resolveCurrency = (v) => resolveSingle(dict.PriceCurrency, v);

// ─── per-type resolvers ───────────────────────────────────────────────────────

/**
 * Resolve FlatDetails (ObjectName = 0).
 * @param {object} raw - raw FlatDetails block from XML parser
 * @returns {object}
 */
export const resolveFlatDetails = (raw) => {
  if (!raw) return {};
  const d = dict.FlatDetails;
  return {
    buildingType:       resolveSingle(d.BuildingType,       raw.BuildingType),
    buildingMaterial:   resolveSingle(d.BuildingMaterial,   raw.BuildingMaterial),
    buildingFloorsNum:  raw.BuildingFloorsNum != null ? parseInt(raw.BuildingFloorsNum) : null,
    buildingOwnership:  resolveSingle(d.BuildingOwnership,  raw.BuildingOwnership),
    floorNo:            resolveSingle(d.FloorNo,            raw.FloorNo),
    roomsNum:           raw.RoomsNum   != null ? parseInt(raw.RoomsNum)   : null,
    buildYear:          raw.BuildYear  != null ? parseInt(raw.BuildYear)  : null,
    constructionStatus: resolveSingle(d.ConstructionStatus, raw.ConstructionStatus),
    windowsType:        resolveSingle(d.WindowsType,        raw.WindowsType),
    heating:            resolveSingle(d.Heating,            raw.Heating),
    extras:    resolveArray(d.ExtrasMask,    raw.ExtrasMask),
    security:  resolveArray(d.SecurityMask,  raw.SecurityMask),
    media:     resolveArray(d.MediaMask,     raw.MediaMask),
    equipment: resolveArray(d.EquipmentMask, raw.EquipmentMask),
    freeFrom:         raw.FreeFrom        ?? null,
    furnished:        parseBool(raw.Furnished),
    rent:             raw.Rent            != null ? parseFloat(raw.Rent)    : null,
    rentCurrency:     resolveCurrency(raw.RentCurrency),
    priceIncludeRent: parseBool(raw.PriceIncludeRent),
    rentToStudents:   parseBool(raw.RentToStudents),
    deposit:          raw.Deposit        != null ? parseFloat(raw.Deposit) : null,
    depositCurrency:  resolveCurrency(raw.DepositCurrency),
  };
};

/**
 * Resolve HouseDetails (ObjectName = 1).
 * @param {object} raw
 * @returns {object}
 */
export const resolveHouseDetails = (raw) => {
  if (!raw) return {};
  const d = dict.HouseDetails;
  return {
    buildingType:       resolveSingle(d.BuildingType,       raw.BuildingType),
    buildingMaterial:   resolveSingle(d.BuildingMaterial,   raw.BuildingMaterial),
    terrainArea:        raw.TerrainArea  != null ? parseInt(raw.TerrainArea)  : null,
    constructionStatus: resolveSingle(d.ConstructionStatus, raw.ConstructionStatus),
    buildYear:          raw.BuildYear    != null ? parseInt(raw.BuildYear)    : null,
    roofType:           resolveSingle(d.RoofType,           raw.RoofType),
    type:               resolveSingle(d.Type,               raw.Type),
    floorsNum:          resolveSingle(d.FloorsNum,          raw.FloorsNum),
    roomsNum:           raw.RoomsNum     != null ? parseInt(raw.RoomsNum)     : null,
    garretType:         resolveSingle(d.GarretType,         raw.GarretType),
    windowsType:        resolveSingle(d.WindowsType,        raw.WindowsType),
    location:           resolveSingle(d.Location,           raw.Location),
    roofing:            resolveSingle(d.Roofing,            raw.Roofing),
    heating:   resolveArray(d.HeatingMask, raw.HeatingMask),
    media:     resolveArray(d.MediaMask,   raw.MediaMask),
    fence:     resolveArray(d.FenceMask,   raw.FenceMask),
    extras:    resolveArray(d.ExtrasMask,  raw.ExtrasMask),
    vicinity:  resolveArray(d.VicinityMask, raw.VicinityMask),
    access:    resolveArray(d.AccessMask,   raw.AccessMask),
    security:  resolveArray(d.SecurityMask, raw.SecurityMask),
    freeFrom:        raw.FreeFrom       ?? null,
    furnished:       parseBool(raw.Furnished),
    rent:            raw.Rent           != null ? parseFloat(raw.Rent)    : null,
    rentCurrency:    resolveCurrency(raw.RentCurrency),
    priceIncludeRent: parseBool(raw.PriceIncludeRent),
  };
};

/**
 * Resolve TerrainDetails (ObjectName = 2).
 * @param {object} raw
 * @returns {object}
 */
export const resolveTerrainDetails = (raw) => {
  if (!raw) return {};
  const d = dict.TerrainDetails;
  return {
    type:       resolveSingle(d.Type,      raw.Type),
    dimensions: raw.Dimensions ?? null,
    // AccessMask for terrain is a single integer value per spec (not ArrayOfInteger)
    access:     resolveSingle(d.AccessMask, raw.AccessMask),
    fence:      parseBool(raw.Fence),
    media:     resolveArray(d.MediaMask,    raw.MediaMask),
    vicinity:  resolveArray(d.VicinityMask, raw.VicinityMask),
  };
};

/**
 * Resolve RoomDetails (ObjectName = 3).
 * @param {object} raw
 * @returns {object}
 */
export const resolveRoomDetails = (raw) => {
  if (!raw) return {};
  const d = dict.RoomDetails;
  return {
    buildingType:       resolveSingle(d.BuildingType,        raw.BuildingType),
    roomsNum:           raw.RoomsNum    != null ? parseInt(raw.RoomsNum)    : null,
    roomPlace:          parseBool(raw.RoomPlace),
    freeFrom:           raw.FreeFrom    ?? null,
    furnished:          parseBool(raw.Furnished),
    rent:               raw.Rent        != null ? parseFloat(raw.Rent)      : null,
    rentCurrency:       resolveCurrency(raw.RentCurrency),
    deposit:            raw.Deposit     != null ? parseFloat(raw.Deposit)   : null,
    depositCurrency:    resolveCurrency(raw.DepositCurrency),
    balcony:            parseBool(raw.Balcony),
    womenInFlat:        raw.WomenInFlat != null ? parseInt(raw.WomenInFlat) : null,
    menInFlat:          raw.MenInFlat   != null ? parseInt(raw.MenInFlat)   : null,
    womenInRoom:        raw.WomenInRoom != null ? parseInt(raw.WomenInRoom) : null,
    menInRoom:          raw.MenInRoom   != null ? parseInt(raw.MenInRoom)   : null,
    nonSmokersOnly:     parseBool(raw.NonSmokersOnly),
    preferredSex:       resolveSingle(d.PreferredSex,        raw.PreferredSex),
    preferredProfession: resolveSingle(d.PreferredProffesion, raw.PreferredProffesion),
    persons:   resolveArray(d.PersonsMask,  raw.PersonsMask),
    media:     resolveArray(d.MediaMask,    raw.MediaMask),
    equipment: resolveArray(d.EquipmentMask, raw.EquipmentMask),
  };
};

/**
 * Resolve CommercialPropertyDetails (ObjectName = 4).
 * @param {object} raw
 * @returns {object}
 */
export const resolveCommercialPropertyDetails = (raw) => {
  if (!raw) return {};
  const d = dict.CommercialPropertyDetails;
  return {
    buildingType:       resolveSingle(d.BuildingType,       raw.BuildingType),
    floor:              resolveSingle(d.Floor,              raw.Floor),
    constructionStatus: resolveSingle(d.ConstructionStatus, raw.ConstructionStatus),
    buildYear:          raw.BuildYear    != null ? parseInt(raw.BuildYear)    : null,
    terrainArea:        raw.TerrainArea  != null ? parseInt(raw.TerrainArea)  : null,
    freeFrom:           raw.FreeFrom     ?? null,
    furnished:          parseBool(raw.Furnished),
    use:      resolveArray(d.PropertyUseMask, raw.PropertyUseMask),
    extras:   resolveArray(d.ExtrasMask,      raw.ExtrasMask),
    media:    resolveArray(d.MediaMask,       raw.MediaMask),
    security: resolveArray(d.SecurityMask,    raw.SecurityMask),
  };
};

/**
 * Resolve HallDetails (ObjectName = 5).
 * @param {object} raw
 * @returns {object}
 */
export const resolveHallDetails = (raw) => {
  if (!raw) return {};
  const d = dict.HallDetails;
  return {
    structure:          resolveSingle(d.Structure,          raw.Structure),
    constructionStatus: resolveSingle(d.ConstructionStatus, raw.ConstructionStatus),
    height:             raw.Height != null ? parseInt(raw.Height) : null,
    heating:            parseBool(raw.Heating),
    officeSpace:        parseBool(raw.OfficeSpace),
    socialFacilities:   parseBool(raw.SocialFacilities),
    ramp:               parseBool(raw.Ramp),
    fence:              resolveSingle(d.Fence,       raw.Fence),
    parking:            resolveSingle(d.ParkingType, raw.ParkingType),
    flooring:           resolveSingle(d.Flooring,    raw.Flooring),
    access:    resolveArray(d.AccessMask,   raw.AccessMask),
    use:       resolveArray(d.UseMask,      raw.UseMask),
    media:     resolveArray(d.MediaMask,    raw.MediaMask),
    security:  resolveArray(d.SecurityMask, raw.SecurityMask),
  };
};

/**
 * Resolve GarageDetails (ObjectName = 6).
 * @param {object} raw
 * @returns {object}
 */
export const resolveGarageDetails = (raw) => {
  if (!raw) return {};
  const d = dict.GarageDetails;
  return {
    localization: resolveSingle(d.Localization, raw.Localization),
    structure:    resolveSingle(d.Structure,    raw.Structure),
    heating:  parseBool(raw.Heating),
    lighting: parseBool(raw.Lighting),
  };
};

// ─── dispatcher ──────────────────────────────────────────────────────────────

const RESOLVERS = {
  0: resolveFlatDetails,
  1: resolveHouseDetails,
  2: resolveTerrainDetails,
  3: resolveRoomDetails,
  4: resolveCommercialPropertyDetails,
  5: resolveHallDetails,
  6: resolveGarageDetails,
};

/**
 * Resolve raw XML details to a display-ready object based on ObjectName.
 *
 * @param {number} objectName - 0–6 (Otodom ObjectName integer code)
 * @param {object|null} rawDetails - Raw details block from XML parser
 * @returns {object} Resolved details (empty object if objectName unknown)
 */
export const resolvePropertyDetails = (objectName, rawDetails) => {
  const resolver = RESOLVERS[objectName];
  if (!resolver) return {};
  return resolver(rawDetails);
};
