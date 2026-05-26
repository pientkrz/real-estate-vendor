/**
 * CommercialPropertyDetailsPanel
 *
 * Renders resolved details for ObjectName = 4 (Lokal użytkowy / CommercialProperty).
 * Expects a `details` prop produced by `resolveCommercialPropertyDetails()`.
 */

import DetailRow from './DetailRow';
import TagList from './TagList';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const CommercialPropertyDetailsPanel = ({ details }) => {
  if (!details) return null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      {/* ── Key specs grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Column 1: Location / building */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane lokalu
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="store"          label="Umiejscowienie"            value={details.buildingType} />
            <DetailRow icon="layers"         label="Piętro"                    value={details.floor} />
            <DetailRow icon="build"          label="Stan wykończenia"          value={details.constructionStatus} />
            <DetailRow icon="calendar_today" label="Rok budowy"                value={details.buildYear} />
            <DetailRow icon="square_foot"    label="Powierzchnia działki (m²)" value={details.terrainArea} />
          </ul>
        </div>

        {/* Column 2: Availability */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dostępność
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="event" label="Wolne od"    value={details.freeFrom} />
            <DetailRow icon="chair" label="Umeblowane"  value={bool(details.furnished)} />
          </ul>
        </div>
      </div>

      {/* ── Feature chips ───────────────────────────────────────── */}
      <div className="mb-12">
        <TagList label="Przeznaczenie"  items={details.use} />
        <TagList label="Udogodnienia"   items={details.extras} />
        <TagList label="Media"          items={details.media} />
        <TagList label="Zabezpieczenia" items={details.security} />
      </div>
    </div>
  );
};

export default CommercialPropertyDetailsPanel;
