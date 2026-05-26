/**
 * TerrainDetailsPanel
 *
 * Renders resolved details for ObjectName = 2 (Działka / Terrain).
 * Expects a `details` prop produced by `resolveTerrainDetails()`.
 */

import DetailRow from './DetailRow';
import TagList from './TagList';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const TerrainDetailsPanel = ({ details }) => {
  if (!details) return null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      {/* ── Key specs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane działki
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="category"       label="Typ działki"    value={details.type} />
            <DetailRow icon="straighten"     label="Wymiary"        value={details.dimensions} />
            <DetailRow icon="directions_car" label="Dojazd"         value={details.access} />
            <DetailRow icon="fence"          label="Ogrodzenie"     value={bool(details.fence)} />
          </ul>
        </div>

        {/* right column: chips */}
        <div>
          <TagList label="Media"    items={details.media} />
          <TagList label="Sąsiedztwo" items={details.vicinity} />
        </div>
      </div>
    </div>
  );
};

export default TerrainDetailsPanel;
