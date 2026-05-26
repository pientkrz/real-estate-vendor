/**
 * PropertyDetailsPanel
 *
 * Dispatcher: receives the full `offer` object (which must contain
 * `offer.objectName` and `offer.rawDetails`), resolves the type-specific
 * details, and renders the appropriate per-type panel.
 *
 * ObjectName → Panel mapping (Otodom spec):
 *   0 → FlatDetailsPanel            (Mieszkanie)
 *   1 → HouseDetailsPanel           (Dom)
 *   2 → TerrainDetailsPanel         (Działka)
 *   3 → RoomDetailsPanel            (Pokój)
 *   4 → CommercialPropertyDetailsPanel (Lokal użytkowy)
 *   5 → HallDetailsPanel            (Magazyn / Hala)
 *   6 → GarageDetailsPanel          (Garaż)
 */

import { resolvePropertyDetails } from '../../utils/propertyDetailsResolver';

import FlatDetailsPanel               from './FlatDetailsPanel';
import HouseDetailsPanel              from './HouseDetailsPanel';
import TerrainDetailsPanel            from './TerrainDetailsPanel';
import RoomDetailsPanel               from './RoomDetailsPanel';
import CommercialPropertyDetailsPanel from './CommercialPropertyDetailsPanel';
import HallDetailsPanel               from './HallDetailsPanel';
import GarageDetailsPanel             from './GarageDetailsPanel';

/** Map numeric ObjectName to the matching panel component */
const PANEL_MAP = {
  0: FlatDetailsPanel,
  1: HouseDetailsPanel,
  2: TerrainDetailsPanel,
  3: RoomDetailsPanel,
  4: CommercialPropertyDetailsPanel,
  5: HallDetailsPanel,
  6: GarageDetailsPanel,
};

/**
 * @param {{ offer: { objectName: number, rawDetails: object|null } }} props
 */
const PropertyDetailsPanel = ({ offer }) => {
  if (!offer) return null;

  const { objectName, rawDetails } = offer;

  const Panel = PANEL_MAP[objectName];
  if (!Panel) return null;

  const resolvedDetails = resolvePropertyDetails(objectName, rawDetails);

  return <Panel details={resolvedDetails} />;
};

export default PropertyDetailsPanel;
