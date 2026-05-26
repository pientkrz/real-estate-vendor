/**
 * HallDetailsPanel
 *
 * Renders resolved details for ObjectName = 5 (Magazyn/Hala / Hall).
 * Expects a `details` prop produced by `resolveHallDetails()`.
 */

import DetailRow from './DetailRow';
import TagList from './TagList';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const HallDetailsPanel = ({ details }) => {
  if (!details) return null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      {/* ── Key specs grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Column 1: Structure */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane obiektu
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="warehouse"    label="Konstrukcja"          value={details.structure} />
            <DetailRow icon="build"        label="Stan wykończenia"     value={details.constructionStatus} />
            <DetailRow icon="height"       label="Wysokość (m)"         value={details.height} />
            <DetailRow icon="local_parking" label="Parking"             value={details.parking} />
            <DetailRow icon="grid_on"      label="Posadzka"             value={details.flooring} />
            <DetailRow icon="fence"        label="Ogrodzenie"           value={details.fence} />
          </ul>
        </div>

        {/* Column 2: Amenities */}
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Udogodnienia
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="local_fire_department" label="Ogrzewanie"        value={bool(details.heating)} />
            <DetailRow icon="business_center"       label="Pomieszczenia biurowe" value={bool(details.officeSpace)} />
            <DetailRow icon="wc"                    label="Zaplecze socjalne" value={bool(details.socialFacilities)} />
            <DetailRow icon="ramp_left"             label="Rampa"             value={bool(details.ramp)} />
          </ul>
        </div>
      </div>

      {/* ── Feature chips ───────────────────────────────────────── */}
      <div className="mb-12">
        <TagList label="Przeznaczenie"  items={details.use} />
        <TagList label="Dojazd"         items={details.access} />
        <TagList label="Media"          items={details.media} />
        <TagList label="Zabezpieczenia" items={details.security} />
      </div>
    </div>
  );
};

export default HallDetailsPanel;
