/**
 * xmlValidator.js
 *
 * Validates an Otodom-format XML export against the Otodom Import
 * specification v170130.
 *
 * Backward-compatible rules:
 *   ✓ Extra / unknown fields not mentioned in the spec → VALID (ignored)
 *   ✗ Missing required fields → INVALID
 *
 * Required fields per ObjectName (spec section 6.8):
 *   All active insertions (Action=0): ID, Price, PriceCurrency, Description,
 *     MarketType + location (Country, Province, District, City)
 *   Flat (0):               + Area, FlatDetails.RoomsNum
 *   House (1):              + Area, HouseDetails.RoomsNum
 *   Terrain (2):            + Area
 *   Room (3):               (no extra; OfferType MUST be 1)
 *   CommercialProperty (4): + Area
 *   Hall (5):               + Area
 *   Garage (6):             (no extra)
 *
 * Deactivation (Action=1) / Deletion (Action=2): only ID required.
 */

import { XMLParser } from 'fast-xml-parser';

// ─── field lists ─────────────────────────────────────────────────────────────

const REQUIRED_TOP_LEVEL = ['ID', 'Price', 'PriceCurrency', 'Description', 'MarketType'];
const REQUIRED_LOCATION  = ['Country', 'Province', 'District', 'City'];

/** Per-ObjectName validation config */
const OBJECT_CONFIG = {
  0: {
    name:           'Mieszkanie (Flat)',
    detailsKey:     'FlatDetails',
    requiresArea:   true,
    requiredInDetails: ['RoomsNum'],
    constraints:    [],
  },
  1: {
    name:           'Dom (House)',
    detailsKey:     'HouseDetails',
    requiresArea:   true,
    requiredInDetails: ['RoomsNum'],
    constraints:    [],
  },
  2: {
    name:           'Działka (Terrain)',
    detailsKey:     'TerrainDetails',
    requiresArea:   true,
    requiredInDetails: [],
    constraints:    [],
  },
  3: {
    name:           'Pokój (Room)',
    detailsKey:     'RoomDetails',
    requiresArea:   false,
    requiredInDetails: [],
    constraints:    [
      (ins) =>
        parseInt(ins.OfferType) === 1 ||
        'Room (ObjectName=3) requires OfferType=1 (rent)',
    ],
  },
  4: {
    name:           'Lokal użytkowy (CommercialProperty)',
    detailsKey:     'CommercialPropertyDetails',
    requiresArea:   true,
    requiredInDetails: [],
    constraints:    [],
  },
  5: {
    name:           'Magazyn/Hala (Hall)',
    detailsKey:     'HallDetails',
    requiresArea:   true,
    requiredInDetails: [],
    constraints:    [],
  },
  6: {
    name:           'Garaż (Garage)',
    detailsKey:     'GarageDetails',
    requiresArea:   false,
    requiredInDetails: [],
    constraints:    [],
  },
};

// ─── per-insertion validator ──────────────────────────────────────────────────

/**
 * Validates a single parsed Insertion node.
 *
 * @param {object} ins   - Parsed Insertion JS object
 * @param {number} index - 0-based position for error messages
 * @returns {{ id: string|null, valid: boolean, errors: string[] }}
 */
export const validateInsertion = (ins, index = 0) => {
  const id    = ins.ID != null ? String(ins.ID) : null;
  const label = id ? `Insertion ID=${id}` : `Insertion[${index}]`;
  const errors = [];

  const action = parseInt(ins.Action);

  // Deactivation / deletion: only ID is required
  if (action === 1 || action === 2) {
    if (!id) errors.push(`${label}: missing required field 'ID'`);
    return { id, valid: errors.length === 0, errors };
  }

  // ── Active insertion (Action=0 or omitted) ─────────────────────────────────
  if (!id) errors.push(`${label}: missing required field 'ID'`);

  for (const field of REQUIRED_TOP_LEVEL) {
    const v = ins[field];
    if (v === undefined || v === null || v === '') {
      errors.push(`${label}: missing required field '${field}'`);
    }
  }

  for (const field of REQUIRED_LOCATION) {
    const v = ins[field];
    if (v === undefined || v === null || v === '') {
      errors.push(`${label}: missing required location field '${field}'`);
    }
  }

  // ObjectName is required to determine the rest
  const rawObjectName = ins.ObjectName;
  if (rawObjectName === undefined || rawObjectName === null || rawObjectName === '') {
    errors.push(`${label}: missing required field 'ObjectName'`);
    return { id, valid: errors.length === 0, errors };
  }

  const objectName = parseInt(rawObjectName);
  if (isNaN(objectName) || !(objectName in OBJECT_CONFIG)) {
    errors.push(`${label}: unknown ObjectName value '${rawObjectName}' (valid: 0–6)`);
    return { id, valid: errors.length === 0, errors };
  }

  const cfg = OBJECT_CONFIG[objectName];

  // Area required for some types
  if (cfg.requiresArea) {
    const area = ins.Area;
    if (area === undefined || area === null || area === '') {
      errors.push(`${label} (${cfg.name}): missing required field 'Area'`);
    }
  }

  // Details block
  // fast-xml-parser returns `undefined` when the tag is absent entirely,
  // and `""` (empty string) when it is present but has no child content.
  // Both `undefined` and `null` → block is truly missing.
  // `""` or `{}` → block present but may be missing required fields.
  const details = ins[cfg.detailsKey];
  if (details === undefined || details === null) {
    errors.push(
      `${label} (${cfg.name}): missing required details block '<${cfg.detailsKey}>'`,
    );
  } else {
    for (const field of cfg.requiredInDetails) {
      // When `details` is an empty string (empty tag), field access yields undefined
      const v = typeof details === 'object' ? details[field] : undefined;
      if (v === undefined || v === null || v === '') {
        errors.push(
          `${label} (${cfg.name}): missing required field '${cfg.detailsKey}.${field}'`,
        );
      }
    }
  }

  // Custom constraints (e.g. Room OfferType check)
  for (const check of cfg.constraints) {
    const result = check(ins);
    if (result !== true) {
      errors.push(`${label}: ${result}`);
    }
  }

  return { id, valid: errors.length === 0, errors };
};

// ─── full-document validator ──────────────────────────────────────────────────

/**
 * Validates an entire Otodom XML export string.
 *
 * @param {string} xmlString
 * @returns {{
 *   valid:             boolean,
 *   totalInsertions:   number,
 *   validCount:        number,
 *   invalidCount:      number,
 *   errors:            string[],
 *   insertionResults:  Array<{ id: string|null, valid: boolean, errors: string[] }>
 * }}
 */
export const validateOtoDomXml = (xmlString) => {
  const topErrors = [];
  let jsonObj;

  try {
    const parser = new XMLParser({
      ignoreAttributes:    false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
    });
    jsonObj = parser.parse(xmlString);
  } catch (e) {
    return {
      valid: false,
      totalInsertions: 0,
      validCount:      0,
      invalidCount:    0,
      errors:          [`XML parse error: ${e.message}`],
      insertionResults: [],
    };
  }

  // Root-level structure checks
  if (!jsonObj.otoDom) {
    topErrors.push("Missing root element <otoDom>");
  }
  if (!jsonObj.otoDom?.Agency) {
    topErrors.push("Missing required element <Agency>");
  }
  if (!jsonObj.otoDom?.Date) {
    topErrors.push("Missing required element <Date>");
  }
  if (!jsonObj.otoDom?.ImportType) {
    topErrors.push("Missing required element <ImportType>");
  } else {
    const importType = String(jsonObj.otoDom.ImportType);
    if (!['full', 'incremental'].includes(importType)) {
      topErrors.push(
        `Invalid <ImportType> value '${importType}'. Must be 'full' or 'incremental'`,
      );
    }
  }

  const insertionsNode = jsonObj.otoDom?.Insertions?.Insertion;
  if (!insertionsNode) {
    const allErrors = [...topErrors];
    return {
      valid:            allErrors.length === 0,
      totalInsertions:  0,
      validCount:       0,
      invalidCount:     0,
      errors:           allErrors,
      insertionResults: [],
    };
  }

  const nodes  = Array.isArray(insertionsNode) ? insertionsNode : [insertionsNode];
  const results = nodes.map((ins, i) => validateInsertion(ins, i));

  const validCount   = results.filter((r) => r.valid).length;
  const invalidCount = results.filter((r) => !r.valid).length;
  const allErrors    = [...topErrors, ...results.flatMap((r) => r.errors)];

  return {
    valid:            allErrors.length === 0,
    totalInsertions:  nodes.length,
    validCount,
    invalidCount,
    errors:           allErrors,
    insertionResults: results,
  };
};
