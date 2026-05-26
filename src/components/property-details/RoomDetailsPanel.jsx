/**
 * RoomDetailsPanel
 *
 * Renders resolved details for ObjectName = 3 (Pokój / Room).
 * Expects a `details` prop produced by `resolveRoomDetails()`.
 */

import DetailRow from './DetailRow';
import TagList from './TagList';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const RoomDetailsPanel = ({ details }) => {
  if (!details) return null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      {/* ── Key specs grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Column 1: Room details */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane pokoju
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="apartment"  label="Rodzaj zabudowy"           value={details.buildingType} />
            <DetailRow icon="bed"        label="Liczba pokoi w mieszkaniu" value={details.roomsNum} />
            <DetailRow icon="person"     label="Miejsce w pokoju"          value={bool(details.roomPlace)} />
            <DetailRow icon="deck"       label="Balkon"                    value={bool(details.balcony)} />
            <DetailRow icon="event"      label="Wolne od"                  value={details.freeFrom} />
            <DetailRow icon="chair"      label="Umeblowane"                value={bool(details.furnished)} />
            <DetailRow icon="no_smoking" label="Tylko dla niepalących"     value={bool(details.nonSmokersOnly)} />
          </ul>
        </div>

        {/* Column 2: Occupants */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Lokatorzy i preferencje
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="woman"    label="Kobiety w mieszkaniu" value={details.womenInFlat} />
            <DetailRow icon="man"      label="Mężczyźni w mieszkaniu" value={details.menInFlat} />
            <DetailRow icon="woman"    label="Kobiety w pokoju"     value={details.womenInRoom} />
            <DetailRow icon="man"      label="Mężczyźni w pokoju"   value={details.menInRoom} />
            <DetailRow icon="wc"       label="Preferowana płeć"     value={details.preferredSex} />
            <DetailRow icon="work"     label="Sytuacja zawodowa"    value={details.preferredProfession} />
          </ul>
        </div>
      </div>

      {/* ── Feature chips ───────────────────────────────────────── */}
      <div className="mb-12">
        <TagList label="Liczba osób"   items={details.persons} />
        <TagList label="Media"         items={details.media} />
        <TagList label="Wyposażenie"   items={details.equipment} />
      </div>

      {/* ── Rental / financial ──────────────────────────────────── */}
      {(details.rent != null || details.deposit != null) && (
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Warunki finansowe
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="payments" label="Czynsz / opłaty"
              value={details.rent != null ? `${details.rent} ${details.rentCurrency ?? ''}`.trim() : null}
            />
            <DetailRow icon="savings"  label="Kaucja"
              value={details.deposit != null ? `${details.deposit} ${details.depositCurrency ?? ''}`.trim() : null}
            />
          </ul>
        </div>
      )}
    </div>
  );
};

export default RoomDetailsPanel;
