/**
 * GarageDetailsPanel
 *
 * Renders resolved details for ObjectName = 6 (Garaż / Garage).
 * Expects a `details` prop produced by `resolveGarageDetails()`.
 */

import DetailRow from './DetailRow';

const bool = (v) => (v === null || v === undefined ? null : v ? 'Tak' : 'Nie');

const GarageDetailsPanel = ({ details }) => {
  if (!details) return null;

  return (
    <div className="mt-24 pt-24 border-t border-outline/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
            Dane garażu
          </h4>
          <ul className="space-y-4">
            <DetailRow icon="location_on"           label="Lokalizacja"  value={details.localization} />
            <DetailRow icon="home_work"              label="Konstrukcja"  value={details.structure} />
            <DetailRow icon="local_fire_department"  label="Ogrzewanie"   value={bool(details.heating)} />
            <DetailRow icon="lightbulb"              label="Oświetlenie"  value={bool(details.lighting)} />
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GarageDetailsPanel;
