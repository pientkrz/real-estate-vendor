/**
 * FlatDetailsPanel
 *
 * Renders resolved details for ObjectName = 0 (Mieszkanie / Flat).
 * Expects a `details` prop produced by `resolveFlatDetails()`.
 */

import DetailRow from './DetailRow';
import TagList from './TagList';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const FlatDetailsPanel = ({ details }) => {
  if (!details) return null;

  const hasRentalInfo =
    details.rent != null ||
    details.freeFrom != null ||
    details.furnished != null ||
    details.deposit != null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      {/* ── Key specs grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Column 1: Building */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane budynku
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="apartment"      label="Rodzaj zabudowy"           value={details.buildingType} />
            <DetailRow icon="construction"   label="Materiał budowy"           value={details.buildingMaterial} />
            <DetailRow icon="layers"         label="Piętro"                    value={details.floorNo} />
            <DetailRow icon="stairs"         label="Liczba pięter w budynku"   value={details.buildingFloorsNum} />
            <DetailRow icon="calendar_today" label="Rok budowy"                value={details.buildYear} />
            <DetailRow icon="gavel"          label="Forma własności"           value={details.buildingOwnership} />
          </ul>
        </div>

        {/* Column 2: Apartment */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Cechy mieszkania
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="bed"                   label="Liczba pokoi"     value={details.roomsNum} />
            <DetailRow icon="build"                 label="Stan wykończenia" value={details.constructionStatus} />
            <DetailRow icon="window"                label="Okna"             value={details.windowsType} />
            <DetailRow icon="local_fire_department" label="Ogrzewanie"       value={details.heating} />
          </ul>
        </div>
      </div>

      {/* ── Feature chips ───────────────────────────────────────── */}
      <div className="mb-12">
        <TagList label="Udogodnienia"  items={details.extras} />
        <TagList label="Zabezpieczenia" items={details.security} />
        <TagList label="Media"          items={details.media} />
        <TagList label="Wyposażenie"    items={details.equipment} />
      </div>

      {/* ── Rental info ─────────────────────────────────────────── */}
      {hasRentalInfo && (
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Warunki najmu
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="event"    label="Wolne od"              value={details.freeFrom} />
            <DetailRow icon="chair"    label="Umeblowane"            value={bool(details.furnished)} />
            <DetailRow icon="payments" label="Czynsz"
              value={details.rent != null ? `${details.rent} ${details.rentCurrency ?? ''}`.trim() : null}
            />
            <DetailRow icon="receipt"  label="Cena zawiera czynsz"   value={bool(details.priceIncludeRent)} />
            <DetailRow icon="school"   label="Wynajmę studentom"     value={bool(details.rentToStudents)} />
            <DetailRow icon="savings"  label="Kaucja"
              value={details.deposit != null ? `${details.deposit} ${details.depositCurrency ?? ''}`.trim() : null}
            />
          </ul>
        </div>
      )}
    </div>
  );
};

export default FlatDetailsPanel;
