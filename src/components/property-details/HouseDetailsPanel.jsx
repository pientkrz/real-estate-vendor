/**
 * HouseDetailsPanel
 *
 * Renders resolved details for ObjectName = 1 (Dom / House).
 * Expects a `details` prop produced by `resolveHouseDetails()`.
 */

import DetailRow from './DetailRow';
import TagList from './TagList';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const HouseDetailsPanel = ({ details }) => {
  if (!details) return null;

  const hasRentalInfo =
    details.rent != null ||
    details.freeFrom != null ||
    details.furnished != null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      {/* ── Key specs grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Column 1: Property / site */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane posesji
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="home"           label="Rodzaj zabudowy"    value={details.buildingType} />
            <DetailRow icon="location_on"    label="Położenie"          value={details.location} />
            <DetailRow icon="landscape"      label="Typ domu"           value={details.type} />
            <DetailRow icon="square_foot"    label="Powierzchnia działki (m²)" value={details.terrainArea} />
            <DetailRow icon="calendar_today" label="Rok budowy"         value={details.buildYear} />
          </ul>
        </div>

        {/* Column 2: Building */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane budynku
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="construction"   label="Materiał budowy"   value={details.buildingMaterial} />
            <DetailRow icon="build"          label="Stan wykończenia"  value={details.constructionStatus} />
            <DetailRow icon="stairs"         label="Liczba pięter"     value={details.floorsNum} />
            <DetailRow icon="bed"            label="Liczba pokoi"      value={details.roomsNum} />
            <DetailRow icon="roofing"        label="Poddasze"          value={details.garretType} />
            <DetailRow icon="roofing"        label="Dach"              value={details.roofType} />
            <DetailRow icon="roofing"        label="Pokrycie dachu"    value={details.roofing} />
            <DetailRow icon="window"         label="Okna"              value={details.windowsType} />
          </ul>
        </div>
      </div>

      {/* ── Feature chips ───────────────────────────────────────── */}
      <div className="mb-12">
        <TagList label="Ogrzewanie"     items={details.heating} />
        <TagList label="Media"          items={details.media} />
        <TagList label="Ogrodzenie"     items={details.fence} />
        <TagList label="Udogodnienia"   items={details.extras} />
        <TagList label="Dojazd"         items={details.access} />
        <TagList label="Okolica"        items={details.vicinity} />
        <TagList label="Zabezpieczenia" items={details.security} />
      </div>

      {/* ── Rental info ─────────────────────────────────────────── */}
      {hasRentalInfo && (
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Warunki najmu
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="event"    label="Wolne od"            value={details.freeFrom} />
            <DetailRow icon="chair"    label="Umeblowane"          value={bool(details.furnished)} />
            <DetailRow icon="payments" label="Czynsz"
              value={details.rent != null ? `${details.rent} ${details.rentCurrency ?? ''}`.trim() : null}
            />
            <DetailRow icon="receipt"  label="Cena zawiera czynsz" value={bool(details.priceIncludeRent)} />
          </ul>
        </div>
      )}
    </div>
  );
};

export default HouseDetailsPanel;
