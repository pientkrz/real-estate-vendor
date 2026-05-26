/**
 * TagList
 *
 * Renders an array of string values as small label chips under a section header.
 * Returns null when `items` is empty or undefined.
 */

const TagList = ({ label, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <h5 className="text-[9px] uppercase tracking-widest text-outline mb-3">{label}</h5>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-3 py-1 text-xs font-label border border-outline/10 bg-surface-container-low text-on-surface-variant tracking-wide"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TagList;
