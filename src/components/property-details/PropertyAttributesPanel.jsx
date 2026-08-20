import DetailRow from './DetailRow';
import { getPropertyDetailGroups } from '../../utils/propertyAttributeMetadata';

/** Renders every safe, populated attribute enriched by the provider aggregate. */
const PropertyAttributesPanel = ({ params }) => {
  const groups = getPropertyDetailGroups(params);
  if (groups.length === 0) return null;

  return (
    <section className="mt-24 pt-24 border-t border-outline/10">
      <span className="text-primary font-label text-sm tracking-[0.3em] uppercase mb-6 block">
        Pełne informacje
      </span>
      <h3 className="text-3xl font-headline font-bold text-on-surface mb-12">
        Szczegóły nieruchomości
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
        {groups.map((group) => (
          <section key={group.name}>
            <h4 className="text-[10px] font-label uppercase tracking-widest text-outline mb-6">
              {group.name}
            </h4>
            <ul className="space-y-4">
              {group.rows.map((row) => (
                <DetailRow key={row.key} icon={row.icon} label={row.label} value={row.value} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
};

export default PropertyAttributesPanel;
