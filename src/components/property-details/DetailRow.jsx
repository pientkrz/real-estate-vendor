/**
 * DetailRow
 *
 * Renders a single labelled field row with a Material Symbol icon.
 * Returns null when `value` is undefined, null, or empty string,
 * so callers don't need to guard every row.
 */

const DetailRow = ({ icon = 'info', label, value }) => {
  if (value === undefined || value === null || value === '') return null;

  return (
    <li className="flex items-start gap-4 text-on-surface">
      <span className="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0">
        {icon}
      </span>
      <div>
        <span className="text-[9px] uppercase tracking-widest text-outline block">{label}</span>
        <span className="text-sm font-body">{String(value)}</span>
      </div>
    </li>
  );
};

export default DetailRow;
